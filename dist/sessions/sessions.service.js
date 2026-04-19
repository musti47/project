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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let SessionsService = class SessionsService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    getDb(db) {
        return db ?? this.prisma;
    }
    async getTableOrThrow(tableId, db) {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        return table;
    }
    async getTableByTokenOrThrow(token, db) {
        const table = await this.getDb(db).table.findUnique({
            where: { token },
        });
        if (!table) {
            throw new common_1.NotFoundException('Masa bulunamadı');
        }
        return table;
    }
    async getSessionByIdOrThrow(sessionId, db) {
        const session = await this.getDb(db).session.findUnique({
            where: { id: sessionId },
            include: {
                table: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session bulunamadı');
        }
        return session;
    }
    async findOpenSessionByTable(tableId, db) {
        return this.getDb(db).session.findFirst({
            where: {
                tableId,
                status: 'OPEN',
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                table: true,
            },
        });
    }
    async getActiveSessionByTable(tableId, db) {
        const tx = this.getDb(db);
        const sessions = await tx.session.findMany({
            where: {
                tableId,
                status: 'OPEN',
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                table: true,
            },
        });
        let session = sessions[0] ?? null;
        if (sessions.length > 1) {
            const duplicateIds = sessions.slice(1).map((item) => item.id);
            await tx.session.updateMany({
                where: {
                    id: {
                        in: duplicateIds,
                    },
                },
                data: {
                    status: 'CLOSED',
                    billingMode: 'CLOSED',
                    closedAt: new Date(),
                },
            });
        }
        if (!session) {
            const table = await this.getTableOrThrow(tableId, db);
            session = await tx.session.create({
                data: {
                    tableId,
                    restaurantId: table.restaurantId,
                    status: 'OPEN',
                    billingMode: 'NORMAL',
                },
                include: {
                    table: true,
                },
            });
        }
        return session;
    }
    async validateCurrentOpenSession(sessionId, db) {
        const session = await this.getSessionByIdOrThrow(sessionId, db);
        if (session.status !== 'OPEN') {
            throw new common_1.BadRequestException('Session kapalı');
        }
        const currentSession = await this.getActiveSessionByTable(session.tableId);
        if (!currentSession || currentSession.id !== session.id) {
            return {
                session: currentSession,
                table: currentSession?.table,
            };
        }
        return {
            session,
            table: session.table,
        };
    }
    async getOrCreateActiveSession(tableId, db) {
        const tx = this.getDb(db);
        const table = await this.getTableOrThrow(tableId, db);
        const existing = await this.findOpenSessionByTable(tableId, db);
        if (existing) {
            if (table.status !== 'OCCUPIED') {
                await tx.table.update({
                    where: { id: tableId },
                    data: {
                        status: 'OCCUPIED',
                    },
                });
            }
            return existing;
        }
        const session = await tx.session.create({
            data: {
                tableId,
                restaurantId: table.restaurantId,
                status: 'OPEN',
                billingMode: 'NORMAL',
            },
            include: {
                table: true,
            },
        });
        await tx.table.update({
            where: { id: tableId },
            data: {
                status: 'OCCUPIED',
                paymentEnabled: false,
                billRequested: false,
                billRequestedAt: null,
            },
        });
        return session;
    }
    getPaymentAmount(payment) {
        if (payment.splitType === 'ITEM_BASED') {
            return (payment.items || []).reduce((sum, item) => sum + Math.round(Number(item.amount || 0)), 0);
        }
        return payment.amount || 0;
    }
    async getSessionFinancials(sessionId, db) {
        const tx = this.getDb(db);
        const [orders, payments, activeSplitPlan] = await Promise.all([
            tx.order.findMany({
                where: {
                    sessionId,
                    status: {
                        not: 'CANCELLED',
                    },
                },
                include: {
                    items: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            tx.payment.findMany({
                where: {
                    sessionId,
                    status: 'SUCCEEDED',
                },
                include: {
                    items: true,
                },
            }),
            tx.splitPlan.findFirst({
                where: {
                    sessionId,
                    status: 'ACTIVE',
                },
                orderBy: {
                    id: 'desc',
                },
            }),
        ]);
        const paidItemIds = new Set(payments.flatMap((payment) => (payment.items || []).map((item) => item.orderItemId)));
        const ordersWithComputedTotals = orders.map((order) => {
            const computedTotal = (order.items || []).reduce((sum, item) => sum + (item.lineTotalAmount || 0), 0);
            return {
                ...order,
                totalAmount: computedTotal,
            };
        });
        const totalAmount = ordersWithComputedTotals.reduce((sum, order) => sum + order.totalAmount, 0);
        const paidAmount = payments.reduce((sum, payment) => sum + this.getPaymentAmount(payment), 0);
        const remainingAmount = Math.max(totalAmount - paidAmount, 0);
        return {
            orders: ordersWithComputedTotals,
            payments,
            activeSplitPlan,
            totalAmount,
            paidAmount,
            remainingAmount,
            paidItemIds,
        };
    }
    async getPublicSessionState(sessionId, db) {
        const session = await this.getSessionByIdOrThrow(sessionId, db);
        const table = session.table;
        const financials = await this.getSessionFinancials(session.id, db);
        return {
            sessionId: session.id,
            status: session.status,
            restaurantId: session.restaurantId,
            table: {
                id: table.id,
                number: table.number,
                token: table.token,
                status: table.status,
                paymentEnabled: table.paymentEnabled,
                billRequested: table.billRequested,
            },
            billingMode: session.status === 'CLOSED' || financials.remainingAmount <= 0
                ? 'CLOSED'
                : session.billingMode,
            splitActive: !!financials.activeSplitPlan,
            totalAmount: financials.totalAmount,
            paidAmount: financials.paidAmount,
            remainingAmount: financials.remainingAmount,
        };
    }
    async syncSessionLifecycle(sessionId, db) {
        const tx = this.getDb(db);
        const { session, table } = await this.validateCurrentOpenSession(sessionId, db);
        const financials = await this.getSessionFinancials(session.id, db);
        if (financials.activeSplitPlan) {
            await tx.splitPlan.update({
                where: { id: financials.activeSplitPlan.id },
                data: {
                    remainingAmount: financials.remainingAmount,
                },
            });
        }
        if (financials.remainingAmount > 0) {
            if (table.status !== 'OCCUPIED') {
                await tx.table.update({
                    where: { id: table.id },
                    data: { status: 'OCCUPIED' },
                });
            }
            return {
                sessionClosed: false,
                remainingAmount: financials.remainingAmount,
            };
        }
        if (financials.activeSplitPlan) {
            await tx.splitShare.updateMany({
                where: {
                    splitPlanId: financials.activeSplitPlan.id,
                    status: 'PENDING',
                },
                data: {
                    status: 'VOID',
                    remaining: 0,
                },
            });
            await tx.payment.updateMany({
                where: {
                    splitPlanId: financials.activeSplitPlan.id,
                    status: 'PENDING',
                },
                data: {
                    status: 'VOID',
                },
            });
            await tx.splitPlan.update({
                where: { id: financials.activeSplitPlan.id },
                data: {
                    status: 'COMPLETED',
                    remainingAmount: 0,
                },
            });
        }
        await tx.session.update({
            where: { id: session.id },
            data: {
                status: 'CLOSED',
                billingMode: 'CLOSED',
                closedAt: session.closedAt ?? new Date(),
            },
        });
        await tx.table.update({
            where: { id: table.id },
            data: {
                status: 'DIRTY',
                paymentEnabled: false,
                billRequested: false,
                billRequestedAt: null,
            },
        });
        this.realtime.sendTableUpdate(table.id, {
            type: 'SESSION_UPDATED',
            tableId: table.id,
            sessionId: session.id,
        });
        return {
            sessionClosed: true,
            remainingAmount: 0,
        };
    }
    async create(tableId) {
        return this.getOrCreateActiveSession(tableId);
    }
    async createForRestaurant(tableId, restaurantId) {
        const table = await this.getTableOrThrow(tableId);
        if (table.restaurantId !== restaurantId) {
            throw new common_1.NotFoundException('Table not found');
        }
        return this.getOrCreateActiveSession(tableId);
    }
    async createFromTableToken(tableToken) {
        const table = await this.getTableByTokenOrThrow(tableToken);
        let session = await this.findOpenSessionByTable(table.id);
        if (!session || session.status === 'CLOSED') {
            session = await this.getOrCreateActiveSession(table.id);
        }
        if (!session) {
            throw new common_1.BadRequestException('Session oluşturulamadı');
        }
        const state = await this.getPublicSessionState(session.id);
        return {
            ...state,
            token: session.id,
        };
    }
    async closeSessionIfSettled(sessionId, db) {
        const tx = this.getDb(db);
        const financials = await this.getSessionFinancials(sessionId, db);
        if (financials.remainingAmount > 0) {
            return {
                sessionClosed: false,
                remainingAmount: financials.remainingAmount,
            };
        }
        const session = await this.getSessionByIdOrThrow(sessionId, db);
        await tx.session.update({
            where: { id: session.id },
            data: {
                status: 'CLOSED',
                billingMode: 'CLOSED',
                closedAt: session.closedAt ?? new Date(),
            },
        });
        return {
            sessionClosed: true,
            remainingAmount: 0,
        };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, realtime_gateway_1.RealtimeGateway])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map