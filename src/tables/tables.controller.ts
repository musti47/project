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
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    return this.tablesService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { number: number }, @Req() req) {
    return this.tablesService.create(body.number, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/enable-payment')
  enablePayment(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tablesService.enablePayment(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/disable-payment')
  disablePayment(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tablesService.disablePayment(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/clean')
  cleanTable(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tablesService.cleanTable(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/close-bill')
  closeBill(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tablesService.closeBill(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tablesService.delete(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/request-bill')
  requestBill(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.tablesService.requestBill(id, req.user);
  }

  @Post('public/request-bill')
  requestBillForSession(@Body() body: { sessionId: string }) {
    return this.tablesService.requestBillForSession(body.sessionId);
  }
}
