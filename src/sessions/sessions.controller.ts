import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('from-table-token')
  createFromTableToken(@Body() body: { token: string }) {
    return this.sessionsService.createFromTableToken(body.token);
  }

  @Get(':id')
  getSessionState(@Param('id') id: string) {
    return this.sessionsService.getPublicSessionState(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { tableId: number }, @Req() req) {
    return this.sessionsService.createForRestaurant(body.tableId, req.user.restaurantId);
  }
}
