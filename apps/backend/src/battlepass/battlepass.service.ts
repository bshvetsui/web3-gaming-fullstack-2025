import { Injectable } from '@nestjs/common';

export interface BattlePassSeason {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  maxTier: number;
  active: boolean;
  rewards: BattlePassReward[];
}

export interface BattlePassReward {
  tier: number;
  type: 'free' | 'premium';
  reward: {
    type: 'xp' | 'currency' | 'item' | 'nft' | 'cosmetic';
    itemId?: string;
    amount?: number;
    name: string;
    imageUrl?: string;
  };
}

export interface PlayerBattlePass {
  playerId: string;
  seasonId: string;
  currentTier: number;
  experience: number;
  isPremium: boolean;
  claimedRewards: number[];
  purchasedAt?: Date;
}

@Injectable()
export class BattlePassService {
  private seasons: Map<string, BattlePassSeason> = new Map();
  private playerProgress: Map<string, PlayerBattlePass> = new Map();
  private readonly XP_PER_TIER = 1000;

  constructor() {
    this.initializeCurrentSeason();
  }

  private initializeCurrentSeason() {
    const now = Date.now();
    const seasonEnd = new Date();
    seasonEnd.setMonth(seasonEnd.getMonth() + 3); // 3 months season

    const season: BattlePassSeason = {
      id: 'season-1',
      name: 'Season 1: Genesis',
      startDate: now,
      endDate: seasonEnd.getTime(),
      maxTier: 100,
      active: true,
      rewards: this.generateSeasonRewards(100),
    };

    this.seasons.set(season.id, season);
  }

  private generateSeasonRewards(maxTier: number): BattlePassReward[] {
    const rewards: BattlePassReward[] = [];

    for (let tier = 1; tier <= maxTier; tier++) {
      // Free rewards every tier
      rewards.push({
        tier,
        type: 'free',
        reward: {
          type: 'xp',
          amount: 100 * tier,
          name: `${100 * tier} XP`,
        },
      });

      // Premium rewards
      if (tier % 5 === 0) {
        // Every 5 tiers - special reward
        rewards.push({
          tier,
          type: 'premium',
          reward: {
            type: 'cosmetic',
            itemId: `skin-${tier}`,
            name: `Exclusive Skin Tier ${tier}`,
            imageUrl: `https://placeholder.com/skin-${tier}.png`,
          },
        });
      } else {
        // Regular premium rewards
        rewards.push({
          tier,
          type: 'premium',
          reward: {
            type: 'currency',
            amount: 50 * tier,
            name: `${50 * tier} Tokens`,
          },
        });
      }

      // Legendary rewards at milestones
      if (tier === 25 || tier === 50 || tier === 75 || tier === 100) {
        rewards.push({
          tier,
          type: 'premium',
          reward: {
            type: 'nft',
            itemId: `legendary-${tier}`,
            name: `Legendary NFT - Tier ${tier}`,
            imageUrl: `https://placeholder.com/legendary-${tier}.png`,
          },
        });
      }
    }

    return rewards;
  }

  /**
   * Get current active season
   */
  getCurrentSeason(): BattlePassSeason | null {
    const now = Date.now();
    const activeSeason = Array.from(this.seasons.values()).find(
      (s) => s.active && s.startDate <= now && s.endDate > now
    );

    return activeSeason || null;
  }

  /**
   * Get player battle pass progress
   */
  getPlayerProgress(playerId: string, seasonId: string): PlayerBattlePass {
    const key = `${playerId}-${seasonId}`;
    let progress = this.playerProgress.get(key);

    if (!progress) {
      progress = {
        playerId,
        seasonId,
        currentTier: 0,
        experience: 0,
        isPremium: false,
        claimedRewards: [],
      };
      this.playerProgress.set(key, progress);
    }

    return progress;
  }

  /**
   * Purchase premium battle pass
   */
  purchasePremium(playerId: string, seasonId: string): boolean {
    const key = `${playerId}-${seasonId}`;
    const progress = this.getPlayerProgress(playerId, seasonId);

    if (progress.isPremium) {
      return false; // Already premium
    }

    progress.isPremium = true;
    progress.purchasedAt = new Date();

    this.playerProgress.set(key, progress);

    return true;
  }

  /**
   * Add experience to battle pass
   */
  addExperience(
    playerId: string,
    seasonId: string,
    experience: number
  ): PlayerBattlePass {
    const key = `${playerId}-${seasonId}`;
    const progress = this.getPlayerProgress(playerId, seasonId);
    const season = this.seasons.get(seasonId);

    if (!season) {
      throw new Error('Season not found');
    }

    progress.experience += experience;

    // Level up tiers
    while (progress.experience >= this.XP_PER_TIER && progress.currentTier < season.maxTier) {
      progress.experience -= this.XP_PER_TIER;
      progress.currentTier++;
    }

    this.playerProgress.set(key, progress);

    return progress;
  }

  /**
   * Claim tier rewards
   */
  claimReward(
    playerId: string,
    seasonId: string,
    tier: number
  ): BattlePassReward[] | null {
    const key = `${playerId}-${seasonId}`;
    const progress = this.getPlayerProgress(playerId, seasonId);
    const season = this.seasons.get(seasonId);

    if (!season) return null;

    // Check if tier is unlocked
    if (tier > progress.currentTier) {
      return null;
    }

    // Check if already claimed
    if (progress.claimedRewards.includes(tier)) {
      return null;
    }

    // Get rewards for this tier
    const tierRewards = season.rewards.filter((r) => r.tier === tier);

    // Filter based on premium status
    const claimableRewards = tierRewards.filter(
      (r) => r.type === 'free' || (r.type === 'premium' && progress.isPremium)
    );

    // Mark as claimed
    progress.claimedRewards.push(tier);
    this.playerProgress.set(key, progress);

    return claimableRewards;
  }

  /**
   * Claim all available rewards
   */
  claimAllRewards(
    playerId: string,
    seasonId: string
  ): BattlePassReward[] {
    const progress = this.getPlayerProgress(playerId, seasonId);
    const allRewards: BattlePassReward[] = [];

    for (let tier = 1; tier <= progress.currentTier; tier++) {
      if (!progress.claimedRewards.includes(tier)) {
        const rewards = this.claimReward(playerId, seasonId, tier);
        if (rewards) {
          allRewards.push(...rewards);
        }
      }
    }

    return allRewards;
  }

  /**
   * Get available rewards to claim
   */
  getUnclaimedRewards(
    playerId: string,
    seasonId: string
  ): { tier: number; rewards: BattlePassReward[] }[] {
    const progress = this.getPlayerProgress(playerId, seasonId);
    const season = this.seasons.get(seasonId);

    if (!season) return [];

    const unclaimed: { tier: number; rewards: BattlePassReward[] }[] = [];

    for (let tier = 1; tier <= progress.currentTier; tier++) {
      if (!progress.claimedRewards.includes(tier)) {
        const tierRewards = season.rewards.filter(
          (r) =>
            r.tier === tier &&
            (r.type === 'free' || (r.type === 'premium' && progress.isPremium))
        );

        if (tierRewards.length > 0) {
          unclaimed.push({ tier, rewards: tierRewards });
        }
      }
    }

    return unclaimed;
  }

  /**
   * Get battle pass stats
   */
  getStats(playerId: string, seasonId: string) {
    const progress = this.getPlayerProgress(playerId, seasonId);
    const season = this.seasons.get(seasonId);

    if (!season) return null;

    const xpToNextTier = this.XP_PER_TIER - progress.experience;
    const progressPercentage =
      (progress.currentTier / season.maxTier) * 100;

    return {
      currentTier: progress.currentTier,
      maxTier: season.maxTier,
      experience: progress.experience,
      xpToNextTier,
      progressPercentage: progressPercentage.toFixed(1),
      isPremium: progress.isPremium,
      claimedCount: progress.claimedRewards.length,
      unclaimedCount: this.getUnclaimedRewards(playerId, seasonId).length,
    };
  }
}
