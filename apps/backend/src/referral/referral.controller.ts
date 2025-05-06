import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReferralService } from './referral.service';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('generate')
  generateCode(@Body() body: { playerId: string }) {
    return this.referralService.generateReferralCode(body.playerId);
  }

  @Post('use')
  useCode(@Body() body: { code: string; playerId: string }) {
    return this.referralService.useReferralCode(body.code, body.playerId);
  }

  @Get('stats/:playerId')
  getStats(@Param('playerId') playerId: string) {
    return this.referralService.getPlayerStats(playerId);
  }

  @Get('code/:code')
  getCodeInfo(@Param('code') code: string) {
    return this.referralService.getReferralCode(code);
  }

  @Get('referrals/:playerId')
  getReferrals(@Param('playerId') playerId: string) {
    return this.referralService.getPlayerReferrals(playerId);
  }

  @Get('leaderboard')
  getTopReferrers() {
    return this.referralService.getTopReferrers(10);
  }

  @Post('deactivate')
  deactivateCode(@Body() body: { code: string }) {
    const success = this.referralService.deactivateCode(body.code);
    return { success };
  }
}
