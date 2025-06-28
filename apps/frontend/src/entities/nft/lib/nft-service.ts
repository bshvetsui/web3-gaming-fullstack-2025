import { NFTAsset, ChainId } from '@/shared/types/wallet';
import axios from 'axios';
import { API_ENDPOINTS } from '@/shared/lib/constants';

/**
 * NFT service for fetching and managing NFTs across chains
 */
export class NFTService {
  /**
   * Fetch user's NFTs from a specific chain
   */
  async fetchUserNFTs(
    chainId: ChainId,
    walletAddress: string
  ): Promise<NFTAsset[]> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.BASE}/nft/user/${chainId}/${walletAddress}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw error;
    }
  }

  /**
   * Fetch NFTs listed on marketplace
   */
  async fetchMarketplaceNFTs(
    chainId?: ChainId,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      rarity?: string[];
    }
  ): Promise<NFTAsset[]> {
    try {
      const params = new URLSearchParams();

      if (chainId) params.append('chainId', chainId);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.rarity) params.append('rarity', filters.rarity.join(','));

      const response = await axios.get(
        `${API_ENDPOINTS.BASE}/nft/marketplace?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      throw error;
    }
  }

  /**
   * List an NFT on the marketplace
   */
  async listNFT(nftId: string, price: number, chainId: ChainId): Promise<void> {
    try {
      await axios.post(`${API_ENDPOINTS.BASE}/nft/list`, {
        nftId,
        price,
        chainId,
      });
    } catch (error) {
      console.error('Error listing NFT:', error);
      throw error;
    }
  }

  /**
   * Purchase an NFT from marketplace
   */
  async purchaseNFT(
    nftId: string,
    price: number,
    chainId: ChainId
  ): Promise<{ transactionHash: string }> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.BASE}/nft/purchase`, {
        nftId,
        price,
        chainId,
      });

      return response.data;
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      throw error;
    }
  }

  /**
   * Cancel NFT listing
   */
  async cancelListing(nftId: string): Promise<void> {
    try {
      await axios.post(`${API_ENDPOINTS.BASE}/nft/cancel`, { nftId });
    } catch (error) {
      console.error('Error canceling listing:', error);
      throw error;
    }
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chainId: ChainId
  ): Promise<NFTAsset> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.BASE}/nft/metadata/${chainId}/${contractAddress}/${tokenId}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      throw error;
    }
  }
}

export const nftService = new NFTService();
