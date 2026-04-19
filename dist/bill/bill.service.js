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
exports.BillService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sessions_service_1 = require("../sessions/sessions.service");
let BillService = class BillService {
    prisma;
    sessionsService;
    constructor(prisma, sessionsService) {
        this.prisma = prisma;
        this.sessionsService = sessionsService;
    }
    async buildBillPayload(sessionId) {
        const session = await this.sessionsService.getSessionByIdOrThrow(sessionId);
        const table = session.table;
        const financials = await this.sessionsService.getSessionFinancials(session.id);
        const total = Number(financials.totalAmount || 0);
        const paid = Number(financials.paidAmount || 0);
        const remaining = Math.max(total - paid, 0);
        const isBillClosed = session.status === 'CLOSED' ||
            (total > 0 && remaining <= 0);
        return {
            tableId: table.id,
            tableNumber: table.number,
            sessionId: session.id,
            paymentEnabled: table.paymentEnabled,
            billRequested: table.billRequested,
            billingMode: isBillClosed ? 'CLOSED' : session.billingMode,
            splitActive: !!financials.activeSplitPlan,
            totalOrders: total,
            paidAmount: paid,
            remaining: remaining,
        };
    }
    async getSessionBill(sessionId) {
        return this.buildBillPayload(sessionId);
    }
    async getTableBill(tableId) {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const session = await this.sessionsService.findOpenSessionByTable(tableId);
        if (!session) {
            return {
                tableId,
                tableNumber: table.number,
                sessionId: null,
                paymentEnabled: table.paymentEnabled,
                billRequested: table.billRequested,
                billingMode: 'CLOSED',
                splitActive: false,
                totalOrders: 0,
                paidAmount: 0,
                remaining: 0,
            };
        }
        return this.buildBillPayload(session.id);
    }
    async getByToken(token) {
        const table = await this.prisma.table.findUnique({
            where: { token },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const session = await this.sessionsService.getActiveSessionByTable(table.id);
        if (!session) {
            return {
                tableId: table.id,
                tableNumber: table.number,
                sessionId: null,
                paymentEnabled: table.paymentEnabled,
                billRequested: table.billRequested,
                billingMode: 'CLOSED',
                splitActive: false,
                totalOrders: 0,
                paidAmount: 0,
                remaining: 0,
            };
        }
        return this.buildBillPayload(session.id);
    }
};
exports.BillService = BillService;
exports.BillService = BillService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sessions_service_1.SessionsService])
], BillService);
//# sourceMappingURL=bill.service.js.map