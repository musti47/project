"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const restaurants_service_1 = require("../restaurants/restaurants.service");
const sessions_service_1 = require("../sessions/sessions.service");
let PaymentsService = class PaymentsService {
    prisma;
    realtime;
    sessionsService;
    restaurantsService;
    constructor(prisma, realtime, sessionsService, restaurantsService) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.sessionsService = sessionsService;
        this.restaurantsService = restaurantsService;
    }
    getDb(db) {
        return db ?? this.prisma;
    }
    async createPendingPayment(db, input) {
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
    async assertCustomerPaymentAllowed(sessionId) {
        const { session, table } = await this.sessionsService.validateCurrentOpenSession(sessionId);
        if (!table.paymentEnabled) {
            throw new common_1.BadRequestException('Ödeme şu anda açık değil');
        }
        const financials = await this.sessionsService.getSessionFinancials(session.id);
        if (financials.remainingAmount <= 0) {
            throw new common_1.BadRequestException('Hesap kapalı');
        }
        return {
            session,
            table,
            financials,
            settings: await this.restaurantsService.getSettingsOrThrow(session.restaurantId),
        };
    }
    async getPendingSplitPaymentsBySession(sessionId) {
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
    async findPendingSplitPayments(tableId, user) {
        console.log("🔥 payments called", tableId);
        const table = await this.prisma.table.findFirst({
            where: {
                id: tableId,
                restaurantId: user.restaurantId,
            },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const session = await this.sessionsService.findOpenSessionByTable(tableId);
        if (!session) {
            return [];
        }
        return this.getPendingSplitPaymentsBySession(session.id);
    }
    async createCustomerPayment(sessionId, amount, idempotencyKey) {
        const { session, table, financials, settings } = await this.assertCustomerPaymentAllowed(sessionId);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Geçersiz tutar');
        }
        if (financials.activeSplitPlan) {
            throw new common_1.BadRequestException('Aktif split varken özel tutar ödenemez');
        }
        if (!settings.customerCustomAmountEnabled && amount !== financials.remainingAmount) {
            throw new common_1.BadRequestException('Özel tutar ödeme kapalı');
        }
        if (amount > financials.remainingAmount) {
            throw new common_1.BadRequestException('Fazla ödeme yapılamaz');
        }
        const payment = await this.createPendingPayment(this.prisma, {
            restaurantId: session.restaurantId,
            tableId: table.id,
            sessionId: session.id,
            provider: 'mock',
            idempotencyKey: idempotencyKey || (0, crypto_1.randomUUID)(),
            method: 'ONLINE_CARD',
            splitType: amount === financials.remainingAmount ? 'SETTLEMENT' : 'CUSTOM_AMOUNT',
            amount,
        });
        return this.markAsSucceeded(payment.id, `mock_${Date.now()}`);
    }
    async createEqualSplitForSession(sessionId, personCount) {
        const { session, table, financials, settings } = await this.assertCustomerPaymentAllowed(sessionId);
        if (!settings.splitEnabled) {
            throw new common_1.BadRequestException('Hesap bölme kapalı');
        }
        if (!Number.isFinite(personCount) || personCount < 2) {
            throw new common_1.BadRequestException('Kişi sayısı en az 2 olmalı');
        }
        if (financials.activeSplitPlan) {
            throw new common_1.BadRequestException('Aktif split zaten var');
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
                    idempotencyKey: (0, crypto_1.randomUUID)(),
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
    async payPendingSplitPayment(paymentId, sessionId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.sessionId !== sessionId || payment.splitType !== 'EQUAL_SPLIT') {
            throw new common_1.BadRequestException('Ödeme bu session için geçerli değil');
        }
        await this.assertCustomerPaymentAllowed(sessionId);
        return this.markAsSucceeded(paymentId, `mock_${Date.now()}_${paymentId}`);
    }
    async payItems(sessionId, itemIds, idempotencyKey) {
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            throw new common_1.BadRequestException('Ödenecek ürün seçilmedi');
        }
        const { session, table, financials } = await this.assertCustomerPaymentAllowed(sessionId);
        if (financials.activeSplitPlan) {
            throw new common_1.BadRequestException('Aktif split varken ürün bazlı ödeme yapılamaz');
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
            throw new common_1.BadRequestException('Ödenecek ürünlerden bazıları bulunamadı');
        }
        if (items.some((item) => (item.payments || []).length > 0)) {
            throw new common_1.BadRequestException('Seçilen ürünlerin bir kısmı daha önce ödenmiş');
        }
        const total = items.reduce((sum, item) => sum + item.lineTotalAmount, 0);
        if (total > financials.remainingAmount) {
            throw new common_1.BadRequestException('Fazla ödeme yapılamaz');
        }
        const payment = await this.createPendingPayment(this.prisma, {
            restaurantId: session.restaurantId,
            tableId: table.id,
            sessionId: session.id,
            provider: 'mock',
            idempotencyKey: idempotencyKey || (0, crypto_1.randomUUID)(),
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
    async markAsSucceeded(paymentId, providerPaymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                items: true,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (!payment.sessionId) {
            throw new common_1.BadRequestException('Payment session bulunamadı');
        }
        const { session } = await this.sessionsService.validateCurrentOpenSession(payment.sessionId);
        const financials = await this.sessionsService.getSessionFinancials(payment.sessionId);
        if (payment.status === 'SUCCEEDED') {
            return payment;
        }
        if (payment.status !== 'PENDING') {
            throw new common_1.BadRequestException('Bu ödeme işlenemez');
        }
        if (payment.splitType !== 'ITEM_BASED' && payment.amount > financials.remainingAmount) {
            throw new common_1.BadRequestException('Fazla ödeme engellendi');
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
                throw new common_1.NotFoundException('Payment not found');
            }
            if (updated.count === 0 && freshPayment.status !== 'SUCCEEDED') {
                throw new common_1.BadRequestException('Bu ödeme daha önce işlendi');
            }
            if (freshPayment.splitPlanId && freshPayment.splitType === 'EQUAL_SPLIT') {
                const splitShareId = freshPayment.metadata &&
                    typeof freshPayment.metadata === 'object' &&
                    !Array.isArray(freshPayment.metadata)
                    ? Number(freshPayment.metadata.splitShareId)
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
    async markAsManual(paymentId, method, user) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment || payment.restaurantId !== user.restaurantId) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const settings = await this.restaurantsService.getSettingsOrThrow(payment.restaurantId);
        if (method === 'CASH' && !settings.manualCashEnabled) {
            throw new common_1.BadRequestException('Nakit kapalı');
        }
        if (method === 'POS' && !settings.manualPosEnabled) {
            throw new common_1.BadRequestException('POS kapalı');
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
    async createManualCustomPayment(tableId, amount, method, user) {
        const table = await this.prisma.table.findFirst({
            where: { id: tableId, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const settings = await this.restaurantsService.getSettingsOrThrow(table.restaurantId);
        if (!settings.waiterCustomAmountEnabled) {
            throw new common_1.BadRequestException('Garson özel tutar alamaz');
        }
        if (method === 'CASH' && !settings.manualCashEnabled) {
            throw new common_1.BadRequestException('Nakit kapalı');
        }
        if (method === 'POS' && !settings.manualPosEnabled) {
            throw new common_1.BadRequestException('POS kapalı');
        }
        const session = await this.sessionsService.getOrCreateActiveSession(tableId);
        const financials = await this.sessionsService.getSessionFinancials(session.id);
        if (!table.paymentEnabled) {
            throw new common_1.BadRequestException('Ödeme kapalı');
        }
        if (financials.activeSplitPlan) {
            throw new common_1.BadRequestException('Aktif split varken özel tutar alınamaz');
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Geçersiz tutar');
        }
        if (amount > financials.remainingAmount) {
            throw new common_1.BadRequestException('Fazla ödeme');
        }
        const payment = await this.createPendingPayment(this.prisma, {
            restaurantId: table.restaurantId,
            tableId,
            sessionId: session.id,
            provider: 'manual',
            providerPaymentId: `manual_${Date.now()}`,
            idempotencyKey: (0, crypto_1.randomUUID)(),
            method,
            splitType: amount === financials.remainingAmount ? 'SETTLEMENT' : 'CUSTOM_AMOUNT',
            amount,
        });
        return this.markAsSucceeded(payment.id, payment.providerPaymentId || undefined);
    }
    async settleRemainingManually(tableId, method, user) {
        const table = await this.prisma.table.findFirst({
            where: { id: tableId, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        if (!table.paymentEnabled) {
            throw new common_1.BadRequestException('Ödeme şu anda kapalı');
        }
        const settings = await this.restaurantsService.getSettingsOrThrow(table.restaurantId);
        if (method === 'CASH' && !settings.manualCashEnabled) {
            throw new common_1.BadRequestException('Nakit kapalı');
        }
        if (method === 'POS' && !settings.manualPosEnabled) {
            throw new common_1.BadRequestException('POS kapalı');
        }
        const session = await this.sessionsService.getOrCreateActiveSession(tableId);
        const financials = await this.sessionsService.getSessionFinancials(session.id);
        if (financials.remainingAmount <= 0) {
            throw new common_1.BadRequestException('Hesap kapalı');
        }
        const payment = await this.createPendingPayment(this.prisma, {
            restaurantId: table.restaurantId,
            tableId,
            sessionId: session.id,
            provider: 'manual',
            providerPaymentId: `manual_${Date.now()}`,
            idempotencyKey: (0, crypto_1.randomUUID)(),
            method,
            splitType: 'SETTLEMENT',
            amount: financials.remainingAmount,
        });
        return this.markAsSucceeded(payment.id, payment.providerPaymentId || undefined);
    }
    async cancelSplit(tableId, user) {
        const table = await this.prisma.table.findFirst({
            where: { id: tableId, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const session = await this.sessionsService.findOpenSessionByTable(tableId);
        if (!session) {
            throw new common_1.BadRequestException('Aktif session yok');
        }
        const activeSplitPlan = await this.prisma.splitPlan.findFirst({
            where: {
                sessionId: session.id,
                status: 'ACTIVE',
            },
            orderBy: { id: 'desc' },
        });
        if (!activeSplitPlan) {
            throw new common_1.BadRequestException('Aktif bölünmüş hesap yok');
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
    async webhook(body) {
        if (!body.paymentId) {
            throw new common_1.BadRequestException('paymentId gerekli');
        }
        if (body.status !== 'SUCCEEDED') {
            throw new common_1.BadRequestException('Sadece başarılı webhook destekleniyor');
        }
        return this.markAsSucceeded(body.paymentId, body.providerPaymentId);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway,
        sessions_service_1.SessionsService,
        restaurants_service_1.RestaurantsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map