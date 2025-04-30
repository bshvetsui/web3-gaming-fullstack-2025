import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { SpectatorController } from './spectator.controller';
import { SpectatorService } from './spectator.service';

@Module({
  controllers: [SpectatorController],
  providers: [GameGateway, SpectatorService],
  exports: [GameGateway, SpectatorService],
})
export class GameModule {}
