import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';

const AuctionSchema = new MongooseModule.forFeature([
  {
    name: 'Auction',
    schema: {
      tokenId: { type: String, required: true, index: true },
      seller: { type: String, required: true, index: true },
      startingPrice: { type: String, required: true },
      currentPrice: { type: String, required: true },
      highestBidder: { type: String, default: null },
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true, index: true },
      minBidIncrement: { type: String, required: true },
      buyNowPrice: { type: String, default: null },
      status: {
        type: String,
        enum: ['active', 'ended', 'cancelled'],
        default: 'active',
        index: true
      },
      bids: [{
        bidder: { type: String, required: true },
        amount: { type: String, required: true },
        timestamp: { type: Date, required: true },
        txHash: { type: String, required: true }
      }]
    }
  }
]);

@Module({
  imports: [AuctionSchema],
  controllers: [AuctionController],
  providers: [AuctionService],
  exports: [AuctionService],
})
export class AuctionModule {}