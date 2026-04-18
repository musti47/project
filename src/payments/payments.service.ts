import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PaymentMethod,
  PaymentSplitType,
  Prisma,
} from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private sessionsService: SessionsService,
    private restaurantsService: RestaurantsService,
  ) { }

  private getDb(db?: Prisma.TransactionClient) {
    return db ?? this.prisma;
  }

  private async createPendingPayment(
    db: Prisma.TransactionClient | PrismaService,
    input: {
      restaurantId: number;
      tableId: number;
      sessionId: string;
      splitPlanId?: number | null;
      provider: string;
      providerPaymentId?: string | null;
      idempotencyKey: string;
      method: PaymentMethod;
      splitType: PaymentSplitType;
      amount: number;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const existing = await db.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true },
    });

    if (existing) {
      return existing;
    }

    return db.payment.create({
      data: {
        restaurantId: input.restaurantId,
        tableId: input.tableId,
        sessionId: input.sessionId,
        splitPlanId: input.splitPlanId ?? null,
        provider: input.provider,
        providerPaymentId: input.providerPaymentId ?? null,
        idempotencyKey: input.idempotencyKey,
        method: input.method,
        splitType: input.splitType,
        amount: Math.round(input.amount),
        currency: 'TRY',
        status: 'PENDING',
        metadata: input.metadata,
      },
      include: { items: true },
    });
  }

  private async assertCustomerPaymentAllowed(sessionId: string) {
    const { session, table } = await this.sessionsService.validateCurrentOpenSession(sessionId);

    if (!table.paymentEnabled) {
      throw new BadRequestException('Ödeme şu anda açık değil');
    }

    const financials = await this.sessionsService.getSessionFinancials(session.id);

    if (financials.remainingAmount <= 0) {
      throw new BadRequestException('Hesap kapalı');
    }

    return {
      session,
      table,
      financials,
      settings: await this.restaurantsService.getSettingsOrThrow(session.restaurantId),
    };
  }
  async getPendingSplitPaymentsBySession(sessionId: string) {
    const session = await this.sessionsService.getSessionByIdOrThrow(sessionId);

    const activeSplitPlan = await this.prisma.splitPlan.findFirst({
      where: {
        sessionId: session.id,
        status: 'ACTIVE',
      },
      orderBy: { id: 'desc' },
    });

    if (!activeSplitPlan) {
      return [];
    }

    return this.prisma.payment.findMany({
      where: {
        sessionId: session.id,
        splitPlanId: activeSplitPlan.id,
        splitType: 'EQUAL_SPLIT',
        status: 'PENDING',
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findPendingSplitPayments(tableId: number, user: AuthUser) {
    console.log("🔥 payments called", tableId);
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId: user.restaurantId,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // 🔥 FIX BURASI
    const session = await this.sessionsService.findOpenSessionByTable(tableId);

    if (!session) {
      return [];
    }

    return this.getPendingSplitPaymentsBySession(session.id);
  }

  async createCustomerPayment(sessionId: string, amount: number, idempotencyKey?: string) {
    const { session, table, financials, settings } = await this.assertCustomerPaymentAllowed(sessionId);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Geçersiz tutar');
    }

    if (financials.activeSplitPlan) {
      throw new BadRequestException('Aktif split varken özel tutar ödenemez');
    }

    if (!settings.customerCustomAmountEnabled && amount !== financials.remainingAmount) {
      throw new BadRequestException('Özel tutar ödeme kapalı');
    }

    if (amount > financials.remainingAmount) {
      throw new BadRequestException('Fazla ödeme yapılamaz');
    }

    const payment = await this.createPendingPayment(this.prisma, {
      restaurantId: session.restaurantId,
      tableId: table.id,
      sessionId: session.id,
      provider: 'mock',
      idempotencyKey: idempotencyKey || randomUUID(),
      method: 'ONLINE_CARD',
      splitType: amount === financials.remainingAmount ? 'SETTLEMENT' : 'CUSTOM_AMOUNT',
      amount,
    });

    return this.markAsSucceeded(payment.id, `mock_${Date.now()}`);
  }

  async createEqualSplitForSession(sessionId: string, personCount: number) {
    const { session, table, financials, settings } = await this.assertCustomerPaymentAllowed(sessionId);

    if (!settings.splitEnabled) {
      throw new BadRequestException('Hesap bölme kapalı');
    }

    if (!Number.isFinite(personCount) || personCount < 2) {
      throw new BadRequestException('Kişi sayısı en az 2 olmalı');
    }

    if (financials.activeSplitPlan) {
      throw new BadRequestException('Aktif split zaten var');
    }

    return this.prisma.$transaction(async (tx) => {
      const splitPlan = await tx.splitPlan.create({
        data: {
          restaurantId: session.restaurantId,
          tableId: table.id,
          sessionId: session.id,
          type: 'EQUAL',
          status: 'ACTIVE',
          personCount,
          totalAmount: financials.remainingAmount,
          remainingAmount: financials.remainingAmount,
        },
      });

      const baseAmount = Math.floor(financials.remainingAmount / personCount);
      const remainder = financials.remainingAmount % personCount;

      for (let index = 0; index < personCount; index += 1) {
        const shareAmount = index === 0 ? baseAmount + remainder : baseAmount;
        const share = await tx.splitShare.create({
          data: {
            splitPlanId: splitPlan.id,
            amount: shareAmount,
            remaining: shareAmount,
            status: 'PENDING',
          },
        });

        await this.createPendingPayment(tx, {
          restaurantId: session.restaurantId,
          tableId: table.id,
          sessionId: session.id,
          splitPlanId: splitPlan.id,
          provider: 'mock',
          idempotencyKey: randomUUID(),
          method: 'ONLINE_CARD',
          splitType: 'EQUAL_SPLIT',
          amount: shareAmount,
          metadata: { splitShareId: share.id },
        });
      }

      await tx.session.update({
        where: { id: session.id },
        data: { billingMode: 'SPLIT_ACTIVE' },
      });

      return splitPlan;
    });
  }

  async payPendingSplitPayment(paymentId: number, sessionId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.sessionId !== sessionId || payment.splitType !== 'EQUAL_SPLIT') {
      throw new BadRequestException('Ödeme bu session için geçerli değil');
    }

    await this.assertCustomerPaymentAllowed(sessionId);
    return this.markAsSucceeded(paymentId, `mock_${Date.now()}_${paymentId}`);
  }

  async payItems(sessionId: string, itemIds: number[], idempotencyKey?: string) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new BadRequestException('Ödenecek ürün seçilmedi');
    }

    const { session, table, financials } = await this.assertCustomerPaymentAllowed(sessionId);

    if (financials.activeSplitPlan) {
      throw new BadRequestException('Aktif split varken ürün bazlı ödeme yapılamaz');
    }

    const items = await this.prisma.orderItem.findMany({
      where: {
        id: { in: itemIds },
        order: {
          sessionId: session.id,
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        order: true,
        payments: true,
      },
    });

    if (items.length !== new Set(itemIds).size) {
      throw new BadRequestException('Ödenecek ürünlerden bazıları bulunamadı');
    }

    if (items.some((item) => (item.payments || []).length > 0)) {
      throw new BadRequestException('Seçilen ürünlerin bir kısmı daha önce ödenmiş');
    }

    const total = items.reduce((sum, item) => sum + item.lineTotalAmount, 0);

    if (total > financials.remainingAmount) {
      throw new BadRequestException('Fazla ödeme yapılamaz');
    }

    const payment = await this.createPendingPayment(this.prisma, {
      restaurantId: session.restaurantId,
      tableId: table.id,
      sessionId: session.id,
      provider: 'mock',
      idempotencyKey: idempotencyKey || randomUUID(),
      method: 'ONLINE_CARD',
      splitType: 'ITEM_BASED',
      amount: total,
    });

    if (payment.status === 'PENDING') {
      await this.prisma.paymentItem.createMany({
        data: items.map((item) => ({
          paymentId: payment.id,
          orderItemId: item.id,
          amount: item.lineTotalAmount,
        })),
      });
    }

    return this.markAsSucceeded(payment.id, `mock_${Date.now()}`);
  }

  async markAsSucceeded(paymentId: number, providerPaymentId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        items: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (!payment.sessionId) {
      throw new BadRequestException('Payment session bulunamadı');
    }

    const { session } = await this.sessionsService.validateCurrentOpenSession(payment.sessionId);
    const financials = await this.sessionsService.getSessionFinancials(payment.sessionId);

    if (payment.status === 'SUCCEEDED') {
      return payment;
    }

    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Bu ödeme işlenemez');
    }

    if (payment.splitType !== 'ITEM_BASED' && payment.amount > financials.remainingAmount) {
      throw new BadRequestException('Fazla ödeme engellendi');
    }

    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: 'PENDING',
        },
        data: {
          status: 'SUCCEEDED',
          providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
        },
      });

      const freshPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { items: true },
      });

      if (!freshPayment) {
        throw new NotFoundException('Payment not found');
      }

      if (updated.count === 0 && freshPayment.status !== 'SUCCEEDED') {
        throw new BadRequestException('Bu ödeme daha önce işlendi');
      }

      if (freshPayment.splitPlanId && freshPayment.splitType === 'EQUAL_SPLIT') {
        const splitShareId =
          freshPayment.metadata &&
            typeof freshPayment.metadata === 'object' &&
            !Array.isArray(freshPayment.metadata)
            ? Number((freshPayment.metadata as Record<string, unknown>).splitShareId)
            : null;

        if (splitShareId) {
          await tx.splitShare.update({
            where: { id: splitShareId },
            data: {
              remaining: 0,
              status: 'PAID',
              paidByPaymentId: freshPayment.id,
            },
          });
        }
      }

      await this.sessionsService.syncSessionLifecycle(session.id, tx);

      return freshPayment;
    });

    this.realtime.sendTableUpdate(payment.tableId, {
      type: 'PAYMENT_UPDATED',
      paymentId: updatedPayment.id,
      tableId: payment.tableId,
      sessionId: payment.sessionId,
    });

    return updatedPayment;
  }

  async markAsManual(paymentId: number, method: PaymentMethod, user: AuthUser) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.restaurantId !== user.restaurantId) {
      throw new NotFoundException('Payment not found');
    }

    const settings = await this.restaurantsService.getSettingsOrThrow(payment.restaurantId);

    if (method === 'CASH' && !settings.manualCashEnabled) {
      throw new BadRequestException('Nakit kapalı');
    }

    if (method === 'POS' && !settings.manualPosEnabled) {
      throw new BadRequestException('POS kapalı');
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        provider: 'manual',
        method,
      },
    });

    return this.markAsSucceeded(paymentId, `manual_${Date.now()}`);
  }

  async createManualCustomPayment(
    tableId: number,
    amount: number,
    method: PaymentMethod,
    user: AuthUser,
  ) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const settings = await this.restaurantsService.getSettingsOrThrow(table.restaurantId);

    if (!settings.waiterCustomAmountEnabled) {
      throw new BadRequestException('Garson özel tutar alamaz');
    }

    if (method === 'CASH' && !settings.manualCashEnabled) {
      throw new BadRequestException('Nakit kapalı');
    }

    if (method === 'POS' && !settings.manualPosEnabled) {
      throw new BadRequestException('POS kapalı');
    }

    const session = await this.sessionsService.getOrCreateActiveSession(tableId);
    const financials = await this.sessionsService.getSessionFinancials(session.id);

    if (!table.paymentEnabled) {
      throw new BadRequestException('Ödeme kapalı');
    }

    if (financials.activeSplitPlan) {
      throw new BadRequestException('Aktif split varken özel tutar alınamaz');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Geçersiz tutar');
    }

    if (amount > financials.remainingAmount) {
      throw new BadRequestException('Fazla ödeme');
    }

    const payment = await this.createPendingPayment(this.prisma, {
      restaurantId: table.restaurantId,
      tableId,
      sessionId: session.id,
      provider: 'manual',
      providerPaymentId: `manual_${Date.now()}`,
      idempotencyKey: randomUUID(),
      method,
      splitType: amount === financials.remainingAmount ? 'SETTLEMENT' : 'CUSTOM_AMOUNT',
      amount,
    });

    return this.markAsSucceeded(payment.id, payment.providerPaymentId || undefined);
  }

  async settleRemainingManually(tableId: number, method: PaymentMethod, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (!table.paymentEnabled) {
      throw new BadRequestException('Ödeme şu anda kapalı');
    }

    const settings = await this.restaurantsService.getSettingsOrThrow(table.restaurantId);

    if (method === 'CASH' && !settings.manualCashEnabled) {
      throw new BadRequestException('Nakit kapalı');
    }

    if (method === 'POS' && !settings.manualPosEnabled) {
      throw new BadRequestException('POS kapalı');
    }

    const session = await this.sessionsService.getOrCreateActiveSession(tableId);
    const financials = await this.sessionsService.getSessionFinancials(session.id);

    if (financials.remainingAmount <= 0) {
      throw new BadRequestException('Hesap kapalı');
    }

    const payment = await this.createPendingPayment(this.prisma, {
      restaurantId: table.restaurantId,
      tableId,
      sessionId: session.id,
      provider: 'manual',
      providerPaymentId: `manual_${Date.now()}`,
      idempotencyKey: randomUUID(),
      method,
      splitType: 'SETTLEMENT',
      amount: financials.remainingAmount,
    });

    return this.markAsSucceeded(payment.id, payment.providerPaymentId || undefined);
  }

  async cancelSplit(tableId: number, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const session = await this.sessionsService.findOpenSessionByTable(tableId);
    if (!session) {
      throw new BadRequestException('Aktif session yok');
    }

    const activeSplitPlan = await this.prisma.splitPlan.findFirst({
      where: {
        sessionId: session.id,
        status: 'ACTIVE',
      },
      orderBy: { id: 'desc' },
    });

    if (!activeSplitPlan) {
      throw new BadRequestException('Aktif bölünmüş hesap yok');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.splitShare.updateMany({
        where: {
          splitPlanId: activeSplitPlan.id,
          status: 'PENDING',
        },
        data: {
          status: 'VOID',
          remaining: 0,
        },
      });

      await tx.payment.updateMany({
        where: {
          splitPlanId: activeSplitPlan.id,
          status: 'PENDING',
        },
        data: {
          status: 'VOID',
        },
      });

      await tx.splitPlan.update({
        where: { id: activeSplitPlan.id },
        data: {
          status: 'CANCELLED',
          remainingAmount: 0,
        },
      });

      await tx.session.update({
        where: { id: session.id },
        data: {
          billingMode: 'NORMAL',
        },
      });
    });

    this.realtime.sendTableUpdate(tableId, {
      type: 'SPLIT_CANCELLED',
      tableId,
      sessionId: session.id,
    });

    return { success: true };
  }

  async webhook(body: {
    paymentId?: number;
    providerPaymentId?: string;
    status?: 'SUCCEEDED' | 'FAILED' | 'PENDING';
  }) {
    if (!body.paymentId) {
      throw new BadRequestException('paymentId gerekli');
    }

    if (body.status !== 'SUCCEEDED') {
      throw new BadRequestException('Sadece başarılı webhook destekleniyor');
    }

    return this.markAsSucceeded(body.paymentId, body.providerPaymentId);
  }
}
