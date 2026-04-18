import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    return this.ordersService.findAll(req.user);
  }

  @Get('session/:id')
  findBySession(@Param('id') id: string) {
    return this.ordersService.findBySessionId(id);
  }

  @Get('token/:id')
  findByToken(@Param('id') id: string) {
    return this.ordersService.findBySessionId(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('table/:id')
  findByTable(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.findByTableId(id, req.user);
  }

  @Post('customer')
  createCustomerOrder(
    @Body()
    body: {
      sessionId?: string;
      token?: string;
      items: Array<{ menuItemId: number; quantity: number; note?: string }>;
      idempotencyKey?: string;
    },
  ) {
    return this.ordersService.createCustomerOrder(
      body.sessionId || body.token || '',
      body.items,
      body.idempotencyKey,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { tableId: number }, @Req() req) {
    return this.ordersService.create(body.tableId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':orderId/items')
  addItem(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { menuItemId: number; quantity: number; note?: string },
    @Req() req,
  ) {
    return this.ordersService.addItem(
      orderId,
      body.menuItemId,
      body.quantity,
      req.user,
      body.note,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.delete(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
    @Req() req,
  ) {
    return this.ordersService.updateStatus(id, body.status, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/print-kitchen')
  printKitchen(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.printKitchenReceipt(id);
  }
}
