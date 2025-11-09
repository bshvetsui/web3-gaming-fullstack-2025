import { Injectable } from '@nestjs/common';

export interface NFTListing {
  id: string;
  nftId: string;
  tokenId: string;
  contractAddress: string;
  chainId: string;
  seller: string;
  price: number;
  currency: string;
  status: 'active' | 'sold' | 'cancelled';
  listedAt: Date;
}

@Injectable()
export class NFTService {
  private listings: Map<string, NFTListing> = new Map();
  private metadataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired cache entries every hour
    this.cleanupInterval = setInterval(() => this.cleanupCache(), 3600000);
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.metadataCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.metadataCache.delete(key);
      }
    }
  }

  /**
   * Get user's NFTs from blockchain
   */
  async getUserNFTs(chainId: string, walletAddress: string) {
    // In production, this would fetch from blockchain via RPC
    // For now, return mock data

    return [
      {
        id: `${chainId}-1`,
        tokenId: '1',
        contractAddress: '0x...',
        chainId,
        name: 'Legendary Sword',
        description: 'A powerful weapon forged in dragon fire',
        imageUrl: 'https://placeholder.com/sword.png',
        attributes: {
          rarity: 'legendary',
          attack: 150,
          durability: 100,
        },
        owner: walletAddress,
      },
    ];
  }

  /**
   * Get marketplace listings
   */
  async getMarketplaceListings(filters?: {
    chainId?: string;
    minPrice?: number;
    maxPrice?: number;
    rarity?: string[];
  }) {
    let listings = Array.from(this.listings.values()).filter(
      (listing) => listing.status === 'active'
    );

    // Apply filters
    if (filters?.chainId) {
      listings = listings.filter((l) => l.chainId === filters.chainId);
    }

    if (filters?.minPrice !== undefined) {
      listings = listings.filter((l) => l.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      listings = listings.filter((l) => l.price <= filters.maxPrice!);
    }

    return listings;
  }

  /**
   * List an NFT for sale
   */
  async listNFT(data: {
    nftId: string;
    tokenId: string;
    contractAddress: string;
    chainId: string;
    seller: string;
    price: number;
    currency: string;
  }): Promise<NFTListing> {
    const listing: NFTListing = {
      id: `listing-${Date.now()}`,
      ...data,
      status: 'active',
      listedAt: new Date(),
    };

    this.listings.set(listing.id, listing);

    return listing;
  }

  /**
   * Purchase an NFT
   */
  async purchaseNFT(
    listingId: string,
    _buyer: string
  ): Promise<{ transactionHash: string }> {
    const listing = this.listings.get(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is not active');
    }

    // In production, this would execute blockchain transaction
    // For now, just mark as sold

    listing.status = 'sold';
    this.listings.set(listingId, listing);

    return {
      transactionHash: `0x${Math.random().toString(16).substring(2)}`,
    };
  }

  /**
   * Cancel a listing
   */
  async cancelListing(listingId: string, seller: string): Promise<void> {
    const listing = this.listings.get(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.seller !== seller) {
      throw new Error('Only seller can cancel listing');
    }

    listing.status = 'cancelled';
    this.listings.set(listingId, listing);
  }

  /**
   * Get NFT metadata from blockchain with caching
   */
  async getNFTMetadata(
    chainId: string,
    contractAddress: string,
    tokenId: string
  ) {
    const cacheKey = `${chainId}:${contractAddress}:${tokenId}`;

    // Check cache first
    const cached = this.metadataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // In production, fetch from blockchain or IPFS
    // Return mock data for now
    const metadata = {
      id: `${chainId}-${tokenId}`,
      tokenId,
      contractAddress,
      chainId,
      name: `NFT #${tokenId}`,
      description: 'A unique digital asset',
      imageUrl: 'https://placeholder.com/nft.png',
      attributes: {},
      owner: '0x0000000000000000000000000000000000000000',
    };

    // Cache the result
    this.metadataCache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now(),
    });

    return metadata;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    this.metadataCache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.metadataCache.delete(key);
      }
    });
  }
}
