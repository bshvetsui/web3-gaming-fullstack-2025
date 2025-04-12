import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TournamentService } from './tournament.service';

@Controller('tournament')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  /**
   * Get all tournaments
   */
  @Get()
  async getTournaments(
    @Query('status') status?: 'upcoming' | 'active' | 'completed'
  ) {
    return this.tournamentService.getTournaments(status);
  }

  /**
   * Get specific tournament
   */
  @Get(':id')
  async getTournament(@Param('id') id: string) {
    return this.tournamentService.getTournament(id);
  }

  /**
   * Create tournament
   */
  @Post('create')
  async createTournament(
    @Body()
    body: {
      name: string;
      description: string;
      entryFee: number;
      prizePool: number;
      maxPlayers: number;
      startTime: number;
      endTime: number;
    }
  ) {
    return this.tournamentService.createTournament(body);
  }

  /**
   * Join tournament
   */
  @Post(':id/join')
  async joinTournament(
    @Param('id') id: string,
    @Body() body: { username: string; walletAddress: string }
  ) {
    await this.tournamentService.joinTournament(id, body);
    return { success: true };
  }

  /**
   * Start tournament
   */
  @Post(':id/start')
  async startTournament(@Param('id') id: string) {
    await this.tournamentService.startTournament(id);
    return { success: true };
  }

  /**
   * Report match result
   */
  @Post(':tournamentId/match/:matchId/result')
  async reportMatchResult(
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Body() body: { winnerId: string; score: [number, number] }
  ) {
    await this.tournamentService.reportMatchResult(
      tournamentId,
      matchId,
      body.winnerId,
      body.score
    );
    return { success: true };
  }

  /**
   * Get leaderboard
   */
  @Get('leaderboard/:type')
  async getLeaderboard(@Param('type') type: 'daily' | 'weekly' | 'alltime') {
    return this.tournamentService.getLeaderboard(type);
  }

  /**
   * Update leaderboard
   */
  @Post('leaderboard/:type')
  async updateLeaderboard(
    @Param('type') type: 'daily' | 'weekly' | 'alltime',
    @Body()
    body: {
      playerId: string;
      username: string;
      score: number;
      wins: number;
      losses: number;
    }
  ) {
    await this.tournamentService.updateLeaderboard(type, body);
    return { success: true };
  }
}
