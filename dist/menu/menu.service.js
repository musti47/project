"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MenuService = class MenuService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getByRestaurant(restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const categories = await this.prisma.menuCategory.findMany({
            where: {
                restaurantId,
                isAvailable: true,
            },
            include: {
                items: {
                    where: { isAvailable: true },
                    orderBy: { id: 'asc' },
                },
            },
            orderBy: { id: 'asc' },
        });
        return {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            categories,
        };
    }
    async createCategory(name, restaurantId) {
        if (!name?.trim()) {
            throw new common_1.BadRequestException('Kategori adı gerekli');
        }
        return this.prisma.menuCategory.create({
            data: {
                name: name.trim(),
                restaurantId,
            },
        });
    }
    async deleteCategory(id, restaurantId) {
        const category = await this.prisma.menuCategory.findFirst({
            where: { id, restaurantId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori bulunamadı');
        }
        await this.prisma.menuItem.updateMany({
            where: { categoryId: id },
            data: { isAvailable: false },
        });
        return this.prisma.menuCategory.update({
            where: { id },
            data: { isAvailable: false },
        });
    }
    async createItem(data) {
        if (!data.name?.trim()) {
            throw new common_1.BadRequestException('Ürün adı gerekli');
        }
        if (!Number.isFinite(data.priceAmount) || data.priceAmount <= 0) {
            throw new common_1.BadRequestException('Geçerli fiyat gerekli');
        }
        const category = await this.prisma.menuCategory.findFirst({
            where: {
                id: data.categoryId,
                restaurantId: data.restaurantId,
                isAvailable: true,
            },
        });
        if (!category) {
            throw new common_1.BadRequestException('Kategori bulunamadı');
        }
        return this.prisma.menuItem.create({
            data: {
                name: data.name.trim(),
                priceAmount: Math.round(data.priceAmount),
                categoryId: data.categoryId,
                restaurantId: data.restaurantId,
                description: data.description?.trim() || null,
            },
        });
    }
    async deleteItem(id, restaurantId) {
        const item = await this.prisma.menuItem.findFirst({
            where: { id, restaurantId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Ürün bulunamadı');
        }
        return this.prisma.menuItem.update({
            where: { id },
            data: {
                isAvailable: false,
            },
        });
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuService);
//# sourceMappingURL=menu.service.js.map