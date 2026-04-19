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
exports.TablesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const restaurants_service_1 = require("../restaurants/restaurants.service");
const sessions_service_1 = require("../sessions/sessions.service");
let TablesService = class TablesService {
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
    async findAll(user) {
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
        return Promise.all(tables.map(async (table) => {
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
        }));
    }
    async create(number, user) {
        if (!Number.isFinite(number) || number <= 0) {
            throw new common_1.BadRequestException('Geçersiz masa numarası');
        }
        const existing = await this.prisma.table.findFirst({
            where: {
                restaurantId: user.restaurantId,
                number,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Bu masa numarası zaten var');
        }
        return this.prisma.table.create({
            data: {
                restaurantId: user.restaurantId,
                number,
                token: (0, crypto_1.randomUUID)(),
                status: 'AVAILABLE',
                paymentEnabled: false,
                billRequested: false,
            },
        });
    }
    async delete(id, user) {
        const table = await this.prisma.table.findFirst({
            where: { id, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        return this.prisma.table.delete({
            where: { id },
        });
    }
    async enablePayment(id, user) {
        const table = await this.prisma.table.findFirst({
            where: { id, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const session = await this.sessionsService.getOrCreateActiveSession(id);
        const financials = await this.sessionsService.getSessionFinancials(session.id);
        if (financials.remainingAmount <= 0) {
            throw new common_1.BadRequestException('Ödenecek tutar kalmadı');
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
    async disablePayment(id, user) {
        const table = await this.prisma.table.findFirst({
            where: { id, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
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
    async requestBillForSession(sessionId) {
        const { table, session } = await this.sessionsService.validateCurrentOpenSession(sessionId);
        const settings = await this.restaurantsService.getSettingsOrThrow(session.restaurantId);
        if (!settings.billRequestEnabled) {
            throw new common_1.BadRequestException('Hesap isteme kapalı');
        }
        const financials = await this.sessionsService.getSessionFinancials(session.id);
        if (financials.totalAmount <= 0 || financials.remainingAmount <= 0) {
            throw new common_1.BadRequestException('İstenebilecek açık hesap bulunamadı');
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
    async requestBill(id, user) {
        const table = await this.prisma.table.findFirst({
            where: {
                id,
                restaurantId: user.restaurantId,
            },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const session = await this.sessionsService.getActiveSessionByTable(id);
        if (!session) {
            throw new common_1.BadRequestException('Aktif session yok');
        }
        return this.requestBillForSession(session.id);
    }
    async closeBill(tableId, user) {
        const table = await this.prisma.table.findFirst({
            where: { id: tableId, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
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
            throw new common_1.BadRequestException('Açık bakiye varken hesap kapatılamaz');
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
    async cleanTable(id, user) {
        const table = await this.prisma.table.findFirst({
            where: { id, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const activeSession = await this.sessionsService.getActiveSessionByTable(id);
        if (activeSession) {
            const financials = await this.sessionsService.getSessionFinancials(activeSession.id);
            if (financials.remainingAmount > 0) {
                throw new common_1.BadRequestException('Açık hesap varken masa temizlenemez');
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
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway,
        sessions_service_1.SessionsService,
        restaurants_service_1.RestaurantsService])
], TablesService);
//# sourceMappingURL=tables.service.js.map