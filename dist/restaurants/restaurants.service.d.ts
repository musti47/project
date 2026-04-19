import { PrismaService } from '../prisma/prisma.service';
export declare class RestaurantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
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
    })[]>;
    findById(id: number): Promise<{
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
    }>;
    findBySlug(slug: string): Promise<{
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
    }>;
    getSettingsOrThrow(restaurantId: number): Promise<{
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
    }>;
    create(body: {
        name: string;
        slug: string;
    }): Promise<{
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
    }>;
    getSettings(restaurantId: number): Promise<{
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
    }>;
    updateSettings(restaurantId: number, body: {
        splitEnabled?: boolean;
        manualCashEnabled?: boolean;
        manualPosEnabled?: boolean;
        customerCustomAmountEnabled?: boolean;
        fullSettlementEnabled?: boolean;
        waiterCustomAmountEnabled?: boolean;
        billRequestEnabled?: boolean;
        kitchenTicketEnabled?: boolean;
        bulkApproveEnabled?: boolean;
        cleaningFlowEnabled?: boolean;
        kitchenPrintEnabled?: boolean;
        requireWaiterApprovalForKitchenPrint?: boolean;
        kitchenPrintDelayMinutes?: number;
    }): Promise<{
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
    }>;
}
