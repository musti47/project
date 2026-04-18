import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getByRestaurant(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
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

  async createCategory(name: string, restaurantId: number) {
    if (!name?.trim()) {
      throw new BadRequestException('Kategori adı gerekli');
    }

    return this.prisma.menuCategory.create({
      data: {
        name: name.trim(),
        restaurantId,
      },
    });
  }

  async deleteCategory(id: number, restaurantId: number) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id, restaurantId },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
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

  async createItem(data: {
    name: string;
    priceAmount: number;
    categoryId: number;
    restaurantId: number;
    description?: string;
  }) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Ürün adı gerekli');
    }

    if (!Number.isFinite(data.priceAmount) || data.priceAmount <= 0) {
      throw new BadRequestException('Geçerli fiyat gerekli');
    }

    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id: data.categoryId,
        restaurantId: data.restaurantId,
        isAvailable: true,
      },
    });

    if (!category) {
      throw new BadRequestException('Kategori bulunamadı');
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

  async deleteItem(id: number, restaurantId: number) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!item) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        isAvailable: false,
      },
    });
  }
}
