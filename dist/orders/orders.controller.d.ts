import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findAll(req: any): import(".prisma/client").Prisma.PrismaPromise<({
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
    findBySession(id: string): Promise<{
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
    findByToken(id: string): Promise<{
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
    findByTable(id: number, req: any): Promise<({
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
    createCustomerOrder(body: {
        sessionId?: string;
        token?: string;
        items: Array<{
            menuItemId: number;
            quantity: number;
            note?: string;
        }>;
        idempotencyKey?: string;
    }): Promise<{
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
    create(body: {
        tableId: number;
    }, req: any): Promise<{
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
    addItem(orderId: number, body: {
        menuItemId: number;
        quantity: number;
        note?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    deleteOrder(id: number, req: any): Promise<{
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
    updateStatus(id: number, body: {
        status: string;
    }, req: any): Promise<{
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
    printKitchen(id: number): Promise<{
        success: boolean;
    }>;
}
