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
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('customer/custom')
  createCustomerPayment(
    @Body() body: { sessionId: string; amount: number; idempotencyKey?: string },
  ) {
    return this.paymentsService.createCustomerPayment(
      body.sessionId,
      body.amount,
      body.idempotencyKey,
    );
  }

  @Post('customer/items')
  payItems(
    @Body() body: { sessionId: string; itemIds: number[]; idempotencyKey?: string },
  ) {
    return this.paymentsService.payItems(body.sessionId, body.itemIds, body.idempotencyKey);
  }

  @Post('customer/split/equal')
  createEqualSplit(@Body() body: { sessionId: string; personCount: number }) {
    return this.paymentsService.createEqualSplitForSession(body.sessionId, body.personCount);
  }

  @Get('session/:sessionId/pending-splits')
  findPendingSplitsBySession(@Param('sessionId') sessionId: string) {
    return this.paymentsService.getPendingSplitPaymentsBySession(sessionId);
  }

  @Post('customer/split/:paymentId/pay')
  payPendingSplit(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() body: { sessionId: string },
  ) {
    return this.paymentsService.payPendingSplitPayment(paymentId, body.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('table/:tableId/pending-splits')
  findPendingSplits(@Param('tableId', ParseIntPipe) tableId: number, @Req() req) {
    return this.paymentsService.findPendingSplitPayments(tableId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/success')
  markAsSucceeded(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { providerPaymentId?: string },
  ) {
    return this.paymentsService.markAsSucceeded(id, body.providerPaymentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/manual')
  manualPay(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { method: PaymentMethod },
    @Req() req,
  ) {
    return this.paymentsService.markAsManual(id, body.method, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('table/:tableId/manual-custom')
  manualCustom(
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() body: { amount: number; method: PaymentMethod },
    @Req() req,
  ) {
    return this.paymentsService.createManualCustomPayment(
      tableId,
      body.amount,
      body.method,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('table/:tableId/manual-settlement')
  manualSettlement(
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() body: { method: PaymentMethod },
    @Req() req,
  ) {
    return this.paymentsService.settleRemainingManually(tableId, body.method, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('table/:tableId/cancel-split')
  cancelSplit(@Param('tableId', ParseIntPipe) tableId: number, @Req() req) {
    return this.paymentsService.cancelSplit(tableId, req.user);
  }

  @Post('webhook')
  webhook(
    @Body()
    body: {
      paymentId?: number;
      providerPaymentId?: string;
      status?: PaymentStatus;
    },
  ) {
    type SafeStatus = "PENDING" | "SUCCEEDED" | "FAILED";

    const mapStatus = (status?: PaymentStatus): SafeStatus | undefined => {
      if (status === "PENDING") return "PENDING";
      if (status === "SUCCEEDED") return "SUCCEEDED";
      if (status === "FAILED") return "FAILED";
      return "FAILED"; // CANCELLED dahil
    };

    const sanitizedBody: {
      paymentId?: number;
      providerPaymentId?: string;
      status?: SafeStatus;
    } = {
      paymentId: body.paymentId,
      providerPaymentId: body.providerPaymentId,
      status: mapStatus(body.status),
    };

    return this.paymentsService.webhook(sanitizedBody);
  }
}
