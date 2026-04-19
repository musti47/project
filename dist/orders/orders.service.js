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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const print_service_1 = require("../print/print.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const sessions_service_1 = require("../sessions/sessions.service");
let OrdersService = class OrdersService {
    prisma;
    realtime;
    sessionsService;
    printService;
    constructor(prisma, realtime, sessionsService, printService) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.sessionsService = sessionsService;
        this.printService = printService;
    }
    findAll(user) {
        return this.prisma.order.findMany({
            where: {
                restaurantId: user.restaurantId,
            },
            include: {
                items: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findBySessionId(sessionId) {
        const session = await this.sessionsService.getSessionByIdOrThrow(sessionId);
        const financials = await this.sessionsService.getSessionFinancials(session.id);
        if (session.status === 'CLOSED' || financials.remainingAmount <= 0) {
            return [];
        }
        return financials.orders
            .map((order) => ({
            ...order,
            items: (order.items || []).filter((item) => !financials.paidItemIds.has(item.id)),
        }))
            .filter((order) => (order.items || []).length > 0);
    }
    async findByTableId(tableId, user) {
        const activeSession = await this.prisma.session.findFirst({
            where: {
                tableId,
                restaurantId: user.restaurantId,
                status: 'OPEN',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!activeSession) {
            return [];
        }
        return this.prisma.order.findMany({
            where: {
                tableId,
                restaurantId: user.restaurantId,
                sessionId: activeSession.id,
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
        });
    }
    async create(tableId, user) {
        const table = await this.prisma.table.findFirst({
            where: { id: tableId, restaurantId: user.restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        const session = await this.sessionsService.getOrCreateActiveSession(tableId);
        return this.prisma.order.create({
            data: {
                tableId,
                restaurantId: table.restaurantId,
                sessionId: session.id,
                status: 'OPEN',
                source: 'IN_STORE',
            },
        });
    }
    async createCustomerOrder(sessionId, items, idempotencyKey) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new common_1.BadRequestException('Sipariş sepeti boş');
        }
        const { session, table } = await this.sessionsService.validateCurrentOpenSession(sessionId);
        const normalizedItems = items.map((item) => ({
            menuItemId: Number(item.menuItemId),
            quantity: Math.max(1, Math.min(50, Math.round(Number(item.quantity) || 0))),
            note: item.note?.trim() || null,
        }));
        if (normalizedItems.some((item) => !item.menuItemId || !item.quantity)) {
            throw new common_1.BadRequestException('Sipariş kalemleri geçersiz');
        }
        const menuItems = await this.prisma.menuItem.findMany({
            where: {
                id: {
                    in: normalizedItems.map((item) => item.menuItemId),
                },
                restaurantId: session.restaurantId,
                isAvailable: true,
            },
        });
        if (menuItems.length !== new Set(normalizedItems.map((item) => item.menuItemId)).size) {
            throw new common_1.BadRequestException('Sepette geçersiz ürün var');
        }
        const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
        const mergedItems = normalizedItems.reduce((acc, item) => {
            const existing = acc.find((row) => row.menuItemId === item.menuItemId && row.note === item.note);
            if (existing) {
                existing.quantity += item.quantity;
            }
            else {
                acc.push({ ...item });
            }
            return acc;
        }, []);
        return this.prisma.$transaction(async (tx) => {
            if (idempotencyKey) {
                const existing = await tx.order.findFirst({
                    where: {
                        sessionId: session.id,
                        externalProvider: 'CUSTOMER_APP',
                        externalOrderId: idempotencyKey,
                    },
                    include: {
                        items: true,
                    },
                });
                if (existing) {
                    return existing;
                }
            }
            const order = await tx.order.create({
                data: {
                    tableId: table.id,
                    restaurantId: session.restaurantId,
                    sessionId: session.id,
                    status: 'OPEN',
                    source: 'QR',
                    externalProvider: idempotencyKey ? 'CUSTOMER_APP' : null,
                    externalOrderId: idempotencyKey ?? null,
                },
            });
            let totalAmount = 0;
            for (const row of mergedItems) {
                const menuItem = menuItemMap.get(row.menuItemId);
                const lineTotalAmount = menuItem.priceAmount * row.quantity;
                totalAmount += lineTotalAmount;
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        menuItemId: menuItem.id,
                        quantity: row.quantity,
                        nameSnapshot: menuItem.name,
                        unitPriceAmount: menuItem.priceAmount,
                        lineTotalAmount,
                        note: row.note,
                    },
                });
            }
            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: { totalAmount },
                include: {
                    items: true,
                },
            });
            this.realtime.sendTableUpdate(table.id, {
                type: 'ORDER_CREATED',
                tableId: table.id,
                sessionId: session.id,
                order: updatedOrder,
            });
            return updatedOrder;
        });
    }
    async delete(id, user) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });
        if (!order || order.restaurantId !== user.restaurantId) {
            throw new common_1.NotFoundException('Order not found');
        }
        return this.prisma.order.delete({
            where: { id },
        });
    }
    async addItem(orderId, menuItemId, quantity, user, note) {
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new common_1.BadRequestException('Geçerli adet gerekli');
        }
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                session: true,
            },
        });
        if (!order || order.restaurantId !== user.restaurantId) {
            throw new common_1.NotFoundException('Order bulunamadı');
        }
        if (!order.sessionId || !order.session || order.session.status !== 'OPEN') {
            throw new common_1.BadRequestException('Kapalı session siparişine ürün eklenemez');
        }
        const menuItem = await this.prisma.menuItem.findFirst({
            where: {
                id: menuItemId,
                restaurantId: user.restaurantId,
                isAvailable: true,
            },
        });
        if (!menuItem) {
            throw new common_1.NotFoundException('Ürün bulunamadı');
        }
        const trimmedNote = note?.trim() || null;
        const existingItem = await this.prisma.orderItem.findFirst({
            where: {
                orderId,
                menuItemId,
                note: trimmedNote,
            },
        });
        if (existingItem) {
            await this.prisma.orderItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                    lineTotalAmount: (existingItem.quantity + quantity) * menuItem.priceAmount,
                },
            });
        }
        else {
            await this.prisma.orderItem.create({
                data: {
                    orderId,
                    menuItemId,
                    quantity,
                    nameSnapshot: menuItem.name,
                    unitPriceAmount: menuItem.priceAmount,
                    lineTotalAmount: menuItem.priceAmount * quantity,
                    note: trimmedNote,
                },
            });
        }
        const orderItems = await this.prisma.orderItem.findMany({
            where: { orderId },
        });
        const totalAmount = orderItems.reduce((sum, item) => sum + (item.lineTotalAmount || 0), 0);
        await this.prisma.order.update({
            where: { id: orderId },
            data: { totalAmount },
        });
        const fullOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        this.realtime.sendTableUpdate(order.tableId, {
            type: 'ORDER_UPDATED',
            tableId: order.tableId,
            order: fullOrder,
        });
        return { success: true };
    }
    async printKitchenReceipt(orderId) {
        await this.printService.printOrderIfNeeded(orderId);
        return { success: true };
    }
    async updateStatus(id, status, user) {
        const allowed = [
            'OPEN',
            'CONFIRMED',
            'PREPARING',
            'READY',
            'DELIVERED',
            'CANCELLED',
        ];
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException('Geçersiz status');
        }
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                session: true,
                restaurant: {
                    include: {
                        settings: true,
                    },
                },
            },
        });
        if (!order || order.restaurantId !== user.restaurantId) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (!order.sessionId || !order.session || order.session.status !== 'OPEN') {
            throw new common_1.BadRequestException('Sipariş kapalı oturuma ait');
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: status,
            },
        });
        if (updatedOrder.status === 'CONFIRMED' && order.restaurant?.settings?.kitchenPrintEnabled) {
            await this.printService.printOrderIfNeeded(order.id);
        }
        const fullOrder = await this.prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true },
        });
        this.realtime.sendTableUpdate(order.tableId, {
            type: 'ORDER_STATUS_UPDATED',
            tableId: order.tableId,
            order: fullOrder,
        });
        return updatedOrder;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway,
        sessions_service_1.SessionsService,
        print_service_1.PrintService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map