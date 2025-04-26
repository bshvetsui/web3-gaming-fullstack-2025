'use client';

import { useState, useEffect } from 'react';
import styles from './BattlePass.module.css';

interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeReward?: {
    type: string;
    itemId: string;
    quantity: number;
  };
  premiumReward?: {
    type: string;
    itemId: string;
    quantity: number;
  };
}

interface BattlePassProgress {
  playerId: string;
  currentTier: number;
  xp: number;
  isPremium: boolean;
}

export const BattlePass = () => {
  const [progress, setProgress] = useState<BattlePassProgress | null>(null);
  const [tiers, setTiers] = useState<BattlePassTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBattlePassData();
  }, []);

  const fetchBattlePassData = async () => {
    try {
      // Mock data for now
      const mockProgress: BattlePassProgress = {
        playerId: 'player1',
        currentTier: 15,
        xp: 12500,
        isPremium: true,
      };

      const mockTiers: BattlePassTier[] = Array.from({ length: 100 }, (_, i) => ({
        tier: i + 1,
        xpRequired: (i + 1) * 1000,
        freeReward:
          (i + 1) % 5 === 0
            ? {
                type: 'currency',
                itemId: 'gold',
                quantity: 100,
              }
            : undefined,
        premiumReward: {
          type: i % 10 === 0 ? 'cosmetic' : 'consumable',
          itemId: `reward-${i + 1}`,
          quantity: 1,
        },
      }));

      setProgress(mockProgress);
      setTiers(mockTiers);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch battle pass data:', error);
      setLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    // TODO: Implement premium upgrade
    console.log('Upgrade to premium');
  };

  const claimReward = async (tier: number, isPremium: boolean) => {
    // TODO: Implement reward claiming
    console.log('Claim reward:', tier, isPremium);
  };

  if (loading) {
    return <div className={styles.loading}>Loading Battle Pass...</div>;
  }

  if (!progress) {
    return <div className={styles.error}>Failed to load Battle Pass</div>;
  }

  const visibleTiers = tiers.slice(
    Math.max(0, progress.currentTier - 5),
    Math.min(100, progress.currentTier + 10),
  );

  const currentTierProgress =
    progress.currentTier < 100
      ? (progress.xp / tiers[progress.currentTier].xpRequired) * 100
      : 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Battle Pass - Season 1</h2>
        <div className={styles.stats}>
          <span className={styles.tier}>Tier: {progress.currentTier}/100</span>
          <span className={styles.xp}>XP: {progress.xp.toLocaleString()}</span>
          {!progress.isPremium && (
            <button className={styles.upgradeBtn} onClick={upgradeToPremium}>
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${currentTierProgress}%` }} />
        <span className={styles.progressText}>
          {currentTierProgress.toFixed(0)}% to next tier
        </span>
      </div>

      <div className={styles.tracks}>
        <div className={styles.trackLabel}>
          <span>Free Track</span>
        </div>
        <div className={styles.trackLabel}>
          <span>Premium Track</span>
        </div>
      </div>

      <div className={styles.tiersContainer}>
        {visibleTiers.map((tier) => {
          const isUnlocked = tier.tier <= progress.currentTier;
          const isCurrent = tier.tier === progress.currentTier;

          return (
            <div
              key={tier.tier}
              className={`${styles.tierCard} ${isCurrent ? styles.current : ''} ${
                isUnlocked ? styles.unlocked : styles.locked
              }`}
            >
              <div className={styles.tierNumber}>{tier.tier}</div>

              <div className={styles.rewards}>
                {/* Free Reward */}
                <div className={styles.rewardSlot}>
                  {tier.freeReward ? (
                    <div className={styles.reward}>
                      <div className={styles.rewardIcon}>🎁</div>
                      <div className={styles.rewardInfo}>
                        <span>{tier.freeReward.type}</span>
                        <span>x{tier.freeReward.quantity}</span>
                      </div>
                      {isUnlocked && (
                        <button
                          className={styles.claimBtn}
                          onClick={() => claimReward(tier.tier, false)}
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptyReward}>-</div>
                  )}
                </div>

                {/* Premium Reward */}
                <div
                  className={`${styles.rewardSlot} ${
                    !progress.isPremium ? styles.premiumLocked : ''
                  }`}
                >
                  {tier.premiumReward ? (
                    <div className={styles.reward}>
                      <div className={styles.rewardIcon}>✨</div>
                      <div className={styles.rewardInfo}>
                        <span>{tier.premiumReward.type}</span>
                        <span>x{tier.premiumReward.quantity}</span>
                      </div>
                      {isUnlocked && progress.isPremium && (
                        <button
                          className={styles.claimBtn}
                          onClick={() => claimReward(tier.tier, true)}
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptyReward}>-</div>
                  )}
                </div>
              </div>

              <div className={styles.xpRequired}>
                {tier.xpRequired.toLocaleString()} XP
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.info}>
        <p>Complete quests and play matches to earn XP!</p>
        <p>Season ends in: 45 days</p>
      </div>
    </div>
  );
};
