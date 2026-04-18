import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BillService } from './bill.service';

@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Get('session/:sessionId')
  getSessionBill(@Param('sessionId') sessionId: string) {
    return this.billService.getSessionBill(sessionId);
  }

  @Get('token/:token')
  getByToken(@Param('token') token: string) {
    return this.billService.getByToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':tableId')
  getTableBill(@Param('tableId', ParseIntPipe) tableId: number, @Req() _req) {
    return this.billService.getTableBill(tableId);
  }
}
