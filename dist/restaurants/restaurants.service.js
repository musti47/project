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
exports.RestaurantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RestaurantsService = class RestaurantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.restaurant.findMany({
            include: {
                settings: true,
            },
            orderBy: {
                id: 'asc',
            },
        });
    }
    async findById(id) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id },
            include: {
                settings: true,
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return restaurant;
    }
    async findBySlug(slug) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { slug },
            include: {
                settings: true,
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return restaurant;
    }
    async getSettingsOrThrow(restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                settings: true,
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        if (!restaurant.settings) {
            throw new common_1.NotFoundException('Restaurant settings not found');
        }
        return restaurant.settings;
    }
    async create(body) {
        const slug = body.slug?.trim().toLowerCase();
        if (!body.name?.trim()) {
            throw new common_1.BadRequestException('Restaurant adı gerekli');
        }
        if (!slug) {
            throw new common_1.BadRequestException('Slug gerekli');
        }
        const existing = await this.prisma.restaurant.findUnique({
            where: { slug },
        });
        if (existing) {
            throw new common_1.BadRequestException('Bu slug zaten kullanılıyor');
        }
        return this.prisma.restaurant.create({
            data: {
                name: body.name.trim(),
                slug,
                isActive: true,
                settings: {
                    create: {},
                },
            },
            include: {
                settings: true,
            },
        });
    }
    async getSettings(restaurantId) {
        return this.getSettingsOrThrow(restaurantId);
    }
    async updateSettings(restaurantId, body) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                settings: true,
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const cleanBody = {
            ...body,
            ...(typeof body.kitchenPrintDelayMinutes === 'number'
                ? { kitchenPrintDelayMinutes: Math.max(0, Math.round(body.kitchenPrintDelayMinutes)) }
                : {}),
        };
        if (!restaurant.settings) {
            return this.prisma.restaurantSettings.create({
                data: {
                    restaurantId,
                    ...cleanBody,
                },
            });
        }
        return this.prisma.restaurantSettings.update({
            where: {
                restaurantId,
            },
            data: cleanBody,
        });
    }
};
exports.RestaurantsService = RestaurantsService;
exports.RestaurantsService = RestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RestaurantsService);
//# sourceMappingURL=restaurants.service.js.map