import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@Req() req) {
    return this.restaurantsService.findById(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/settings')
  getMySettings(@Req() req) {
    return this.restaurantsService.getSettings(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/settings')
  updateMySettings(
    @Req() req,
    @Body()
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
    return this.restaurantsService.updateSettings(req.user.restaurantId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    if (id !== req.user.restaurantId) {
      return this.restaurantsService.findById(req.user.restaurantId);
    }

    return this.restaurantsService.findById(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.restaurantsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/settings')
  getSettings(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const targetId = id === req.user.restaurantId ? id : req.user.restaurantId;
    return this.restaurantsService.getSettings(targetId);
  }

  @Post()
  create(@Body() body: { name: string; slug: string }) {
    return this.restaurantsService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/settings')
  updateSettings(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body()
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
    const targetId = id === req.user.restaurantId ? id : req.user.restaurantId;
    return this.restaurantsService.updateSettings(targetId, body);
  }
}
