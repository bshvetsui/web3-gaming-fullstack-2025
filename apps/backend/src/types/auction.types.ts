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
  status: AuctionStatus;
  bids: Bid[];
}

export enum AuctionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export interface Bid {
  bidder: string;
  amount: string;
  timestamp: Date;
  txHash: string;
}

export interface CreateAuctionDto {
  tokenId: string;
  startingPrice: string;
  duration: number;
  minBidIncrement: string;
  buyNowPrice?: string;
}

export interface PlaceBidDto {
  amount: string;
}

export interface AuctionFilters {
  status?: AuctionStatus;
  seller?: string;
  tokenId?: string;
  minPrice?: string;
  maxPrice?: string;
}