import { PaymentMethod, Prisma } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { SessionsService } from '../sessions/sessions.service';
export declare class PaymentsService {
    private prisma;
    private realtime;
    private sessionsService;
    private restaurantsService;
    constructor(prisma: PrismaService, realtime: RealtimeGateway, sessionsService: SessionsService, restaurantsService: RestaurantsService);
    private getDb;
    private createPendingPayment;
    private assertCustomerPaymentAllowed;
    getPendingSplitPaymentsBySession(sessionId: string): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }[]>;
    findPendingSplitPayments(tableId: number, user: AuthUser): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }[]>;
    createCustomerPayment(sessionId: string, amount: number, idempotencyKey?: string): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }>;
    createEqualSplitForSession(sessionId: string, personCount: number): Promise<{
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
    payPendingSplitPayment(paymentId: number, sessionId: string): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }>;
    payItems(sessionId: string, itemIds: number[], idempotencyKey?: string): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }>;
    markAsSucceeded(paymentId: number, providerPaymentId?: string): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }>;
    markAsManual(paymentId: number, method: PaymentMethod, user: AuthUser): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }>;
    createManualCustomPayment(tableId: number, amount: number, method: PaymentMethod, user: AuthUser): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }>;
    settleRemainingManually(tableId: number, method: PaymentMethod, user: AuthUser): Promise<{
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
        metadata: Prisma.JsonValue | null;
    }>;
    cancelSplit(tableId: number, user: AuthUser): Promise<{
        success: boolean;
    }>;
    webhook(body: {
        paymentId?: number;
        providerPaymentId?: string;
        status?: 'SUCCEEDED' | 'FAILED' | 'PENDING';
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
        metadata: Prisma.JsonValue | null;
    }>;
}
