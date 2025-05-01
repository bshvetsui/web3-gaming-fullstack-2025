import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChainlinkService } from './chainlink.service';

@Controller('oracle')
export class ChainlinkController {
  constructor(private readonly chainlinkService: ChainlinkService) {}

  @Get('price/:pair')
  async getPrice(@Param('pair') pair: string) {
    const price = await this.chainlinkService.getLatestPrice(pair);
    return { pair, price };
  }

  @Post('random')
  async getRandomNumber(@Body() body: { seed?: number }) {
    const randomNumber = await this.chainlinkService.requestRandomNumber(
      body.seed
    );
    return { randomNumber };
  }

  @Post('random/multiple')
  async getMultipleRandomNumbers(
    @Body() body: { count: number; seed?: number }
  ) {
    const numbers = await this.chainlinkService.requestMultipleRandomNumbers(
      body.count,
      body.seed
    );
    return { numbers };
  }

  @Post('convert/usd-to-token')
  async convertUSDToToken(
    @Body() body: { usdAmount: number; tokenPair: string }
  ) {
    const tokenAmount = await this.chainlinkService.convertUSDToToken(
      body.usdAmount,
      body.tokenPair
    );
    return { tokenAmount };
  }

  @Post('loot-rarity')
  async determineLootRarity() {
    const rarity = await this.chainlinkService.determineLootRarity();
    return { rarity };
  }

  @Post('tournament-seeds')
  async generateTournamentSeeds(@Body() body: { playerCount: number }) {
    const seeds = await this.chainlinkService.generateTournamentSeeds(
      body.playerCount
    );
    return { seeds };
  }
}
