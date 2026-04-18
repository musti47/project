import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class BillService {
  constructor(
    private prisma: PrismaService,
    private sessionsService: SessionsService,
  ) { }

  private async buildBillPayload(sessionId: string) {
    const session = await this.sessionsService.getSessionByIdOrThrow(sessionId);

    const table = session.table;
    const financials = await this.sessionsService.getSessionFinancials(session.id);

    const total = Number(financials.totalAmount || 0);
    const paid = Number(financials.paidAmount || 0);
    const remaining = Math.max(total - paid, 0);

    const isBillClosed =
      session.status === 'CLOSED' ||
      (total > 0 && remaining <= 0);

    return {
      tableId: table.id,
      tableNumber: table.number,
      sessionId: session.id,
      paymentEnabled: table.paymentEnabled,
      billRequested: table.billRequested,
      billingMode: isBillClosed ? 'CLOSED' : session.billingMode,
      splitActive: !!financials.activeSplitPlan,
      totalOrders: total,
      paidAmount: paid,
      remaining: remaining,
    };
  }

  async getSessionBill(sessionId: string) {
    return this.buildBillPayload(sessionId);
  }

  async getTableBill(tableId: number) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const session = await this.sessionsService.findOpenSessionByTable(tableId);

    if (!session) {
      return {
        tableId,
        tableNumber: table.number,
        sessionId: null,
        paymentEnabled: table.paymentEnabled,
        billRequested: table.billRequested,
        billingMode: 'CLOSED',
        splitActive: false,
        totalOrders: 0,
        paidAmount: 0,
        remaining: 0,
      };
    }

    return this.buildBillPayload(session.id);
  }

  async getByToken(token: string) {
    const table = await this.prisma.table.findUnique({
      where: { token },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const session = await this.sessionsService.getActiveSessionByTable(table.id);

    if (!session) {
      return {
        tableId: table.id,
        tableNumber: table.number,
        sessionId: null,
        paymentEnabled: table.paymentEnabled,
        billRequested: table.billRequested,
        billingMode: 'CLOSED',
        splitActive: false,
        totalOrders: 0,
        paidAmount: 0,
        remaining: 0,
      };
    }

    return this.buildBillPayload(session.id);
  }
}
