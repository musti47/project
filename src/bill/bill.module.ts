import { Module } from '@nestjs/common';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [PrismaModule, SessionsModule],
  controllers: [BillController],
  providers: [BillService],
})
export class BillModule {}
