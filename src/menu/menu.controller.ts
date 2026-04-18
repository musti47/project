import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenu(@Query('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.menuService.getByRestaurant(restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  createCategory(@Body() body: { name: string }, @Req() req) {
    return this.menuService.createCategory(body.name, req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.menuService.deleteCategory(id, req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  createItem(
    @Body()
    body: {
      name: string;
      priceAmount: number;
      categoryId: number;
      description?: string;
    },
    @Req() req,
  ) {
    return this.menuService.createItem({
      ...body,
      restaurantId: req.user.restaurantId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  deleteItem(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.menuService.deleteItem(id, req.user.restaurantId);
  }
}
