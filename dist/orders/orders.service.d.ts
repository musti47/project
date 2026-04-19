import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { PrintService } from '../print/print.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SessionsService } from '../sessions/sessions.service';
export declare class OrdersService {
    private prisma;
    private realtime;
    private sessionsService;
    private printService;
    constructor(prisma: PrismaService, realtime: RealtimeGateway, sessionsService: SessionsService, printService: PrintService);
    findAll(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        items: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            orderId: number;
            menuItemId: number;
            nameSnapshot: string;
            unitPriceAmount: number;
            quantity: number;
            lineTotalAmount: number;
            note: string | null;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        sessionId: string | null;
        source: import(".prisma/client").$Enums.OrderSource;
        externalProvider: string | null;
        externalOrderId: string | null;
        totalAmount: number;
        notes: string | null;
        kitchenPrintedAt: Date | null;
    })[]>;
    findBySessionId(sessionId: string): Promise<{
        items: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            orderId: number;
            menuItemId: number;
            nameSnapshot: string;
            unitPriceAmount: number;
            quantity: number;
            lineTotalAmount: number;
            note: string | null;
        }[];
        totalAmount: number;
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        sessionId: string | null;
        source: import(".prisma/client").$Enums.OrderSource;
        externalProvider: string | null;
        externalOrderId: string | null;
        notes: string | null;
        kitchenPrintedAt: Date | null;
    }[]>;
    findByTableId(tableId: number, user: AuthUser): Promise<({
        items: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            orderId: number;
            menuItemId: number;
            nameSnapshot: string;
            unitPriceAmount: number;
            quantity: number;
            lineTotalAmount: number;
            note: string | null;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        sessionId: string | null;
        source: import(".prisma/client").$Enums.OrderSource;
        externalProvider: string | null;
        externalOrderId: string | null;
        totalAmount: number;
        notes: string | null;
        kitchenPrintedAt: Date | null;
    })[]>;
    create(tableId: number, user: AuthUser): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        sessionId: string | null;
        source: import(".prisma/client").$Enums.OrderSource;
        externalProvider: string | null;
        externalOrderId: string | null;
        totalAmount: number;
        notes: string | null;
        kitchenPrintedAt: Date | null;
    }>;
    createCustomerOrder(sessionId: string, items: Array<{
        menuItemId: number;
        quantity: number;
        note?: string;
    }>, idempotencyKey?: string): Promise<{
        items: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            orderId: number;
            menuItemId: number;
            nameSnapshot: string;
            unitPriceAmount: number;
            quantity: number;
            lineTotalAmount: number;
            note: string | null;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        sessionId: string | null;
        source: import(".prisma/client").$Enums.OrderSource;
        externalProvider: string | null;
        externalOrderId: string | null;
        totalAmount: number;
        notes: string | null;
        kitchenPrintedAt: Date | null;
    }>;
    delete(id: number, user: AuthUser): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        sessionId: string | null;
        source: import(".prisma/client").$Enums.OrderSource;
        externalProvider: string | null;
        externalOrderId: string | null;
        totalAmount: number;
        notes: string | null;
        kitchenPrintedAt: Date | null;
    }>;
    addItem(orderId: number, menuItemId: number, quantity: number, user: AuthUser, note?: string): Promise<{
        success: boolean;
    }>;
    printKitchenReceipt(orderId: number): Promise<{
        success: boolean;
    }>;
    updateStatus(id: number, status: string, user: AuthUser): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        sessionId: string | null;
        source: import(".prisma/client").$Enums.OrderSource;
        externalProvider: string | null;
        externalOrderId: string | null;
        totalAmount: number;
        notes: string | null;
        kitchenPrintedAt: Date | null;
    }>;
}
