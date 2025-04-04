import { WalletConnection } from '@/shared/types/wallet';

/**
 * Ronin wallet adapter
 * Handles connection to Ronin Network
 */
export class RoninAdapter {
  private provider: any;

  async connect(): Promise<WalletConnection> {
    // Check if Ronin Wallet is installed
    if (typeof window === 'undefined' || !(window as any).ronin) {
      throw new Error('Ronin Wallet not found. Please install the extension.');
    }

    try {
      const roninProvider = (window as any).ronin;
      this.provider = roninProvider;

      // Request account access
      const accounts = await roninProvider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Ronin Wallet');
      }

      const address = accounts[0];

      // Get chain ID to verify we're on Ronin network
      const chainId = await roninProvider.request({
        method: 'eth_chainId',
      });

      // Ronin mainnet chain ID is 2020 (0x7E4)
      if (chainId !== '0x7e4' && chainId !== 2020) {
        throw new Error('Please switch to Ronin Network in your wallet');
      }

      return {
        address,
        chainId: 'ronin',
        provider: roninProvider,
        isConnected: true,
      };
    } catch (error) {
      console.error('Ronin connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    this.provider = null;
  }

  getProvider() {
    return this.provider;
  }

  /**
   * Listen to account changes
   */
  onAccountsChanged(callback: (accounts: string[]) => void) {
    if (this.provider) {
      this.provider.on('accountsChanged', callback);
    }
  }

  /**
   * Listen to chain changes
   */
  onChainChanged(callback: (chainId: string) => void) {
    if (this.provider) {
      this.provider.on('chainChanged', callback);
    }
  }
}

export const roninAdapter = new RoninAdapter();
