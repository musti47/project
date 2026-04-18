import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [PrismaModule, RealtimeModule, RestaurantsModule, SessionsModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
