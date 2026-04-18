import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SessionsModule } from '../sessions/sessions.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { PrintModule } from '../print/print.module';
@Module({
  imports:  [PrismaModule, PrintModule, RealtimeModule, SessionsModule, RestaurantsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}