import { Injectable } from '@nestjs/common';

export interface ReferralCode {
  code: string;
  ownerId: string;
  usedCount: number;
  maxUses: number;
  rewards: {
    referrer: { type: 'xp' | 'currency'; amount: number };
    referee: { type: 'xp' | 'currency'; amount: number };
  };
  expiresAt?: number;
  active: boolean;
}

export interface ReferralStats {
  playerId: string;
  totalReferrals: number;
  activeReferrals: number;
  totalRewardsEarned: number;
  referralCode: string;
}

@Injectable()
export class ReferralService {
  private referralCodes: Map<string, ReferralCode> = new Map();
  private playerReferrals: Map<string, Set<string>> = new Map(); // playerId -> Set of referred playerIds
  private playerStats: Map<string, ReferralStats> = new Map();

  /**
   * Generate referral code for player
   */
  generateReferralCode(playerId: string): ReferralCode {
    // Generate unique code
    const code = this.createUniqueCode(playerId);

    const referralCode: ReferralCode = {
      code,
      ownerId: playerId,
      usedCount: 0,
      maxUses: 100,
      rewards: {
        referrer: { type: 'currency', amount: 100 },
        referee: { type: 'currency', amount: 50 },
      },
      active: true,
    };

    this.referralCodes.set(code, referralCode);

    // Initialize stats if not exists
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        playerId,
        totalReferrals: 0,
        activeReferrals: 0,
        totalRewardsEarned: 0,
        referralCode: code,
      });
    }

    return referralCode;
  }

  /**
   * Create unique referral code
   */
  private createUniqueCode(playerId: string): string {
    const shortId = playerId.substring(0, 8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${shortId}-${random}`;
  }

  /**
   * Use referral code
   */
  async useReferralCode(
    code: string,
    newPlayerId: string
  ): Promise<{ success: boolean; message: string; rewards?: any }> {
    const referralCode = this.referralCodes.get(code);

    if (!referralCode) {
      return { success: false, message: 'Invalid referral code' };
    }

    if (!referralCode.active) {
      return { success: false, message: 'Referral code is inactive' };
    }

    if (referralCode.usedCount >= referralCode.maxUses) {
      return { success: false, message: 'Referral code has reached max uses' };
    }

    if (referralCode.expiresAt && Date.now() > referralCode.expiresAt) {
      return { success: false, message: 'Referral code has expired' };
    }

    // Check if player already used a referral code
    const existingReferrer = this.findReferrer(newPlayerId);
    if (existingReferrer) {
      return { success: false, message: 'Player already used a referral code' };
    }

    // Check if trying to use own code
    if (referralCode.ownerId === newPlayerId) {
      return { success: false, message: 'Cannot use your own referral code' };
    }

    // Add referral
    const referrals = this.playerReferrals.get(referralCode.ownerId) || new Set();
    referrals.add(newPlayerId);
    this.playerReferrals.set(referralCode.ownerId, referrals);

    // Update code usage
    referralCode.usedCount++;
    this.referralCodes.set(code, referralCode);

    // Update stats
    const stats = this.playerStats.get(referralCode.ownerId);
    if (stats) {
      stats.totalReferrals++;
      stats.activeReferrals++;
      stats.totalRewardsEarned += referralCode.rewards.referrer.amount;
    }

    return {
      success: true,
      message: 'Referral code applied successfully',
      rewards: {
        referrer: referralCode.rewards.referrer,
        referee: referralCode.rewards.referee,
      },
    };
  }

  /**
   * Find who referred a player
   */
  private findReferrer(playerId: string): string | null {
    for (const [referrerId, referredPlayers] of this.playerReferrals.entries()) {
      if (referredPlayers.has(playerId)) {
        return referrerId;
      }
    }
    return null;
  }

  /**
   * Get player referral stats
   */
  getPlayerStats(playerId: string): ReferralStats | null {
    return this.playerStats.get(playerId) || null;
  }

  /**
   * Get referral code info
   */
  getReferralCode(code: string): ReferralCode | null {
    return this.referralCodes.get(code) || null;
  }

  /**
   * Get all referrals for a player
   */
  getPlayerReferrals(playerId: string): string[] {
    const referrals = this.playerReferrals.get(playerId);
    return referrals ? Array.from(referrals) : [];
  }

  /**
   * Deactivate referral code
   */
  deactivateCode(code: string): boolean {
    const referralCode = this.referralCodes.get(code);

    if (!referralCode) return false;

    referralCode.active = false;
    this.referralCodes.set(code, referralCode);

    return true;
  }

  /**
   * Get leaderboard of top referrers
   */
  getTopReferrers(limit: number = 10): ReferralStats[] {
    const allStats = Array.from(this.playerStats.values());

    return allStats
      .sort((a, b) => b.totalReferrals - a.totalReferrals)
      .slice(0, limit);
  }
}
