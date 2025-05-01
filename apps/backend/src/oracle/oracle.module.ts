import { Module } from '@nestjs/common';
import { ChainlinkController } from './chainlink.controller';
import { ChainlinkService } from './chainlink.service';

@Module({
  controllers: [ChainlinkController],
  providers: [ChainlinkService],
  exports: [ChainlinkService],
})
export class OracleModule {}
