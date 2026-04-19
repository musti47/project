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
exports.PrintService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PrintService = class PrintService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    formatReceipt(order) {
        let output = '';
        output += '--- PAYBITE ---\n';
        output += `Masa: ${order.tableId}\n\n`;
        order.items?.forEach((item) => {
            output += `${item.menuItem?.name || item.nameSnapshot} x${item.quantity}\n`;
            if (item.note) {
                output += `  > ${item.note}\n`;
            }
        });
        output += '\n';
        output += `Toplam: ${order.totalAmount || 0}₺\n`;
        output += '--------------\n';
        return output;
    }
    async printOrderIfNeeded(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                restaurant: {
                    include: {
                        settings: true,
                    },
                },
                items: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });
        if (!order)
            return;
        if (order.kitchenPrintedAt)
            return;
        const settings = order.restaurant?.settings;
        if (!settings?.kitchenPrintEnabled)
            return;
        const receipt = this.formatReceipt(order);
        console.log(receipt);
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                kitchenPrintedAt: new Date(),
            },
        });
    }
    async scheduleOrderPrint(orderId, delayMinutes) {
        const delayMs = Math.max(0, delayMinutes) * 60 * 1000;
        setTimeout(async () => {
            try {
                await this.printOrderIfNeeded(orderId);
            }
            catch {
                console.log('Kitchen print failed');
            }
        }, delayMs);
    }
};
exports.PrintService = PrintService;
exports.PrintService = PrintService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrintService);
//# sourceMappingURL=print.service.js.map