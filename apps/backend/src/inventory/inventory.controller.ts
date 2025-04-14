import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('player/:playerId')
  getInventory(@Param('playerId') playerId: string) {
    return this.inventoryService.getInventory(playerId);
  }

  @Get('player/:playerId/sorted')
  getSortedInventory(@Param('playerId') playerId: string) {
    return this.inventoryService.sortInventory(playerId);
  }

  @Post('add')
  addItem(@Body() body: { playerId: string; item: any }) {
    this.inventoryService.addItem(body.playerId, body.item);
    return { success: true };
  }

  @Post('remove')
  removeItem(
    @Body() body: { playerId: string; itemId: string; quantity: number }
  ) {
    const success = this.inventoryService.removeItem(
      body.playerId,
      body.itemId,
      body.quantity
    );
    return { success };
  }

  @Get('recipes')
  getAllRecipes() {
    return this.inventoryService.getCraftingRecipes();
  }

  @Get('recipes/available/:playerId/:level')
  getAvailableRecipes(
    @Param('playerId') playerId: string,
    @Param('level') level: string
  ) {
    return this.inventoryService.getAvailableRecipes(
      playerId,
      parseInt(level)
    );
  }

  @Post('craft')
  async craftItem(
    @Body() body: { playerId: string; recipeId: string; playerLevel: number }
  ) {
    return this.inventoryService.craftItem(
      body.playerId,
      body.recipeId,
      body.playerLevel
    );
  }

  @Post('transfer')
  transferItem(
    @Body()
    body: {
      fromPlayerId: string;
      toPlayerId: string;
      itemId: string;
      quantity: number;
    }
  ) {
    const success = this.inventoryService.transferItem(
      body.fromPlayerId,
      body.toPlayerId,
      body.itemId,
      body.quantity
    );
    return { success };
  }
}
