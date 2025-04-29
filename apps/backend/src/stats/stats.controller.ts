import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { StatsService, StatUpdate, MatchResult } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('player/:playerId')
  getPlayerStats(@Param('playerId') playerId: string) {
    return this.statsService.getPlayerStats(playerId);
  }

  @Get('player/:playerId/summary')
  getPlayerSummary(@Param('playerId') playerId: string) {
    return this.statsService.getPlayerSummary(playerId);
  }

  @Get('player/:playerId/category/:category')
  getCategoryStats(
    @Param('playerId') playerId: string,
    @Param('category') category: string,
  ) {
    return this.statsService.getCategoryStats(playerId, category as any);
  }

  @Get('compare')
  comparePlayers(
    @Query('player1') player1: string,
    @Query('player2') player2: string,
  ) {
    return this.statsService.comparePlayers(player1, player2);
  }

  @Get('all')
  getAllPlayerStats() {
    return this.statsService.getAllPlayerStats();
  }

  @Post('update')
  updateStat(@Body() update: StatUpdate) {
    this.statsService.updateStat(update);
    return { success: true };
  }

  @Post('match/record')
  recordMatchResult(@Body() result: MatchResult) {
    this.statsService.recordMatchResult(result);
    return { success: true };
  }

  @Post('player/:playerId/reset')
  resetPlayerStats(@Param('playerId') playerId: string) {
    this.statsService.resetPlayerStats(playerId);
    return { success: true };
  }

  @Delete('player/:playerId')
  deletePlayerStats(@Param('playerId') playerId: string) {
    const success = this.statsService.deletePlayerStats(playerId);
    return { success };
  }
}
