import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { NFTModule } from './nft/nft.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GameModule,
    NFTModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
