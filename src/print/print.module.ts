import { Module } from '@nestjs/common';
import { PrintService } from './print.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}