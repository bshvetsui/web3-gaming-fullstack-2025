import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GuildsService } from './guilds.service';

@Controller('guilds')
export class GuildsController {
  constructor(private readonly guildsService: GuildsService) {}

  @Post('create')
  createGuild(
    @Body()
    body: {
      leaderId: string;
      name: string;
      tag: string;
      description: string;
    }
  ) {
    return this.guildsService.createGuild(
      body.leaderId,
      body.name,
      body.tag,
      body.description
    );
  }

  @Get()
  getAllGuilds() {
    return this.guildsService.getAllGuilds();
  }

  @Get(':guildId')
  getGuild(@Param('guildId') guildId: string) {
    return this.guildsService.getGuild(guildId);
  }

  @Get('player/:playerId')
  getPlayerGuild(@Param('playerId') playerId: string) {
    return this.guildsService.getPlayerGuild(playerId);
  }

  @Post('invite')
  invitePlayer(
    @Body() body: { guildId: string; playerId: string; inviterId: string }
  ) {
    const success = this.guildsService.invitePlayer(
      body.guildId,
      body.playerId,
      body.inviterId
    );
    return { success };
  }

  @Post('accept')
  acceptInvitation(@Body() body: { playerId: string; guildId: string }) {
    const success = this.guildsService.acceptInvitation(
      body.playerId,
      body.guildId
    );
    return { success };
  }

  @Post('leave')
  leaveGuild(@Body() body: { playerId: string }) {
    const success = this.guildsService.leaveGuild(body.playerId);
    return { success };
  }

  @Post('kick')
  kickMember(
    @Body() body: { guildId: string; playerId: string; kickerId: string }
  ) {
    const success = this.guildsService.kickMember(
      body.guildId,
      body.playerId,
      body.kickerId
    );
    return { success };
  }

  @Post('promote')
  promoteMember(
    @Body() body: { guildId: string; playerId: string; promoterId: string }
  ) {
    const success = this.guildsService.promoteMember(
      body.guildId,
      body.playerId,
      body.promoterId
    );
    return { success };
  }

  @Post('contribute')
  contribute(@Body() body: { playerId: string; amount: number }) {
    const success = this.guildsService.contribute(body.playerId, body.amount);
    return { success };
  }

  @Post('experience')
  addExperience(@Body() body: { guildId: string; experience: number }) {
    this.guildsService.addExperience(body.guildId, body.experience);
    return { success: true };
  }

  @Get('leaderboard/top')
  getLeaderboard() {
    return this.guildsService.getLeaderboard(10);
  }
}
