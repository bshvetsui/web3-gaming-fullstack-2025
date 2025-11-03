import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Auction {
  id: string;
  tokenId: string;
  seller: string;
  startingPrice: string;
  currentPrice: string;
  highestBidder: string;
  startTime: Date;
  endTime: Date;
  minBidIncrement: string;
  buyNowPrice?: string;
  status: 'active' | 'ended' | 'cancelled';
  bids: Bid[];
}

export interface Bid {
  bidder: string;
  amount: string;
  timestamp: Date;
  txHash: string;
}

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel('Auction') private auctionModel: Model<Auction>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createAuction(
    tokenId: string,
    seller: string,
    startingPrice: string,
    duration: number,
    minBidIncrement: string,
    buyNowPrice?: string,
  ): Promise<Auction> {
    const auction = new this.auctionModel({
      tokenId,
      seller,
      startingPrice,
      currentPrice: startingPrice,
      highestBidder: null,
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 1000),
      minBidIncrement,
      buyNowPrice,
      status: 'active',
      bids: [],
    });

    await auction.save();

    this.eventEmitter.emit('auction.created', {
      auctionId: auction.id,
      tokenId,
      seller,
    });

    return auction;
  }

  async placeBid(auctionId: string, bidder: string, amount: string): Promise<Auction> {
    const auction = await this.auctionModel.findById(auctionId);

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== 'active') {
      throw new BadRequestException('Auction is not active');
    }

    if (new Date() > auction.endTime) {
      await this.endAuction(auctionId);
      throw new BadRequestException('Auction has ended');
    }

    const bidAmount = ethers.parseEther(amount);
    const currentPrice = ethers.parseEther(auction.currentPrice);
    const minIncrement = ethers.parseEther(auction.minBidIncrement);

    if (bidAmount < currentPrice + minIncrement) {
      throw new BadRequestException(
        `Bid must be at least ${ethers.formatEther(currentPrice + minIncrement)} ETH`
      );
    }

    // Handle buy now
    if (auction.buyNowPrice && bidAmount >= ethers.parseEther(auction.buyNowPrice)) {
      auction.currentPrice = auction.buyNowPrice;
      auction.highestBidder = bidder;
      auction.status = 'ended';

      const bid: Bid = {
        bidder,
        amount: auction.buyNowPrice,
        timestamp: new Date(),
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
      };

      auction.bids.push(bid);
      await auction.save();

      this.eventEmitter.emit('auction.buynow', {
        auctionId,
        buyer: bidder,
        price: auction.buyNowPrice,
      });

      return auction;
    }

    // Regular bid
    const bid: Bid = {
      bidder,
      amount,
      timestamp: new Date(),
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
    };

    auction.bids.push(bid);
    auction.currentPrice = amount;
    auction.highestBidder = bidder;

    // Extend auction if bid is placed in last 5 minutes
    const timeRemaining = auction.endTime.getTime() - Date.now();
    if (timeRemaining < 5 * 60 * 1000) {
      auction.endTime = new Date(Date.now() + 5 * 60 * 1000);
    }

    await auction.save();

    this.eventEmitter.emit('auction.bid', {
      auctionId,
      bidder,
      amount,
    });

    return auction;
  }

  async endAuction(auctionId: string): Promise<Auction> {
    const auction = await this.auctionModel.findById(auctionId);

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== 'active') {
      return auction;
    }

    auction.status = 'ended';
    await auction.save();

    if (auction.highestBidder) {
      this.eventEmitter.emit('auction.won', {
        auctionId,
        winner: auction.highestBidder,
        price: auction.currentPrice,
        tokenId: auction.tokenId,
      });
    } else {
      this.eventEmitter.emit('auction.ended.nobids', {
        auctionId,
        tokenId: auction.tokenId,
      });
    }

    return auction;
  }

  async cancelAuction(auctionId: string, requesterId: string): Promise<Auction> {
    const auction = await this.auctionModel.findById(auctionId);

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.seller !== requesterId) {
      throw new BadRequestException('Only seller can cancel auction');
    }

    if (auction.bids.length > 0) {
      throw new BadRequestException('Cannot cancel auction with existing bids');
    }

    auction.status = 'cancelled';
    await auction.save();

    this.eventEmitter.emit('auction.cancelled', {
      auctionId,
      tokenId: auction.tokenId,
    });

    return auction;
  }

  async getActiveAuctions(): Promise<Auction[]> {
    const now = new Date();
    const auctions = await this.auctionModel.find({
      status: 'active',
      endTime: { $gt: now },
    }).sort({ endTime: 1 });

    return auctions;
  }

  async getAuctionHistory(tokenId: string): Promise<Auction[]> {
    return await this.auctionModel.find({ tokenId }).sort({ endTime: -1 });
  }

  async getUserAuctions(address: string): Promise<{
    selling: Auction[];
    bidding: Auction[];
    won: Auction[];
  }> {
    const selling = await this.auctionModel.find({
      seller: address,
      status: 'active'
    });

    const bidding = await this.auctionModel.find({
      'bids.bidder': address,
      status: 'active',
    });

    const won = await this.auctionModel.find({
      highestBidder: address,
      status: 'ended',
    });

    return { selling, bidding, won };
  }
}