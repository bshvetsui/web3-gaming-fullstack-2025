import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { QuestsService } from './quests.service';

@Controller('quests')
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get()
  getAllQuests() {
    return this.questsService.getAvailableQuests();
  }

  @Get('daily')
  getDailyQuests() {
    return this.questsService.getAvailableQuests('daily');
  }

  @Get('player/:playerId')
  getPlayerQuests(@Param('playerId') playerId: string) {
    return this.questsService.getPlayerQuests(playerId);
  }

  @Post('assign')
  assignQuest(@Body() body: { playerId: string; questId: string }) {
    return this.questsService.assignQuest(body.playerId, body.questId);
  }

  @Post('assign-daily')
  autoAssignDaily(@Body() body: { playerId: string }) {
    return this.questsService.autoAssignDailyQuests(body.playerId);
  }

  @Post('progress')
  updateProgress(
    @Body()
    body: {
      playerId: string;
      questId: string;
      objectiveId: string;
      progress: number;
    }
  ) {
    return this.questsService.updateProgress(
      body.playerId,
      body.questId,
      body.objectiveId,
      body.progress
    );
  }

  @Post('claim')
  claimRewards(@Body() body: { playerId: string; questId: string }) {
    const rewards = this.questsService.claimRewards(
      body.playerId,
      body.questId
    );

    if (!rewards) {
      return { success: false, message: 'Cannot claim rewards' };
    }

    return { success: true, rewards };
  }
}
