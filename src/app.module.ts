import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BillModule } from './bill/bill.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { SessionsModule } from './sessions/sessions.module';
import { TablesModule } from './tables/tables.module';
import { PrintModule } from './print/print.module';

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    SessionsModule,
    MenuModule,
    BillModule,
    OrdersModule,
    PaymentsModule,
    TablesModule,
    RestaurantsModule,
    PrintModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
