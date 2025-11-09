import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ethers } from 'ethers';

export interface Web3State {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

export interface Web3Actions {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

const initialState: Web3State = {
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  balance: null,
  isConnecting: false,
  isConnected: false,
  error: null,
};

export function useWeb3() {
  const [state, setState] = useState<Web3State>(initialState);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'Wallet not found. Please install MetaMask.',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = accounts[0];
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      setState({
        provider,
        signer,
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        isConnecting: false,
        isConnected: true,
        error: null,
      });

      // Setup event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } catch (err) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.removeAllListeners();
    }
    setState(initialState);
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    if (!window.ethereum) {
      throw new Error('Wallet not found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        throw new Error('Please add this network to your wallet');
      }
      throw error;
    }
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.signer) {
      throw new Error('Wallet not connected');
    }

    return await state.signer.signMessage(message);
  }, [state.signer]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setState(prev => ({ ...prev, address: accounts[0] }));
    }
  }, [disconnect]);

  const handleChainChanged = useCallback((chainId: string) => {
    setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
  }, []);

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();

          if (accounts.length > 0) {
            connect();
          }
        } catch (err) {
          console.error('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
  };
}

// Context Provider for global state
const Web3Context = createContext<(Web3State & Web3Actions) | null>(null);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const web3 = useWeb3();
  return <Web3Context.Provider value={web3}>{children}</Web3Context.Provider>;
};

export const useWeb3Context = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3Context must be used within Web3Provider');
  }
  return context;
};