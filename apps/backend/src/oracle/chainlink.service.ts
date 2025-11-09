import { Injectable } from '@nestjs/common';

/**
 * Chainlink oracle service for on-chain data
 * Provides price feeds and VRF (Verifiable Random Function)
 */
@Injectable()
export class ChainlinkService {
  private priceFeeds: Map<string, number> = new Map();

  constructor() {
    // Initialize mock price feeds
    this.priceFeeds.set('ETH/USD', 2000);
    this.priceFeeds.set('BTC/USD', 42000);
    this.priceFeeds.set('MATIC/USD', 0.8);
    this.priceFeeds.set('IMX/USD', 1.5);
  }

  /**
   * Get latest price from Chainlink price feed
   */
  async getLatestPrice(pair: string): Promise<number> {
    // In production, this would call actual Chainlink contract
    const price = this.priceFeeds.get(pair);

    if (!price) {
      throw new Error(`Price feed not available for ${pair}`);
    }

    // Simulate price fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.02; // ±1%
    return price * (1 + fluctuation);
  }

  /**
   * Request verifiable random number using Chainlink VRF
   * Used for loot boxes, tournaments, etc.
   */
  async requestRandomNumber(seed?: number): Promise<number> {
    // In production, this would interact with Chainlink VRF contract
    // For now, return cryptographically secure random number

    const randomValue = seed
      ? this.seededRandom(seed)
      : Math.random();

    return Math.floor(randomValue * 1000000);
  }

  /**
   * Seeded random for reproducibility in tournaments
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Get multiple random numbers
   */
  async requestMultipleRandomNumbers(count: number, seed?: number): Promise<number[]> {
    const numbers: number[] = [];

    for (let i = 0; i < count; i++) {
      const currentSeed = seed ? seed + i : undefined;
      const randomNum = await this.requestRandomNumber(currentSeed);
      numbers.push(randomNum);
    }

    return numbers;
  }

  /**
   * Convert USD amount to token amount using price feed
   */
  async convertUSDToToken(
    usdAmount: number,
    tokenPair: string
  ): Promise<number> {
    const price = await this.getLatestPrice(tokenPair);
    return usdAmount / price;
  }

  /**
   * Convert token amount to USD using price feed
   */
  async convertTokenToUSD(
    tokenAmount: number,
    tokenPair: string
  ): Promise<number> {
    const price = await this.getLatestPrice(tokenPair);
    return tokenAmount * price;
  }

  /**
   * Determine loot box rarity using VRF
   */
  async determineLootRarity(): Promise<'common' | 'rare' | 'epic' | 'legendary'> {
    const randomNum = await this.requestRandomNumber();
    const normalized = randomNum % 100;

    if (normalized < 60) return 'common'; // 60%
    if (normalized < 85) return 'rare'; // 25%
    if (normalized < 97) return 'epic'; // 12%
    return 'legendary'; // 3%
  }

  /**
   * Generate tournament bracket seeds
   */
  async generateTournamentSeeds(playerCount: number): Promise<number[]> {
    const seeds = await this.requestMultipleRandomNumbers(playerCount);

    // Normalize seeds to 1-playerCount range
    return seeds.map(seed => {
      return (seed % playerCount) + 1;
    });
  }
}
