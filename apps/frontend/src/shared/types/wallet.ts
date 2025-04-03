export type ChainId = 'immutable-x' | 'ronin' | 'flow' | 'solana';

export interface WalletConnection {
  address: string;
  chainId: ChainId;
  provider: any;
  isConnected: boolean;
}

export interface WalletState {
  connections: Record<ChainId, WalletConnection | null>;
  activeChain: ChainId | null;
  isConnecting: boolean;
  error: string | null;
}

export interface NFTAsset {
  id: string;
  tokenId: string;
  contractAddress: string;
  chainId: ChainId;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Record<string, any>;
  owner: string;
}
