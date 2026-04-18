import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrintService {
  constructor(private prisma: PrismaService) {}

  formatReceipt(order: any) {
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

  async printOrderIfNeeded(orderId: number) {
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

    if (!order) return;
    if (order.kitchenPrintedAt) return;

    const settings = order.restaurant?.settings;
    if (!settings?.kitchenPrintEnabled) return;

    const receipt = this.formatReceipt(order);

    console.log(receipt);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        kitchenPrintedAt: new Date(),
      },
    });
  }

  async scheduleOrderPrint(orderId: number, delayMinutes: number) {
    const delayMs = Math.max(0, delayMinutes) * 60 * 1000;

    setTimeout(async () => {
      try {
        await this.printOrderIfNeeded(orderId);
      } catch {
        console.log('Kitchen print failed');
      }
    }, delayMs);
  }
}