import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { SessionsService } from '../sessions/sessions.service';
export declare class TablesService {
    private prisma;
    private realtime;
    private sessionsService;
    private restaurantsService;
    constructor(prisma: PrismaService, realtime: RealtimeGateway, sessionsService: SessionsService, restaurantsService: RestaurantsService);
    findAll(user: AuthUser): Promise<{
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
    create(number: number, user: AuthUser): Promise<{
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
    delete(id: number, user: AuthUser): Promise<{
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
    enablePayment(id: number, user: AuthUser): Promise<{
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
    disablePayment(id: number, user: AuthUser): Promise<{
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
    requestBillForSession(sessionId: string): Promise<{
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
    requestBill(id: number, user: AuthUser): Promise<{
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
    closeBill(tableId: number, user: AuthUser): Promise<{
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
    cleanTable(id: number, user: AuthUser): Promise<{
        success: boolean;
    }>;
}
