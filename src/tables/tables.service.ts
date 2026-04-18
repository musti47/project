import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private sessionsService: SessionsService,
    private restaurantsService: RestaurantsService,
  ) {}

  async findAll(user: AuthUser) {
    const tables = await this.prisma.table.findMany({
      where: {
        restaurantId: user.restaurantId,
      },
      orderBy: { number: 'asc' },
      include: {
        sessions: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return Promise.all(
      tables.map(async (table) => {
        const activeSession = table.sessions[0] ?? null;
        const financials = activeSession
          ? await this.sessionsService.getSessionFinancials(activeSession.id)
          : null;

        return {
          id: table.id,
          restaurantId: table.restaurantId,
          number: table.number,
          token: table.token,
          status: activeSession ? 'OCCUPIED' : table.status,
          paymentEnabled: table.paymentEnabled,
          billRequested: table.billRequested,
          activeSessionId: activeSession?.id ?? null,
          billingMode: activeSession?.billingMode ?? 'CLOSED',
          splitActive: !!financials?.activeSplitPlan,
          totalAmount: financials?.totalAmount ?? 0,
          paidAmount: financials?.paidAmount ?? 0,
          remainingAmount: financials?.remainingAmount ?? 0,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
        };
      }),
    );
  }

  async create(number: number, user: AuthUser) {
    if (!Number.isFinite(number) || number <= 0) {
      throw new BadRequestException('Geçersiz masa numarası');
    }

    const existing = await this.prisma.table.findFirst({
      where: {
        restaurantId: user.restaurantId,
        number,
      },
    });

    if (existing) {
      throw new BadRequestException('Bu masa numarası zaten var');
    }

    return this.prisma.table.create({
      data: {
        restaurantId: user.restaurantId,
        number,
        token: randomUUID(),
        status: 'AVAILABLE',
        paymentEnabled: false,
        billRequested: false,
      },
    });
  }

  async delete(id: number, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.prisma.table.delete({
      where: { id },
    });
  }

  async enablePayment(id: number, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const session = await this.sessionsService.getOrCreateActiveSession(id);
    const financials = await this.sessionsService.getSessionFinancials(session.id);

    if (financials.remainingAmount <= 0) {
      throw new BadRequestException('Ödenecek tutar kalmadı');
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: {
        paymentEnabled: true,
        billRequested: false,
        billRequestedAt: null,
      },
    });

    this.realtime.sendTableUpdate(id, {
      type: 'PAYMENT_ENABLED',
      tableId: id,
      sessionId: session.id,
    });

    return updated;
  }

  async disablePayment(id: number, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: { paymentEnabled: false },
    });

    this.realtime.sendTableUpdate(id, {
      type: 'PAYMENT_DISABLED',
      tableId: id,
    });

    return updated;
  }

  async requestBillForSession(sessionId: string) {
    const { table, session } = await this.sessionsService.validateCurrentOpenSession(sessionId);
    const settings = await this.restaurantsService.getSettingsOrThrow(session.restaurantId);

    if (!settings.billRequestEnabled) {
      throw new BadRequestException('Hesap isteme kapalı');
    }

    const financials = await this.sessionsService.getSessionFinancials(session.id);

    if (financials.totalAmount <= 0 || financials.remainingAmount <= 0) {
      throw new BadRequestException('İstenebilecek açık hesap bulunamadı');
    }

    const updated = await this.prisma.table.update({
      where: { id: table.id },
      data: {
        billRequested: true,
        billRequestedAt: new Date(),
      },
    });

    this.realtime.sendTableUpdate(table.id, {
      type: 'BILL_REQUESTED',
      tableId: table.id,
      sessionId: session.id,
    });

    return updated;
  }

  async requestBill(id: number, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: {
        id,
        restaurantId: user.restaurantId,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const session = await this.sessionsService.getActiveSessionByTable(id);

    if (!session) {
      throw new BadRequestException('Aktif session yok');
    }

    return this.requestBillForSession(session.id);
  }

  async closeBill(tableId: number, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const session = await this.sessionsService.findOpenSessionByTable(tableId);

    if (!session) {
      return this.prisma.table.update({
        where: { id: tableId },
        data: {
          paymentEnabled: false,
          billRequested: false,
          billRequestedAt: null,
        },
      });
    }

    const financials = await this.sessionsService.getSessionFinancials(session.id);

    if (financials.remainingAmount > 0) {
      throw new BadRequestException('Açık bakiye varken hesap kapatılamaz');
    }

    await this.sessionsService.closeSessionIfSettled(session.id);

    this.realtime.sendTableUpdate(tableId, {
      type: 'BILL_CLOSED',
      tableId,
      sessionId: session.id,
      billingMode: 'CLOSED',
    });

    return { success: true };
  }

  async cleanTable(id: number, user: AuthUser) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId: user.restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const activeSession = await this.sessionsService.getActiveSessionByTable(id);

    if (activeSession) {
      const financials = await this.sessionsService.getSessionFinancials(activeSession.id);

      if (financials.remainingAmount > 0) {
        throw new BadRequestException('Açık hesap varken masa temizlenemez');
      }

      await this.sessionsService.closeSessionIfSettled(activeSession.id);
    }

    await this.prisma.table.update({
      where: { id },
      data: {
        status: 'AVAILABLE',
        paymentEnabled: false,
        billRequested: false,
        billRequestedAt: null,
      },
    });

    this.realtime.sendTableUpdate(id, {
      type: 'TABLE_CLEANED',
      tableId: id,
    });

    return { success: true };
  }
}
