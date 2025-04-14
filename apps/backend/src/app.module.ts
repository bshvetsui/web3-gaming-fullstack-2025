import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { NFTModule } from './nft/nft.module';
import { TournamentModule } from './tournament/tournament.module';
import { AchievementsModule } from './achievements/achievements.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GameModule,
    NFTModule,
    TournamentModule,
    AchievementsModule,
    InventoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
