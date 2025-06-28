import { create } from 'zustand';
import { NFTAsset } from '@/shared/types/wallet';

interface NFTState {
  userNFTs: NFTAsset[];
  marketplaceNFTs: NFTAsset[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setUserNFTs: (nfts: NFTAsset[]) => void;
  setMarketplaceNFTs: (nfts: NFTAsset[]) => void;
  addUserNFT: (nft: NFTAsset) => void;
  removeUserNFT: (nftId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNFTStore = create<NFTState>((set) => ({
  userNFTs: [],
  marketplaceNFTs: [],
  isLoading: false,
  error: null,

  setUserNFTs: (nfts) => set({ userNFTs: nfts }),
  setMarketplaceNFTs: (nfts) => set({ marketplaceNFTs: nfts }),

  addUserNFT: (nft) =>
    set((state) => ({
      userNFTs: [...state.userNFTs, nft],
    })),

  removeUserNFT: (nftId) =>
    set((state) => ({
      userNFTs: state.userNFTs.filter((nft) => nft.id !== nftId),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
