import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SessionsModule } from '../sessions/sessions.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    SessionsModule,
    RestaurantsModule,
  ],
   controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule { }