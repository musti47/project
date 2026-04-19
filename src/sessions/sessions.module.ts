import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
@Module({
  imports: [PrismaModule,RealtimeModule],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}