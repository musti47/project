import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
export declare class SessionsService {
    private prisma;
    private realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    private getDb;
    getTableOrThrow(tableId: number, db?: Prisma.TransactionClient): Promise<{
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
    getTableByTokenOrThrow(token: string, db?: Prisma.TransactionClient): Promise<{
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
    getSessionByIdOrThrow(sessionId: string, db?: Prisma.TransactionClient): Promise<{
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
    findOpenSessionByTable(tableId: number, db?: Prisma.TransactionClient): Promise<({
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
    }) | null>;
    getActiveSessionByTable(tableId: number, db?: Prisma.TransactionClient): Promise<{
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
    validateCurrentOpenSession(sessionId: string, db?: Prisma.TransactionClient): Promise<{
        session: {
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
        };
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
    }>;
    getOrCreateActiveSession(tableId: number, db?: Prisma.TransactionClient): Promise<{
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
    private getPaymentAmount;
    getSessionFinancials(sessionId: string, db?: Prisma.TransactionClient): Promise<{
        orders: {
            totalAmount: number;
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
        }[];
        payments: ({
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
        })[];
        activeSplitPlan: {
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
        } | null;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
        paidItemIds: Set<number>;
    }>;
    getPublicSessionState(sessionId: string, db?: Prisma.TransactionClient): Promise<{
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
    syncSessionLifecycle(sessionId: string, db?: Prisma.TransactionClient): Promise<{
        sessionClosed: boolean;
        remainingAmount: number;
    }>;
    create(tableId: number): Promise<{
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
    createForRestaurant(tableId: number, restaurantId: number): Promise<{
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
    createFromTableToken(tableToken: string): Promise<{
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
    closeSessionIfSettled(sessionId: string, db?: Prisma.TransactionClient): Promise<{
        sessionClosed: boolean;
        remainingAmount: number;
    }>;
}
