import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        token: string;
        user: {
            id: number;
            email: string;
            role: string;
            restaurantId: number;
            restaurantName: string;
        };
    }>;
    me(req: any): Promise<{
        id: number;
        email: string;
        role: string;
        restaurantId: number;
        restaurant: {
            settings: {
                id: number;
                restaurantId: number;
                createdAt: Date;
                updatedAt: Date;
                splitEnabled: boolean;
                manualCashEnabled: boolean;
                manualPosEnabled: boolean;
                customerCustomAmountEnabled: boolean;
                fullSettlementEnabled: boolean;
                waiterCustomAmountEnabled: boolean;
                billRequestEnabled: boolean;
                kitchenTicketEnabled: boolean;
                bulkApproveEnabled: boolean;
                cleaningFlowEnabled: boolean;
                kitchenPrintEnabled: boolean;
                requireWaiterApprovalForKitchenPrint: boolean;
                kitchenPrintDelayMinutes: number;
            } | null;
        } & {
            id: number;
            createdAt: Date;
            name: string;
            slug: string;
            isActive: boolean;
            updatedAt: Date;
        };
    }>;
}
