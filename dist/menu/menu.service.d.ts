import { PrismaService } from '../prisma/prisma.service';
export declare class MenuService {
    private prisma;
    constructor(prisma: PrismaService);
    getByRestaurant(restaurantId: number): Promise<{
        restaurantId: number;
        restaurantName: string;
        categories: ({
            items: {
                id: number;
                restaurantId: number;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                description: string | null;
                isAvailable: boolean;
                categoryId: number;
                priceAmount: number;
                imageUrl: string | null;
            }[];
        } & {
            id: number;
            restaurantId: number;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isAvailable: boolean;
        })[];
    }>;
    createCategory(name: string, restaurantId: number): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isAvailable: boolean;
    }>;
    deleteCategory(id: number, restaurantId: number): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isAvailable: boolean;
    }>;
    createItem(data: {
        name: string;
        priceAmount: number;
        categoryId: number;
        restaurantId: number;
        description?: string;
    }): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        isAvailable: boolean;
        categoryId: number;
        priceAmount: number;
        imageUrl: string | null;
    }>;
    deleteItem(id: number, restaurantId: number): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        isAvailable: boolean;
        categoryId: number;
        priceAmount: number;
        imageUrl: string | null;
    }>;
}
