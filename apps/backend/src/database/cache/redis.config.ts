import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

/**
 * Redis/Upstash configuration for caching and rate limiting
 */
@Injectable()
export class RedisConfig {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }

  getClient(): Redis {
    return this.client;
  }

  /**
   * Cache keys configuration
   */
  getCacheKeys() {
    return {
      playerData: (walletAddress: string) => `player:${walletAddress}`,
      leaderboard: (type: string) => `leaderboard:${type}`,
      nftMetadata: (tokenId: string) => `nft:${tokenId}`,
      gameSession: (sessionId: string) => `session:${sessionId}`,
    };
  }

  /**
   * Get TTL values for different cache types
   */
  getTTL() {
    return {
      playerData: 300, // 5 minutes
      leaderboard: 60, // 1 minute
      nftMetadata: 3600, // 1 hour
      gameSession: 1800, // 30 minutes
    };
  }
}
