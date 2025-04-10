import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NFTService } from './nft.service';

@Controller('nft')
export class NFTController {
  constructor(private readonly nftService: NFTService) {}

  /**
   * Get user's NFTs
   */
  @Get('user/:chainId/:walletAddress')
  async getUserNFTs(
    @Param('chainId') chainId: string,
    @Param('walletAddress') walletAddress: string
  ) {
    return this.nftService.getUserNFTs(chainId, walletAddress);
  }

  /**
   * Get marketplace listings
   */
  @Get('marketplace')
  async getMarketplace(
    @Query('chainId') chainId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('rarity') rarity?: string
  ) {
    const filters: any = {};

    if (chainId) filters.chainId = chainId;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (rarity) filters.rarity = rarity.split(',');

    return this.nftService.getMarketplaceListings(filters);
  }

  /**
   * List NFT for sale
   */
  @Post('list')
  async listNFT(
    @Body()
    body: {
      nftId: string;
      tokenId: string;
      contractAddress: string;
      chainId: string;
      seller: string;
      price: number;
      currency: string;
    }
  ) {
    return this.nftService.listNFT(body);
  }

  /**
   * Purchase NFT
   */
  @Post('purchase')
  async purchaseNFT(
    @Body() body: { listingId: string; buyer: string }
  ) {
    return this.nftService.purchaseNFT(body.listingId, body.buyer);
  }

  /**
   * Cancel listing
   */
  @Post('cancel')
  async cancelListing(
    @Body() body: { listingId: string; seller: string }
  ) {
    await this.nftService.cancelListing(body.listingId, body.seller);
    return { success: true };
  }

  /**
   * Get NFT metadata
   */
  @Get('metadata/:chainId/:contractAddress/:tokenId')
  async getMetadata(
    @Param('chainId') chainId: string,
    @Param('contractAddress') contractAddress: string,
    @Param('tokenId') tokenId: string
  ) {
    return this.nftService.getNFTMetadata(chainId, contractAddress, tokenId);
  }
}
