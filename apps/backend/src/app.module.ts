import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { NFTModule } from './nft/nft.module';
import { TournamentModule } from './tournament/tournament.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GameModule,
    NFTModule,
    TournamentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
