import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { NFTModule } from './nft/nft.module';
import { TournamentModule } from './tournament/tournament.module';
import { AchievementsModule } from './achievements/achievements.module';
import { InventoryModule } from './inventory/inventory.module';
import { QuestsModule } from './quests/quests.module';
import { OracleModule } from './oracle/oracle.module';
import { ReferralModule } from './referral/referral.module';
import { GuildsModule } from './guilds/guilds.module';
import { BattlePassModule } from './battlepass/battlepass.module';
import { SocialModule } from './social/social.module';
import { ShopModule } from './shop/shop.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { StatsModule } from './stats/stats.module';

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
    QuestsModule,
    OracleModule,
    ReferralModule,
    GuildsModule,
    BattlePassModule,
    SocialModule,
    ShopModule,
    LeaderboardModule,
    StatsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
