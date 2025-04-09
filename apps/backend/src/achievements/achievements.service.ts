import { Injectable } from '@nestjs/common';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'social' | 'collection' | 'special';
  icon: string;
  requirement: {
    type: 'kills' | 'wins' | 'score' | 'playtime' | 'nfts' | 'custom';
    target: number;
  };
  reward: {
    type: 'xp' | 'item' | 'title' | 'badge';
    value: any;
  };
}

export interface PlayerAchievement {
  achievementId: string;
  playerId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
}

@Injectable()
export class AchievementsService {
  private achievements: Map<string, Achievement> = new Map();
  private playerAchievements: Map<string, PlayerAchievement[]> = new Map();

  constructor() {
    this.initializeAchievements();
  }

  private initializeAchievements() {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Get your first kill',
        category: 'combat',
        icon: '🎯',
        requirement: { type: 'kills', target: 1 },
        reward: { type: 'xp', value: 100 },
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Win 100 matches',
        category: 'combat',
        icon: '🏆',
        requirement: { type: 'wins', target: 100 },
        reward: { type: 'title', value: 'Veteran' },
      },
      {
        id: 'collector',
        name: 'Collector',
        description: 'Own 50 NFT items',
        category: 'collection',
        icon: '💎',
        requirement: { type: 'nfts', target: 50 },
        reward: { type: 'badge', value: 'collector_badge' },
      },
      {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Reach 10,000 total score',
        category: 'combat',
        icon: '⭐',
        requirement: { type: 'score', target: 10000 },
        reward: { type: 'xp', value: 500 },
      },
      {
        id: 'dedicated',
        name: 'Dedicated Player',
        description: 'Play for 100 hours',
        category: 'special',
        icon: '⏰',
        requirement: { type: 'playtime', target: 360000 },
        reward: { type: 'item', value: 'legendary_chest' },
      },
    ];

    defaultAchievements.forEach((achievement) => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get player achievements with progress
   */
  getPlayerAchievements(playerId: string): PlayerAchievement[] {
    return this.playerAchievements.get(playerId) || [];
  }

  /**
   * Update achievement progress
   */
  async updateProgress(
    playerId: string,
    achievementId: string,
    progress: number
  ): Promise<PlayerAchievement> {
    const playerAchievements = this.playerAchievements.get(playerId) || [];
    let achievement = playerAchievements.find(
      (a) => a.achievementId === achievementId
    );

    if (!achievement) {
      achievement = {
        achievementId,
        playerId,
        progress: 0,
        completed: false,
      };
      playerAchievements.push(achievement);
    }

    achievement.progress = progress;

    const achievementData = this.achievements.get(achievementId);
    if (
      achievementData &&
      progress >= achievementData.requirement.target &&
      !achievement.completed
    ) {
      achievement.completed = true;
      achievement.completedAt = new Date();

      // Award rewards would go here
    }

    this.playerAchievements.set(playerId, playerAchievements);

    return achievement;
  }

  /**
   * Check and unlock achievements based on player stats
   */
  async checkAchievements(
    playerId: string,
    stats: {
      kills?: number;
      wins?: number;
      score?: number;
      playtime?: number;
      nftCount?: number;
    }
  ): Promise<PlayerAchievement[]> {
    const unlockedAchievements: PlayerAchievement[] = [];

    for (const achievement of this.achievements.values()) {
      let progress = 0;

      switch (achievement.requirement.type) {
        case 'kills':
          progress = stats.kills || 0;
          break;
        case 'wins':
          progress = stats.wins || 0;
          break;
        case 'score':
          progress = stats.score || 0;
          break;
        case 'playtime':
          progress = stats.playtime || 0;
          break;
        case 'nfts':
          progress = stats.nftCount || 0;
          break;
      }

      const updated = await this.updateProgress(
        playerId,
        achievement.id,
        progress
      );

      if (updated.completed) {
        unlockedAchievements.push(updated);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Get completion percentage for player
   */
  getCompletionPercentage(playerId: string): number {
    const playerAchievements = this.getPlayerAchievements(playerId);
    const totalAchievements = this.achievements.size;

    if (totalAchievements === 0) return 0;

    const completed = playerAchievements.filter((a) => a.completed).length;
    return (completed / totalAchievements) * 100;
  }
}
