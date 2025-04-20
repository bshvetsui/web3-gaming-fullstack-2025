import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BattlePassService } from './battlepass.service';

@Controller('battlepass')
export class BattlePassController {
  constructor(private readonly battlePassService: BattlePassService) {}

  @Get('season/current')
  getCurrentSeason() {
    return this.battlePassService.getCurrentSeason();
  }

  @Get('progress/:playerId/:seasonId')
  getProgress(
    @Param('playerId') playerId: string,
    @Param('seasonId') seasonId: string
  ) {
    return this.battlePassService.getPlayerProgress(playerId, seasonId);
  }

  @Get('stats/:playerId/:seasonId')
  getStats(
    @Param('playerId') playerId: string,
    @Param('seasonId') seasonId: string
  ) {
    return this.battlePassService.getStats(playerId, seasonId);
  }

  @Post('purchase')
  purchasePremium(@Body() body: { playerId: string; seasonId: string }) {
    const success = this.battlePassService.purchasePremium(
      body.playerId,
      body.seasonId
    );
    return { success };
  }

  @Post('experience')
  addExperience(
    @Body() body: { playerId: string; seasonId: string; experience: number }
  ) {
    return this.battlePassService.addExperience(
      body.playerId,
      body.seasonId,
      body.experience
    );
  }

  @Post('claim')
  claimReward(
    @Body() body: { playerId: string; seasonId: string; tier: number }
  ) {
    const rewards = this.battlePassService.claimReward(
      body.playerId,
      body.seasonId,
      body.tier
    );

    if (!rewards) {
      return { success: false, message: 'Cannot claim reward' };
    }

    return { success: true, rewards };
  }

  @Post('claim-all')
  claimAllRewards(@Body() body: { playerId: string; seasonId: string }) {
    const rewards = this.battlePassService.claimAllRewards(
      body.playerId,
      body.seasonId
    );
    return { success: true, rewards };
  }

  @Get('unclaimed/:playerId/:seasonId')
  getUnclaimedRewards(
    @Param('playerId') playerId: string,
    @Param('seasonId') seasonId: string
  ) {
    return this.battlePassService.getUnclaimedRewards(playerId, seasonId);
  }
}
