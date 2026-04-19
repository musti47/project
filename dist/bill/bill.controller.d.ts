import { BillService } from './bill.service';
export declare class BillController {
    private readonly billService;
    constructor(billService: BillService);
    getSessionBill(sessionId: string): Promise<{
        tableId: number;
        tableNumber: number;
        sessionId: string;
        paymentEnabled: boolean;
        billRequested: boolean;
        billingMode: import(".prisma/client").$Enums.BillingMode;
        splitActive: boolean;
        totalOrders: number;
        paidAmount: number;
        remaining: number;
    }>;
    getByToken(token: string): Promise<{
        tableId: number;
        tableNumber: number;
        sessionId: string;
        paymentEnabled: boolean;
        billRequested: boolean;
        billingMode: import(".prisma/client").$Enums.BillingMode;
        splitActive: boolean;
        totalOrders: number;
        paidAmount: number;
        remaining: number;
    } | {
        tableId: number;
        tableNumber: number;
        sessionId: null;
        paymentEnabled: boolean;
        billRequested: boolean;
        billingMode: string;
        splitActive: boolean;
        totalOrders: number;
        paidAmount: number;
        remaining: number;
    }>;
    getTableBill(tableId: number, _req: any): Promise<{
        tableId: number;
        tableNumber: number;
        sessionId: string;
        paymentEnabled: boolean;
        billRequested: boolean;
        billingMode: import(".prisma/client").$Enums.BillingMode;
        splitActive: boolean;
        totalOrders: number;
        paidAmount: number;
        remaining: number;
    } | {
        tableId: number;
        tableNumber: number;
        sessionId: null;
        paymentEnabled: boolean;
        billRequested: boolean;
        billingMode: string;
        splitActive: boolean;
        totalOrders: number;
        paidAmount: number;
        remaining: number;
    }>;
}
