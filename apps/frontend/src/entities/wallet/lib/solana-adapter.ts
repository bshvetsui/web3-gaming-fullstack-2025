import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { WalletConnection } from '@/shared/types/wallet';

/**
 * Solana wallet adapter
 * Handles connection to Solana Network
 */
export class SolanaAdapter {
  private connection: Connection;
  private wallet: any;

  constructor() {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async connect(): Promise<WalletConnection> {
    // Check for Phantom wallet (most popular Solana wallet)
    if (typeof window === 'undefined') {
      throw new Error('Window is not defined');
    }

    const provider = (window as any).solana;

    if (!provider || !provider.isPhantom) {
      throw new Error('Phantom wallet not found. Please install Phantom extension.');
    }

    try {
      // Connect to wallet
      const response = await provider.connect();
      this.wallet = provider;

      const address = response.publicKey.toString();

      // Set up event listeners
      provider.on('connect', () => {
        console.log('Solana wallet connected');
      });

      provider.on('disconnect', () => {
        console.log('Solana wallet disconnected');
      });

      return {
        address,
        chainId: 'solana',
        provider,
        isConnected: true,
      };
    } catch (error) {
      console.error('Solana connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.wallet) {
      await this.wallet.disconnect();
      this.wallet = null;
    }
  }

  /**
   * Get account balance in SOL
   */
  async getBalance(publicKey: string): Promise<number> {
    const pubKey = new PublicKey(publicKey);
    const balance = await this.connection.getBalance(pubKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Send a transaction
   */
  async sendTransaction(transaction: Transaction): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const { signature } = await this.wallet.signAndSendTransaction(transaction);
    await this.connection.confirmTransaction(signature);

    return signature;
  }

  /**
   * Sign a message
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const encodedMessage = new TextEncoder().encode(JSON.stringify(message));
    const signedMessage = await this.wallet.signMessage(encodedMessage);

    return signedMessage.signature;
  }

  getConnection(): Connection {
    return this.connection;
  }

  getProvider() {
    return this.wallet;
  }
}

export const solanaAdapter = new SolanaAdapter();
