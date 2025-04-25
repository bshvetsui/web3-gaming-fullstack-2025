import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { LeaderboardService, LeaderboardCategory } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get(':category')
  getLeaderboard(
    @Param('category') category: LeaderboardCategory,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.leaderboardService.getLeaderboard(
      category,
      limit || 100,
      offset || 0,
    );
  }

  @Get('top/global')
  getTopPlayers(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.leaderboardService.getTopPlayers(limit || 10);
  }

  @Get('player/:playerId/rank/:category')
  getPlayerRank(
    @Param('playerId') playerId: string,
    @Param('category') category: LeaderboardCategory,
  ) {
    const rank = this.leaderboardService.getPlayerRank(playerId, category);
    if (!rank) {
      return { error: 'Player not found' };
    }
    return rank;
  }

  @Get('player/:playerId/stats')
  getPlayerStats(@Param('playerId') playerId: string) {
    const stats = this.leaderboardService.getPlayerStats(playerId);
    if (!stats) {
      return { error: 'Player not found' };
    }
    return stats;
  }

  @Get('player/:playerId/nearby/:category')
  getNearbyPlayers(
    @Param('playerId') playerId: string,
    @Param('category') category: LeaderboardCategory,
    @Query('range', new ParseIntPipe({ optional: true })) range?: number,
  ) {
    return this.leaderboardService.getNearbyPlayers(
      playerId,
      category,
      range || 5,
    );
  }

  @Post('player/:playerId/stats')
  updatePlayerStats(
    @Param('playerId') playerId: string,
    @Body() stats: any,
  ) {
    this.leaderboardService.updatePlayerStats(playerId, stats);
    return { success: true };
  }

  @Post('player/:playerId/increment')
  incrementStat(
    @Param('playerId') playerId: string,
    @Body() body: { stat: string; amount?: number },
  ) {
    this.leaderboardService.incrementStat(playerId, body.stat as any, body.amount);
    return { success: true };
  }

  @Post('reset/weekly')
  resetWeeklyScores() {
    this.leaderboardService.resetWeeklyScores();
    return { success: true };
  }

  @Post('reset/season')
  resetSeasonScores() {
    this.leaderboardService.resetSeasonScores();
    return { success: true };
  }
}
