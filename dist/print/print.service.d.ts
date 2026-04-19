import { PrismaService } from '../prisma/prisma.service';
export declare class PrintService {
    private prisma;
    constructor(prisma: PrismaService);
    formatReceipt(order: any): string;
    printOrderIfNeeded(orderId: number): Promise<void>;
    scheduleOrderPrint(orderId: number, delayMinutes: number): Promise<void>;
}
