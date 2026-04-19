import { TablesService } from './tables.service';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    findAll(req: any): Promise<{
        id: number;
        restaurantId: number;
        number: number;
        token: string;
        status: import(".prisma/client").$Enums.TableStatus;
        paymentEnabled: boolean;
        billRequested: boolean;
        activeSessionId: string;
        billingMode: import(".prisma/client").$Enums.BillingMode;
        splitActive: boolean;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(body: {
        number: number;
    }, req: any): Promise<{
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
    }>;
    enablePayment(id: number, req: any): Promise<{
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
    }>;
    disablePayment(id: number, req: any): Promise<{
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
    }>;
    cleanTable(id: number, req: any): Promise<{
        success: boolean;
    }>;
    closeBill(id: number, req: any): Promise<{
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
    } | {
        success: boolean;
    }>;
    delete(id: number, req: any): Promise<{
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
    }>;
    requestBill(id: number, req: any): Promise<{
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
    }>;
    requestBillForSession(body: {
        sessionId: string;
    }): Promise<{
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
    }>;
}
