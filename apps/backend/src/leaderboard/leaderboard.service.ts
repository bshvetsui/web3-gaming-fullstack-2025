import { Injectable } from '@nestjs/common';

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  rank: number;
  score: number;
  metadata?: Record<string, any>;
}

export type LeaderboardCategory =
  | 'level'
  | 'tournaments'
  | 'achievements'
  | 'pvp'
  | 'guild'
  | 'weekly'
  | 'season';

export interface PlayerStats {
  playerId: string;
  playerName: string;
  level: number;
  tournamentWins: number;
  achievementPoints: number;
  pvpRating: number;
  guildRating: number;
  weeklyScore: number;
  seasonScore: number;
}

@Injectable()
export class LeaderboardService {
  private playerStats: Map<string, PlayerStats> = new Map();

  constructor() {
    this.initializeTestData();
  }

  /**
   * Initialize test data
   */
  private initializeTestData(): void {
    const testPlayers = [
      { id: 'player1', name: 'DragonSlayer', level: 45, tournamentWins: 12 },
      { id: 'player2', name: 'ShadowMage', level: 42, tournamentWins: 8 },
      { id: 'player3', name: 'IronKnight', level: 40, tournamentWins: 15 },
      { id: 'player4', name: 'StormArcher', level: 38, tournamentWins: 6 },
      { id: 'player5', name: 'FlameWizard', level: 36, tournamentWins: 10 },
    ];

    testPlayers.forEach((player) => {
      this.playerStats.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        level: player.level,
        tournamentWins: player.tournamentWins,
        achievementPoints: Math.floor(Math.random() * 5000),
        pvpRating: 1000 + Math.floor(Math.random() * 1000),
        guildRating: 1000 + Math.floor(Math.random() * 500),
        weeklyScore: Math.floor(Math.random() * 1000),
        seasonScore: Math.floor(Math.random() * 10000),
      });
    });
  }

  /**
   * Get leaderboard by category
   */
  getLeaderboard(
    category: LeaderboardCategory,
    limit: number = 100,
    offset: number = 0,
  ): LeaderboardEntry[] {
    const players = Array.from(this.playerStats.values());

    // Sort based on category
    let sortedPlayers: PlayerStats[];
    switch (category) {
      case 'level':
        sortedPlayers = players.sort((a, b) => b.level - a.level);
        break;
      case 'tournaments':
        sortedPlayers = players.sort((a, b) => b.tournamentWins - a.tournamentWins);
        break;
      case 'achievements':
        sortedPlayers = players.sort(
          (a, b) => b.achievementPoints - a.achievementPoints,
        );
        break;
      case 'pvp':
        sortedPlayers = players.sort((a, b) => b.pvpRating - a.pvpRating);
        break;
      case 'guild':
        sortedPlayers = players.sort((a, b) => b.guildRating - a.guildRating);
        break;
      case 'weekly':
        sortedPlayers = players.sort((a, b) => b.weeklyScore - a.weeklyScore);
        break;
      case 'season':
        sortedPlayers = players.sort((a, b) => b.seasonScore - a.seasonScore);
        break;
      default:
        sortedPlayers = players;
    }

    // Apply pagination
    const paginatedPlayers = sortedPlayers.slice(offset, offset + limit);

    // Map to leaderboard entries
    return paginatedPlayers.map((player, index) => {
      const entry: LeaderboardEntry = {
        playerId: player.playerId,
        playerName: player.playerName,
        rank: offset + index + 1,
        score: this.getCategoryScore(player, category),
        metadata: {
          level: player.level,
          tournamentWins: player.tournamentWins,
        },
      };
      return entry;
    });
  }

  /**
   * Get category-specific score
   */
  private getCategoryScore(
    player: PlayerStats,
    category: LeaderboardCategory,
  ): number {
    switch (category) {
      case 'level':
        return player.level;
      case 'tournaments':
        return player.tournamentWins;
      case 'achievements':
        return player.achievementPoints;
      case 'pvp':
        return player.pvpRating;
      case 'guild':
        return player.guildRating;
      case 'weekly':
        return player.weeklyScore;
      case 'season':
        return player.seasonScore;
      default:
        return 0;
    }
  }

  /**
   * Get player rank in category
   */
  getPlayerRank(
    playerId: string,
    category: LeaderboardCategory,
  ): { rank: number; total: number } | null {
    const leaderboard = this.getLeaderboard(category, 10000);
    const entry = leaderboard.find((e) => e.playerId === playerId);

    if (!entry) {
      return null;
    }

    return {
      rank: entry.rank,
      total: this.playerStats.size,
    };
  }

  /**
   * Update player stats
   */
  updatePlayerStats(playerId: string, stats: Partial<PlayerStats>): void {
    const existing = this.playerStats.get(playerId) || {
      playerId,
      playerName: stats.playerName || `Player${playerId}`,
      level: 1,
      tournamentWins: 0,
      achievementPoints: 0,
      pvpRating: 1000,
      guildRating: 1000,
      weeklyScore: 0,
      seasonScore: 0,
    };

    this.playerStats.set(playerId, { ...existing, ...stats });
  }

  /**
   * Get player stats
   */
  getPlayerStats(playerId: string): PlayerStats | null {
    return this.playerStats.get(playerId) || null;
  }

  /**
   * Increment stat
   */
  incrementStat(
    playerId: string,
    stat: keyof Omit<PlayerStats, 'playerId' | 'playerName'>,
    amount: number = 1,
  ): void {
    const player = this.playerStats.get(playerId);
    if (player && typeof player[stat] === 'number') {
      (player[stat] as number) += amount;
      this.playerStats.set(playerId, player);
    }
  }

  /**
   * Reset weekly scores
   */
  resetWeeklyScores(): void {
    this.playerStats.forEach((stats) => {
      stats.weeklyScore = 0;
    });
  }

  /**
   * Reset season scores
   */
  resetSeasonScores(): void {
    this.playerStats.forEach((stats) => {
      stats.seasonScore = 0;
    });
  }

  /**
   * Get top players (global)
   */
  getTopPlayers(limit: number = 10): LeaderboardEntry[] {
    const players = Array.from(this.playerStats.values());

    // Sort by combined score
    const sortedPlayers = players.sort((a, b) => {
      const scoreA =
        a.level * 10 +
        a.tournamentWins * 50 +
        a.achievementPoints +
        a.pvpRating / 10;
      const scoreB =
        b.level * 10 +
        b.tournamentWins * 50 +
        b.achievementPoints +
        b.pvpRating / 10;
      return scoreB - scoreA;
    });

    return sortedPlayers.slice(0, limit).map((player, index) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      rank: index + 1,
      score:
        player.level * 10 +
        player.tournamentWins * 50 +
        player.achievementPoints +
        player.pvpRating / 10,
      metadata: {
        level: player.level,
        tournamentWins: player.tournamentWins,
        achievementPoints: player.achievementPoints,
        pvpRating: player.pvpRating,
      },
    }));
  }

  /**
   * Get nearby players on leaderboard
   */
  getNearbyPlayers(
    playerId: string,
    category: LeaderboardCategory,
    range: number = 5,
  ): LeaderboardEntry[] {
    const rank = this.getPlayerRank(playerId, category);
    if (!rank) {
      return [];
    }

    const start = Math.max(0, rank.rank - range - 1);
    const limit = range * 2 + 1;

    return this.getLeaderboard(category, limit, start);
  }
}
