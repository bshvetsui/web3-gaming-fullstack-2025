import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ShopService, ShopItem } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  getShopItems(@Query('category') category?: string) {
    return this.shopService.getShopItems(category);
  }

  @Get('items/:itemId')
  getItem(@Param('itemId') itemId: string) {
    const item = this.shopService.getItem(itemId);
    if (!item) {
      return { error: 'Item not found' };
    }
    return item;
  }

  @Get('categories')
  getCategories() {
    return this.shopService.getCategories();
  }

  @Get('currency/:playerId')
  getPlayerCurrency(@Param('playerId') playerId: string) {
    return this.shopService.getPlayerCurrency(playerId);
  }

  @Post('currency/add')
  addCurrency(
    @Body()
    body: {
      playerId: string;
      type: 'gold' | 'gems' | 'premiumCurrency';
      amount: number;
    },
  ) {
    return this.shopService.addCurrency(body.playerId, body.type, body.amount);
  }

  @Post('purchase')
  purchaseItem(
    @Body()
    body: {
      playerId: string;
      itemId: string;
      quantity?: number;
    },
  ) {
    try {
      const transaction = this.shopService.purchaseItem(
        body.playerId,
        body.itemId,
        body.quantity || 1,
      );
      return { success: true, transaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('transactions/:playerId')
  getPlayerTransactions(@Param('playerId') playerId: string) {
    return this.shopService.getPlayerTransactions(playerId);
  }

  @Post('items')
  addShopItem(@Body() item: ShopItem) {
    this.shopService.addShopItem(item);
    return { success: true };
  }

  @Delete('items/:itemId')
  removeShopItem(@Param('itemId') itemId: string) {
    const success = this.shopService.removeShopItem(itemId);
    return { success };
  }

  @Post('stock')
  updateStock(@Body() body: { itemId: string; stock: number }) {
    this.shopService.updateStock(body.itemId, body.stock);
    return { success: true };
  }

  @Get('stock/:itemId')
  getStock(@Param('itemId') itemId: string) {
    const stock = this.shopService.getStock(itemId);
    return { itemId, stock };
  }

  @Post('refund')
  refundTransaction(@Body() body: { transactionId: string }) {
    const success = this.shopService.refundTransaction(body.transactionId);
    return { success };
  }
}
