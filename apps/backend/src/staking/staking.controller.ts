import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put
} from '@nestjs/common';
import { StakingService } from './staking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  @Get('pools')
  async getStakingPools() {
    return await this.stakingService.getStakingPools();
  }

  @Get('pools/:id')
  async getPoolDetails(@Param('id') poolId: string) {
    return await this.stakingService.getPoolDetails(poolId);
  }

  @Get('tvl')
  async getTotalValueLocked() {
    const tvl = await this.stakingService.getTotalValueLocked();
    return { totalValueLocked: tvl };
  }

  @Post('stake')
  @UseGuards(JwtAuthGuard)
  async stake(
    @Request() req,
    @Body() body: { poolId: string; amount: string }
  ) {
    return await this.stakingService.stake(
      req.user.id,
      body.poolId,
      body.amount
    );
  }

  @Post('unstake')
  @UseGuards(JwtAuthGuard)
  async unstake(
    @Request() req,
    @Body() body: { poolId: string; amount?: string }
  ) {
    await this.stakingService.unstake(
      req.user.id,
      body.poolId,
      body.amount
    );

    return { success: true, message: 'Unstaked successfully' };
  }

  @Post('claim-rewards')
  @UseGuards(JwtAuthGuard)
  async claimRewards(
    @Request() req,
    @Body() body: { poolId: string }
  ) {
    const rewards = await this.stakingService.claimRewards(
      req.user.id,
      body.poolId
    );

    return { rewards, message: 'Rewards claimed successfully' };
  }

  @Put('auto-compound')
  @UseGuards(JwtAuthGuard)
  async enableAutoCompound(
    @Request() req,
    @Body() body: { poolId: string }
  ) {
    await this.stakingService.enableAutoCompound(
      req.user.id,
      body.poolId
    );

    return { success: true, message: 'Auto-compound enabled' };
  }

  @Get('my-stakes')
  @UseGuards(JwtAuthGuard)
  async getUserStakes(@Request() req) {
    return await this.stakingService.getUserStakes(req.user.id);
  }

  @Get('my-tier')
  @UseGuards(JwtAuthGuard)
  async getUserTier(@Request() req) {
    const tier = await this.stakingService.getUserTier(req.user.id);
    return { tier };
  }

  @Get('user/:userId/stakes')
  async getUserStakesById(@Param('userId') userId: string) {
    return await this.stakingService.getUserStakes(userId);
  }

  @Get('user/:userId/tier')
  async getUserTierById(@Param('userId') userId: string) {
    const tier = await this.stakingService.getUserTier(userId);
    return { tier };
  }
}
