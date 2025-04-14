import { Injectable } from '@nestjs/common';

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'nft';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  stats?: Record<string, number>;
  tradeable: boolean;
  stackable: boolean;
  nftTokenId?: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  resultItemId: string;
  resultQuantity: number;
  requirements: {
    itemId: string;
    quantity: number;
  }[];
  craftingTime: number; // in seconds
  requiredLevel?: number;
}

@Injectable()
export class InventoryService {
  private playerInventories: Map<string, InventoryItem[]> = new Map();
  private craftingRecipes: Map<string, CraftingRecipe> = new Map();

  constructor() {
    this.initializeRecipes();
  }

  private initializeRecipes() {
    const recipes: CraftingRecipe[] = [
      {
        id: 'iron_sword',
        name: 'Iron Sword',
        resultItemId: 'sword_iron',
        resultQuantity: 1,
        requirements: [
          { itemId: 'iron_ingot', quantity: 3 },
          { itemId: 'wood', quantity: 1 },
        ],
        craftingTime: 60,
        requiredLevel: 5,
      },
      {
        id: 'health_potion',
        name: 'Health Potion',
        resultItemId: 'potion_health',
        resultQuantity: 3,
        requirements: [
          { itemId: 'herb_red', quantity: 2 },
          { itemId: 'water', quantity: 1 },
        ],
        craftingTime: 30,
      },
      {
        id: 'legendary_armor',
        name: 'Legendary Armor',
        resultItemId: 'armor_legendary',
        resultQuantity: 1,
        requirements: [
          { itemId: 'dragon_scale', quantity: 5 },
          { itemId: 'mythril', quantity: 10 },
          { itemId: 'enchanted_gem', quantity: 3 },
        ],
        craftingTime: 300,
        requiredLevel: 50,
      },
    ];

    recipes.forEach((recipe) => {
      this.craftingRecipes.set(recipe.id, recipe);
    });
  }

  /**
   * Get player inventory
   */
  getInventory(playerId: string): InventoryItem[] {
    return this.playerInventories.get(playerId) || [];
  }

  /**
   * Add item to inventory
   */
  addItem(playerId: string, item: InventoryItem): void {
    const inventory = this.playerInventories.get(playerId) || [];

    // Check if item is stackable and already exists
    if (item.stackable) {
      const existingItem = inventory.find((i) => i.itemId === item.itemId);

      if (existingItem) {
        existingItem.quantity += item.quantity;
        this.playerInventories.set(playerId, inventory);
        return;
      }
    }

    // Add as new item
    inventory.push(item);
    this.playerInventories.set(playerId, inventory);
  }

  /**
   * Remove item from inventory
   */
  removeItem(playerId: string, itemId: string, quantity: number): boolean {
    const inventory = this.playerInventories.get(playerId) || [];
    const item = inventory.find((i) => i.id === itemId);

    if (!item || item.quantity < quantity) {
      return false;
    }

    if (item.quantity === quantity) {
      // Remove item completely
      const newInventory = inventory.filter((i) => i.id !== itemId);
      this.playerInventories.set(playerId, newInventory);
    } else {
      // Decrease quantity
      item.quantity -= quantity;
      this.playerInventories.set(playerId, inventory);
    }

    return true;
  }

  /**
   * Get all crafting recipes
   */
  getCraftingRecipes(): CraftingRecipe[] {
    return Array.from(this.craftingRecipes.values());
  }

  /**
   * Get available recipes for player
   */
  getAvailableRecipes(playerId: string, playerLevel: number): CraftingRecipe[] {
    return Array.from(this.craftingRecipes.values()).filter((recipe) => {
      if (recipe.requiredLevel && playerLevel < recipe.requiredLevel) {
        return false;
      }

      // Check if player has required materials
      const inventory = this.getInventory(playerId);

      return recipe.requirements.every((req) => {
        const item = inventory.find((i) => i.itemId === req.itemId);
        return item && item.quantity >= req.quantity;
      });
    });
  }

  /**
   * Craft item
   */
  async craftItem(
    playerId: string,
    recipeId: string,
    playerLevel: number
  ): Promise<{ success: boolean; message: string; item?: InventoryItem }> {
    const recipe = this.craftingRecipes.get(recipeId);

    if (!recipe) {
      return { success: false, message: 'Recipe not found' };
    }

    if (recipe.requiredLevel && playerLevel < recipe.requiredLevel) {
      return {
        success: false,
        message: `Requires level ${recipe.requiredLevel}`,
      };
    }

    const inventory = this.getInventory(playerId);

    // Check materials
    for (const req of recipe.requirements) {
      const item = inventory.find((i) => i.itemId === req.itemId);

      if (!item || item.quantity < req.quantity) {
        return {
          success: false,
          message: `Insufficient materials: ${req.itemId}`,
        };
      }
    }

    // Remove materials
    for (const req of recipe.requirements) {
      const item = inventory.find((i) => i.itemId === req.itemId)!;
      this.removeItem(playerId, item.id, req.quantity);
    }

    // Add crafted item
    const craftedItem: InventoryItem = {
      id: `item-${Date.now()}`,
      itemId: recipe.resultItemId,
      name: recipe.name,
      type: 'weapon', // This would be determined by the item data
      rarity: 'common',
      quantity: recipe.resultQuantity,
      tradeable: true,
      stackable: true,
    };

    this.addItem(playerId, craftedItem);

    return {
      success: true,
      message: 'Item crafted successfully',
      item: craftedItem,
    };
  }

  /**
   * Transfer item between players
   */
  transferItem(
    fromPlayerId: string,
    toPlayerId: string,
    itemId: string,
    quantity: number
  ): boolean {
    const fromInventory = this.getInventory(fromPlayerId);
    const item = fromInventory.find((i) => i.id === itemId);

    if (!item || !item.tradeable || item.quantity < quantity) {
      return false;
    }

    // Remove from sender
    const removed = this.removeItem(fromPlayerId, itemId, quantity);

    if (!removed) return false;

    // Add to receiver
    const transferredItem = { ...item, quantity, id: `item-${Date.now()}` };
    this.addItem(toPlayerId, transferredItem);

    return true;
  }

  /**
   * Sort inventory by type and rarity
   */
  sortInventory(playerId: string): InventoryItem[] {
    const inventory = this.getInventory(playerId);

    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const typeOrder = { weapon: 0, armor: 1, consumable: 2, material: 3, nft: 4 };

    return inventory.sort((a, b) => {
      const typeCompare = typeOrder[a.type] - typeOrder[b.type];
      if (typeCompare !== 0) return typeCompare;

      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }
}
