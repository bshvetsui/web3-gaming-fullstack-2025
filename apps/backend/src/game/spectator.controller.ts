import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SpectatorService } from './spectator.service';

@Controller('spectator')
export class SpectatorController {
  constructor(private readonly spectatorService: SpectatorService) {}

  @Post('session/create')
  createSession(
    @Body() body: { gameId: string; maxSpectators?: number; allowSpectators?: boolean },
  ) {
    return this.spectatorService.createSession(
      body.gameId,
      body.maxSpectators,
      body.allowSpectators,
    );
  }

  @Get('session/:gameId')
  getSession(@Param('gameId') gameId: string) {
    const session = this.spectatorService.getSession(gameId);
    if (!session) {
      return { error: 'Session not found' };
    }
    return session;
  }

  @Post('join')
  joinAsSpectator(
    @Body() body: { gameId: string; playerId: string; playerName: string },
  ) {
    try {
      const spectator = this.spectatorService.joinAsSpectator(
        body.gameId,
        body.playerId,
        body.playerName,
      );
      return { success: true, spectator };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('leave')
  leaveSpectator(@Body() body: { gameId: string; playerId: string }) {
    const success = this.spectatorService.leaveSpectator(body.gameId, body.playerId);
    return { success };
  }

  @Get('list/:gameId')
  getSpectators(@Param('gameId') gameId: string) {
    return this.spectatorService.getSpectators(gameId);
  }

  @Get('count/:gameId')
  getSpectatorCount(@Param('gameId') gameId: string) {
    const count = this.spectatorService.getSpectatorCount(gameId);
    return { count };
  }

  @Post('settings')
  setSettings(
    @Body()
    body: {
      gameId: string;
      maxSpectators?: number;
      allowSpectators?: boolean;
    },
  ) {
    try {
      this.spectatorService.setSpectatorSettings(body.gameId, {
        maxSpectators: body.maxSpectators,
        allowSpectators: body.allowSpectators,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Delete('session/:gameId')
  closeSession(@Param('gameId') gameId: string) {
    const success = this.spectatorService.closeSession(gameId);
    return { success };
  }

  @Get('sessions/active')
  getActiveSessions() {
    return this.spectatorService.getActiveSessions();
  }

  @Post('kick')
  kickSpectator(@Body() body: { gameId: string; spectatorId: string }) {
    const success = this.spectatorService.kickSpectator(body.gameId, body.spectatorId);
    return { success };
  }

  @Get('check/:gameId/:playerId')
  isSpectating(@Param('gameId') gameId: string, @Param('playerId') playerId: string) {
    const isSpectating = this.spectatorService.isSpectating(gameId, playerId);
    return { isSpectating };
  }
}
