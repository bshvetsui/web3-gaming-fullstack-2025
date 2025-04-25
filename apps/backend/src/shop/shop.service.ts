import { Injectable } from '@nestjs/common';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'cosmetic' | 'currency' | 'bundle';
  price: {
    gold?: number;
    gems?: number;
    usd?: number;
  };
  stock?: number; // undefined = unlimited
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  imageUrl: string;
  bundle?: {
    items: Array<{ itemId: string; quantity: number }>;
  };
  availableFrom?: Date;
  availableUntil?: Date;
}

export interface PlayerCurrency {
  playerId: string;
  gold: number;
  gems: number;
  premiumCurrency: number;
}

export interface Transaction {
  id: string;
  playerId: string;
  itemId: string;
  quantity: number;
  price: {
    gold?: number;
    gems?: number;
    usd?: number;
  };
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

@Injectable()
export class ShopService {
  private shopItems: Map<string, ShopItem> = new Map();
  private playerCurrencies: Map<string, PlayerCurrency> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private itemStock: Map<string, number> = new Map();

  constructor() {
    this.initializeShop();
  }

  /**
   * Initialize shop with default items
   */
  private initializeShop(): void {
    const defaultItems: ShopItem[] = [
      // Consumables
      {
        id: 'health-potion',
        name: 'Health Potion',
        description: 'Restores 100 HP',
        type: 'consumable',
        price: { gold: 50 },
        category: 'consumables',
        rarity: 'common',
        imageUrl: '/items/health-potion.png',
      },
      {
        id: 'mana-potion',
        name: 'Mana Potion',
        description: 'Restores 100 MP',
        type: 'consumable',
        price: { gold: 50 },
        category: 'consumables',
        rarity: 'common',
        imageUrl: '/items/mana-potion.png',
      },
      // Currency
      {
        id: 'gem-pack-small',
        name: 'Small Gem Pack',
        description: '100 Gems',
        type: 'currency',
        price: { usd: 4.99 },
        category: 'currency',
        rarity: 'common',
        imageUrl: '/items/gems.png',
      },
      {
        id: 'gem-pack-medium',
        name: 'Medium Gem Pack',
        description: '500 Gems',
        type: 'currency',
        price: { usd: 19.99 },
        category: 'currency',
        rarity: 'rare',
        imageUrl: '/items/gems.png',
      },
      {
        id: 'gem-pack-large',
        name: 'Large Gem Pack',
        description: '1200 Gems',
        type: 'currency',
        price: { usd: 49.99 },
        category: 'currency',
        rarity: 'epic',
        imageUrl: '/items/gems.png',
      },
      // Equipment
      {
        id: 'iron-sword',
        name: 'Iron Sword',
        description: '+10 Attack',
        type: 'equipment',
        price: { gold: 500 },
        category: 'weapons',
        rarity: 'common',
        imageUrl: '/items/iron-sword.png',
      },
      {
        id: 'steel-armor',
        name: 'Steel Armor',
        description: '+15 Defense',
        type: 'equipment',
        price: { gold: 750 },
        category: 'armor',
        rarity: 'rare',
        imageUrl: '/items/steel-armor.png',
      },
      // Cosmetics
      {
        id: 'red-cape',
        name: 'Red Cape',
        description: 'Stylish red cape',
        type: 'cosmetic',
        price: { gems: 100 },
        category: 'cosmetics',
        rarity: 'rare',
        imageUrl: '/items/red-cape.png',
      },
      {
        id: 'golden-crown',
        name: 'Golden Crown',
        description: 'Show your status',
        type: 'cosmetic',
        price: { gems: 500 },
        category: 'cosmetics',
        rarity: 'legendary',
        imageUrl: '/items/golden-crown.png',
      },
      // Bundles
      {
        id: 'starter-pack',
        name: 'Starter Pack',
        description: 'Everything you need to begin',
        type: 'bundle',
        price: { gems: 200 },
        category: 'bundles',
        rarity: 'epic',
        imageUrl: '/items/starter-pack.png',
        bundle: {
          items: [
            { itemId: 'health-potion', quantity: 10 },
            { itemId: 'mana-potion', quantity: 10 },
            { itemId: 'iron-sword', quantity: 1 },
          ],
        },
      },
    ];

    defaultItems.forEach((item) => {
      this.shopItems.set(item.id, item);
      if (item.stock !== undefined) {
        this.itemStock.set(item.id, item.stock);
      }
    });
  }

  /**
   * Get all shop items
   */
  getShopItems(category?: string): ShopItem[] {
    const now = new Date();
    let items = Array.from(this.shopItems.values());

    // Filter by availability
    items = items.filter((item) => {
      if (item.availableFrom && item.availableFrom > now) return false;
      if (item.availableUntil && item.availableUntil < now) return false;
      return true;
    });

    // Filter by category
    if (category) {
      items = items.filter((item) => item.category === category);
    }

    return items;
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): ShopItem | null {
    return this.shopItems.get(itemId) || null;
  }

  /**
   * Get player currency
   */
  getPlayerCurrency(playerId: string): PlayerCurrency {
    let currency = this.playerCurrencies.get(playerId);
    if (!currency) {
      currency = {
        playerId,
        gold: 1000, // Starting gold
        gems: 0,
        premiumCurrency: 0,
      };
      this.playerCurrencies.set(playerId, currency);
    }
    return currency;
  }

  /**
   * Add currency to player
   */
  addCurrency(
    playerId: string,
    type: 'gold' | 'gems' | 'premiumCurrency',
    amount: number,
  ): PlayerCurrency {
    const currency = this.getPlayerCurrency(playerId);
    currency[type] += amount;
    this.playerCurrencies.set(playerId, currency);
    return currency;
  }

  /**
   * Purchase item
   */
  purchaseItem(
    playerId: string,
    itemId: string,
    quantity: number = 1,
  ): Transaction {
    const item = this.shopItems.get(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    // Check stock
    if (item.stock !== undefined) {
      const currentStock = this.itemStock.get(itemId) || 0;
      if (currentStock < quantity) {
        throw new Error('Insufficient stock');
      }
    }

    // Check availability
    const now = new Date();
    if (item.availableFrom && item.availableFrom > now) {
      throw new Error('Item not yet available');
    }
    if (item.availableUntil && item.availableUntil < now) {
      throw new Error('Item no longer available');
    }

    const currency = this.getPlayerCurrency(playerId);
    const totalPrice = {
      gold: (item.price.gold || 0) * quantity,
      gems: (item.price.gems || 0) * quantity,
    };

    // Check if player has enough currency
    if (totalPrice.gold > 0 && currency.gold < totalPrice.gold) {
      throw new Error('Insufficient gold');
    }
    if (totalPrice.gems > 0 && currency.gems < totalPrice.gems) {
      throw new Error('Insufficient gems');
    }

    // Deduct currency
    if (totalPrice.gold > 0) {
      currency.gold -= totalPrice.gold;
    }
    if (totalPrice.gems > 0) {
      currency.gems -= totalPrice.gems;
    }
    this.playerCurrencies.set(playerId, currency);

    // Update stock
    if (item.stock !== undefined) {
      const currentStock = this.itemStock.get(itemId) || 0;
      this.itemStock.set(itemId, currentStock - quantity);
    }

    // Create transaction
    const transaction: Transaction = {
      id: `txn-${Date.now()}-${playerId}`,
      playerId,
      itemId,
      quantity,
      price: totalPrice,
      timestamp: new Date(),
      status: 'completed',
    };

    this.transactions.set(transaction.id, transaction);

    return transaction;
  }

  /**
   * Get player transactions
   */
  getPlayerTransactions(playerId: string): Transaction[] {
    return Array.from(this.transactions.values()).filter(
      (txn) => txn.playerId === playerId,
    );
  }

  /**
   * Add new shop item
   */
  addShopItem(item: ShopItem): void {
    this.shopItems.set(item.id, item);
    if (item.stock !== undefined) {
      this.itemStock.set(item.id, item.stock);
    }
  }

  /**
   * Remove shop item
   */
  removeShopItem(itemId: string): boolean {
    this.itemStock.delete(itemId);
    return this.shopItems.delete(itemId);
  }

  /**
   * Update item stock
   */
  updateStock(itemId: string, stock: number): void {
    this.itemStock.set(itemId, stock);
  }

  /**
   * Get item stock
   */
  getStock(itemId: string): number | undefined {
    return this.itemStock.get(itemId);
  }

  /**
   * Refund transaction
   */
  refundTransaction(transactionId: string): boolean {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== 'completed') {
      return false;
    }

    const currency = this.getPlayerCurrency(transaction.playerId);

    // Refund currency
    if (transaction.price.gold) {
      currency.gold += transaction.price.gold;
    }
    if (transaction.price.gems) {
      currency.gems += transaction.price.gems;
    }

    this.playerCurrencies.set(transaction.playerId, currency);

    // Update stock
    const item = this.shopItems.get(transaction.itemId);
    if (item && item.stock !== undefined) {
      const currentStock = this.itemStock.get(transaction.itemId) || 0;
      this.itemStock.set(transaction.itemId, currentStock + transaction.quantity);
    }

    // Update transaction status
    transaction.status = 'refunded';
    this.transactions.set(transactionId, transaction);

    return true;
  }

  /**
   * Get shop categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.shopItems.forEach((item) => categories.add(item.category));
    return Array.from(categories);
  }
}
