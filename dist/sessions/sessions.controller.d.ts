import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    createFromTableToken(body: {
        token: string;
    }): Promise<{
        token: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        restaurantId: number;
        table: {
            id: number;
            number: number;
            token: string;
            status: import(".prisma/client").$Enums.TableStatus;
            paymentEnabled: boolean;
            billRequested: boolean;
        };
        billingMode: import(".prisma/client").$Enums.BillingMode;
        splitActive: boolean;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
    }>;
    getSessionState(id: string): Promise<{
        sessionId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        restaurantId: number;
        table: {
            id: number;
            number: number;
            token: string;
            status: import(".prisma/client").$Enums.TableStatus;
            paymentEnabled: boolean;
            billRequested: boolean;
        };
        billingMode: import(".prisma/client").$Enums.BillingMode;
        splitActive: boolean;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
    }>;
    create(body: {
        tableId: number;
    }, req: any): Promise<{
        table: {
            number: number;
            id: number;
            restaurantId: number;
            createdAt: Date;
            updatedAt: Date;
            token: string;
            status: import(".prisma/client").$Enums.TableStatus;
            paymentEnabled: boolean;
            billRequested: boolean;
            billRequestedAt: Date | null;
        };
    } & {
        id: string;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.SessionStatus;
        billingMode: import(".prisma/client").$Enums.BillingMode;
        startedAt: Date;
        closedAt: Date | null;
    }>;
}
