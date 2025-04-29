import { Injectable } from '@nestjs/common';

export interface PlayerStats {
  playerId: string;
  overall: {
    level: number;
    totalXP: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
    playTime: number; // in seconds
    achievements: number;
  };
  combat: {
    kills: number;
    deaths: number;
    assists: number;
    kda: number;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
  };
  economy: {
    goldEarned: number;
    goldSpent: number;
    itemsPurchased: number;
    nftsOwned: number;
    nftsSold: number;
  };
  social: {
    friendsCount: number;
    guildId?: string;
    referralsCount: number;
  };
  progression: {
    battlPassTier: number;
    questsCompleted: number;
    dailyQuestsCompleted: number;
    weeklyQuestsCompleted: number;
  };
  records: {
    longestWinStreak: number;
    currentWinStreak: number;
    mostKillsInGame: number;
    mostDamageInGame: number;
    fastestVictory: number; // in seconds
  };
}

export interface StatUpdate {
  playerId: string;
  category: keyof Omit<PlayerStats, 'playerId'>;
  stat: string;
  value: number;
  operation: 'set' | 'increment' | 'decrement';
}

export interface MatchResult {
  playerId: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  duration: number;
  goldEarned: number;
  xpEarned: number;
}

@Injectable()
export class StatsService {
  private playerStats: Map<string, PlayerStats> = new Map();

  /**
   * Get player stats
   */
  getPlayerStats(playerId: string): PlayerStats {
    let stats = this.playerStats.get(playerId);

    if (!stats) {
      stats = this.initializePlayerStats(playerId);
      this.playerStats.set(playerId, stats);
    }

    return stats;
  }

  /**
   * Initialize player stats
   */
  private initializePlayerStats(playerId: string): PlayerStats {
    return {
      playerId,
      overall: {
        level: 1,
        totalXP: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        winRate: 0,
        playTime: 0,
        achievements: 0,
      },
      combat: {
        kills: 0,
        deaths: 0,
        assists: 0,
        kda: 0,
        damageDealt: 0,
        damageTaken: 0,
        healingDone: 0,
      },
      economy: {
        goldEarned: 0,
        goldSpent: 0,
        itemsPurchased: 0,
        nftsOwned: 0,
        nftsSold: 0,
      },
      social: {
        friendsCount: 0,
        referralsCount: 0,
      },
      progression: {
        battlPassTier: 1,
        questsCompleted: 0,
        dailyQuestsCompleted: 0,
        weeklyQuestsCompleted: 0,
      },
      records: {
        longestWinStreak: 0,
        currentWinStreak: 0,
        mostKillsInGame: 0,
        mostDamageInGame: 0,
        fastestVictory: 0,
      },
    };
  }

  /**
   * Update stat
   */
  updateStat(update: StatUpdate): void {
    const stats = this.getPlayerStats(update.playerId);
    const category = stats[update.category] as any;

    if (!category || typeof category[update.stat] !== 'number') {
      throw new Error('Invalid stat path');
    }

    switch (update.operation) {
      case 'set':
        category[update.stat] = update.value;
        break;
      case 'increment':
        category[update.stat] += update.value;
        break;
      case 'decrement':
        category[update.stat] = Math.max(0, category[update.stat] - update.value);
        break;
    }

    this.playerStats.set(update.playerId, stats);
  }

  /**
   * Record match result
   */
  recordMatchResult(result: MatchResult): void {
    const stats = this.getPlayerStats(result.playerId);

    // Update overall stats
    stats.overall.gamesPlayed++;
    stats.overall.totalXP += result.xpEarned;
    stats.overall.playTime += result.duration;

    if (result.won) {
      stats.overall.gamesWon++;
      stats.records.currentWinStreak++;

      if (stats.records.currentWinStreak > stats.records.longestWinStreak) {
        stats.records.longestWinStreak = stats.records.currentWinStreak;
      }

      // Update fastest victory
      if (
        stats.records.fastestVictory === 0 ||
        result.duration < stats.records.fastestVictory
      ) {
        stats.records.fastestVictory = result.duration;
      }
    } else {
      stats.overall.gamesLost++;
      stats.records.currentWinStreak = 0;
    }

    // Calculate win rate
    stats.overall.winRate =
      stats.overall.gamesPlayed > 0
        ? (stats.overall.gamesWon / stats.overall.gamesPlayed) * 100
        : 0;

    // Update combat stats
    stats.combat.kills += result.kills;
    stats.combat.deaths += result.deaths;
    stats.combat.assists += result.assists;
    stats.combat.damageDealt += result.damageDealt;
    stats.combat.damageTaken += result.damageTaken;
    stats.combat.healingDone += result.healingDone;

    // Calculate KDA
    stats.combat.kda =
      stats.combat.deaths > 0
        ? (stats.combat.kills + stats.combat.assists) / stats.combat.deaths
        : stats.combat.kills + stats.combat.assists;

    // Update records
    if (result.kills > stats.records.mostKillsInGame) {
      stats.records.mostKillsInGame = result.kills;
    }

    if (result.damageDealt > stats.records.mostDamageInGame) {
      stats.records.mostDamageInGame = result.damageDealt;
    }

    // Update economy
    stats.economy.goldEarned += result.goldEarned;

    // Check level up
    this.checkLevelUp(stats);

    this.playerStats.set(result.playerId, stats);
  }

  /**
   * Check and process level up
   */
  private checkLevelUp(stats: PlayerStats): void {
    const xpRequired = this.getXPForLevel(stats.overall.level + 1);

    while (stats.overall.totalXP >= xpRequired && stats.overall.level < 100) {
      stats.overall.level++;
    }
  }

  /**
   * Get XP required for level
   */
  private getXPForLevel(level: number): number {
    return level * 1000;
  }

  /**
   * Get player summary
   */
  getPlayerSummary(playerId: string): any {
    const stats = this.getPlayerStats(playerId);

    return {
      playerId: stats.playerId,
      level: stats.overall.level,
      winRate: stats.overall.winRate.toFixed(2) + '%',
      kda: stats.combat.kda.toFixed(2),
      gamesPlayed: stats.overall.gamesPlayed,
      playtime: this.formatPlayTime(stats.overall.playTime),
      currentStreak: stats.records.currentWinStreak,
      achievements: stats.overall.achievements,
    };
  }

  /**
   * Format play time
   */
  private formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Compare players
   */
  comparePlayers(playerId1: string, playerId2: string): any {
    const stats1 = this.getPlayerStats(playerId1);
    const stats2 = this.getPlayerStats(playerId2);

    return {
      player1: this.getPlayerSummary(playerId1),
      player2: this.getPlayerSummary(playerId2),
      comparison: {
        levelDiff: stats1.overall.level - stats2.overall.level,
        winRateDiff: stats1.overall.winRate - stats2.overall.winRate,
        kdaDiff: stats1.combat.kda - stats2.combat.kda,
      },
    };
  }

  /**
   * Get all player stats
   */
  getAllPlayerStats(): PlayerStats[] {
    return Array.from(this.playerStats.values());
  }

  /**
   * Delete player stats
   */
  deletePlayerStats(playerId: string): boolean {
    return this.playerStats.delete(playerId);
  }

  /**
   * Reset player stats
   */
  resetPlayerStats(playerId: string): void {
    const newStats = this.initializePlayerStats(playerId);
    this.playerStats.set(playerId, newStats);
  }

  /**
   * Get category stats
   */
  getCategoryStats(
    playerId: string,
    category: keyof Omit<PlayerStats, 'playerId'>,
  ): any {
    const stats = this.getPlayerStats(playerId);
    return stats[category];
  }
}
