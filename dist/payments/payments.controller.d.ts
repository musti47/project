import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createCustomerPayment(body: {
        sessionId: string;
        amount: number;
        idempotencyKey?: string;
    }): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    payItems(body: {
        sessionId: string;
        itemIds: number[];
        idempotencyKey?: string;
    }): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createEqualSplit(body: {
        sessionId: string;
        personCount: number;
    }): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SplitPlanType;
        tableId: number;
        status: import(".prisma/client").$Enums.SplitPlanStatus;
        sessionId: string;
        totalAmount: number;
        personCount: number;
        remainingAmount: number;
    }>;
    findPendingSplitsBySession(sessionId: string): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    payPendingSplit(paymentId: number, body: {
        sessionId: string;
    }): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findPendingSplits(tableId: number, req: any): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    markAsSucceeded(id: number, body: {
        providerPaymentId?: string;
    }): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    manualPay(id: number, body: {
        method: PaymentMethod;
    }, req: any): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    manualCustom(tableId: number, body: {
        amount: number;
        method: PaymentMethod;
    }, req: any): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    manualSettlement(tableId: number, body: {
        method: PaymentMethod;
    }, req: any): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    cancelSplit(tableId: number, req: any): Promise<{
        success: boolean;
    }>;
    webhook(body: {
        paymentId?: number;
        providerPaymentId?: string;
        status?: PaymentStatus;
    }): Promise<{
        items: {
            id: number;
            amount: number;
            paymentId: number;
            orderItemId: number;
        }[];
    } & {
        id: number;
        restaurantId: number;
        createdAt: Date;
        updatedAt: Date;
        tableId: number;
        status: import(".prisma/client").$Enums.PaymentStatus;
        sessionId: string | null;
        splitPlanId: number | null;
        provider: string;
        providerPaymentId: string | null;
        idempotencyKey: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        splitType: import(".prisma/client").$Enums.PaymentSplitType;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
