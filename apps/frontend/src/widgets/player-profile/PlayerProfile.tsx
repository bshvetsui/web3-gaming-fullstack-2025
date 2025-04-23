'use client';

import { useState } from 'react';
import { formatCompactNumber, formatDuration } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import styles from './PlayerProfile.module.css';

interface PlayerStats {
  level: number;
  experience: number;
  nextLevelXP: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  killDeathRatio: number;
  totalScore: number;
  playtime: number;
  rank: string;
  achievementsUnlocked: number;
  totalAchievements: number;
}

interface PlayerProfileProps {
  username: string;
  walletAddress: string;
  avatarUrl?: string;
  stats: PlayerStats;
  onEditProfile?: () => void;
}

export function PlayerProfile({
  username,
  walletAddress,
  avatarUrl,
  stats,
  onEditProfile,
}: PlayerProfileProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'inventory'>('stats');

  const winRate = stats.gamesPlayed > 0
    ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
    : '0.0';

  const xpProgress = (stats.experience / stats.nextLevelXP) * 100;

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.levelBadge}>Lvl {stats.level}</div>
        </div>

        <div className={styles.info}>
          <h1 className={styles.username}>{username}</h1>
          <p className={styles.wallet}>
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
          <div className={styles.rank}>
            <span className={styles.rankBadge}>{stats.rank}</span>
          </div>
        </div>

        {onEditProfile && (
          <Button onClick={onEditProfile} variant="outline">
            Edit Profile
          </Button>
        )}
      </div>

      <div className={styles.xpBar}>
        <div className={styles.xpLabel}>
          <span>XP: {formatCompactNumber(stats.experience)} / {formatCompactNumber(stats.nextLevelXP)}</span>
          <span>{xpProgress.toFixed(1)}%</span>
        </div>
        <div className={styles.xpProgress}>
          <div className={styles.xpFill} style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'achievements' ? styles.active : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements ({stats.achievementsUnlocked}/{stats.totalAchievements})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'inventory' ? styles.active : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'stats' && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Games Played</div>
              <div className={styles.statValue}>{formatCompactNumber(stats.gamesPlayed)}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Win Rate</div>
              <div className={styles.statValue}>{winRate}%</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>K/D Ratio</div>
              <div className={styles.statValue}>{stats.killDeathRatio.toFixed(2)}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Score</div>
              <div className={styles.statValue}>{formatCompactNumber(stats.totalScore)}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Playtime</div>
              <div className={styles.statValue}>{formatDuration(stats.playtime)}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Wins / Losses</div>
              <div className={styles.statValue}>
                {stats.wins} / {stats.losses}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className={styles.achievementsPlaceholder}>
            <p>Achievements coming soon...</p>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className={styles.inventoryPlaceholder}>
            <p>Inventory items will be displayed here...</p>
          </div>
        )}
      </div>
    </div>
  );
}
