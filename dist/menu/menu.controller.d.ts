import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    getMenu(restaurantId: number): Promise<{
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
    createCategory(body: {
        name: string;
    }, req: any): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isAvailable: boolean;
    }>;
    deleteCategory(id: number, req: any): Promise<{
        id: number;
        restaurantId: number;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isAvailable: boolean;
    }>;
    createItem(body: {
        name: string;
        priceAmount: number;
        categoryId: number;
        description?: string;
    }, req: any): Promise<{
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
    deleteItem(id: number, req: any): Promise<{
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
