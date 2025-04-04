import { create } from 'zustand';
import { WalletState, WalletConnection, ChainId } from '@/shared/types/wallet';

interface WalletStore extends WalletState {
  connect: (chainId: ChainId) => Promise<void>;
  disconnect: (chainId: ChainId) => void;
  setActiveChain: (chainId: ChainId) => void;
  setConnection: (chainId: ChainId, connection: WalletConnection | null) => void;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  connections: {
    'immutable-x': null,
    'ronin': null,
    'flow': null,
    'solana': null,
  },
  activeChain: null,
  isConnecting: false,
  error: null,

  connect: async (chainId: ChainId) => {
    set({ isConnecting: true, error: null });

    try {
      // Wallet connection logic will be implemented by specific adapters
      const connection = await connectWallet(chainId);
      get().setConnection(chainId, connection);
      get().setActiveChain(chainId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnect: (chainId: ChainId) => {
    set((state) => ({
      connections: {
        ...state.connections,
        [chainId]: null,
      },
      activeChain: state.activeChain === chainId ? null : state.activeChain,
    }));
  },

  setActiveChain: (chainId: ChainId) => {
    set({ activeChain: chainId });
  },

  setConnection: (chainId: ChainId, connection: WalletConnection | null) => {
    set((state) => ({
      connections: {
        ...state.connections,
        [chainId]: connection,
      },
    }));
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

// Placeholder for actual wallet connection implementation
async function connectWallet(chainId: ChainId): Promise<WalletConnection> {
  // This will be implemented by specific wallet adapters
  throw new Error('Wallet adapter not implemented for ' + chainId);
}
