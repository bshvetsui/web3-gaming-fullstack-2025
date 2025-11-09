import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createAuction(
    @Request() req,
    @Body() body: {
      tokenId: string;
      startingPrice: string;
      duration: number;
      minBidIncrement: string;
      buyNowPrice?: string;
    }
  ) {
    if (!body.tokenId || !body.startingPrice || !body.duration || !body.minBidIncrement) {
      throw new BadRequestException('Missing required fields');
    }

    return await this.auctionService.createAuction(
      body.tokenId,
      req.user.address,
      body.startingPrice,
      body.duration,
      body.minBidIncrement,
      body.buyNowPrice
    );
  }

  @Post(':id/bid')
  @UseGuards(JwtAuthGuard)
  async placeBid(
    @Param('id') auctionId: string,
    @Request() req,
    @Body() body: { amount: string }
  ) {
    if (!body.amount) {
      throw new BadRequestException('Bid amount is required');
    }

    return await this.auctionService.placeBid(
      auctionId,
      req.user.address,
      body.amount
    );
  }

  @Post(':id/end')
  async endAuction(@Param('id') auctionId: string) {
    return await this.auctionService.endAuction(auctionId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancelAuction(
    @Param('id') auctionId: string,
    @Request() req
  ) {
    return await this.auctionService.cancelAuction(auctionId, req.user.address);
  }

  @Get('active')
  async getActiveAuctions() {
    return await this.auctionService.getActiveAuctions();
  }

  @Get('history/:tokenId')
  async getAuctionHistory(@Param('tokenId') tokenId: string) {
    return await this.auctionService.getAuctionHistory(tokenId);
  }

  @Get('user/:address')
  async getUserAuctions(@Param('address') address: string) {
    return await this.auctionService.getUserAuctions(address);
  }
}
