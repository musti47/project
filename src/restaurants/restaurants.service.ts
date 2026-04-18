import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

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

  async findById(id: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        settings: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async getSettingsOrThrow(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        settings: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (!restaurant.settings) {
      throw new NotFoundException('Restaurant settings not found');
    }

    return restaurant.settings;
  }

  async create(body: { name: string; slug: string }) {
    const slug = body.slug?.trim().toLowerCase();

    if (!body.name?.trim()) {
      throw new BadRequestException('Restaurant adı gerekli');
    }

    if (!slug) {
      throw new BadRequestException('Slug gerekli');
    }

    const existing = await this.prisma.restaurant.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Bu slug zaten kullanılıyor');
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

  async getSettings(restaurantId: number) {
    return this.getSettingsOrThrow(restaurantId);
  }

  async updateSettings(
    restaurantId: number,
    body: {
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
    },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        settings: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
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
}
