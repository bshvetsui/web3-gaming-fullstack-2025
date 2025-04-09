import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('player/:playerId')
  getPlayerAchievements(@Param('playerId') playerId: string) {
    return this.achievementsService.getPlayerAchievements(playerId);
  }

  @Get('player/:playerId/completion')
  getCompletionPercentage(@Param('playerId') playerId: string) {
    return {
      percentage: this.achievementsService.getCompletionPercentage(playerId),
    };
  }

  @Post('check')
  async checkAchievements(
    @Body()
    body: {
      playerId: string;
      stats: {
        kills?: number;
        wins?: number;
        score?: number;
        playtime?: number;
        nftCount?: number;
      };
    }
  ) {
    return this.achievementsService.checkAchievements(
      body.playerId,
      body.stats
    );
  }
}
