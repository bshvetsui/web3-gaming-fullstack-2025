import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createProfile(
    @Request() req,
    @Body() body: { username: string }
  ) {
    return await this.profileService.createProfile(
      req.user.address,
      body.username
    );
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() updates: any
  ) {
    return await this.profileService.updateProfile(
      req.user.address,
      updates
    );
  }

  @Post('game-stats')
  @UseGuards(JwtAuthGuard)
  async updateGameStats(
    @Request() req,
    @Body() gameResult: {
      won: boolean;
      kills: number;
      deaths: number;
      assists: number;
      damage: number;
      healing: number;
      duration: number;
      mvp: boolean;
    }
  ) {
    return await this.profileService.updateGameStats(
      req.user.address,
      gameResult
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req) {
    return await this.profileService.getProfile(req.user.address);
  }

  @Get('top/:criteria')
  async getTopPlayers(
    @Param('criteria') criteria: 'level' | 'wins' | 'reputation' | 'earnings',
    @Query('limit') limit: string = '100'
  ) {
    return await this.profileService.getTopPlayers(
      criteria,
      parseInt(limit)
    );
  }

  @Get('search')
  async searchProfiles(@Query('q') query: string) {
    return await this.profileService.searchProfiles(query);
  }

  @Get(':address')
  async getProfile(@Param('address') address: string) {
    return await this.profileService.getProfile(address);
  }
}