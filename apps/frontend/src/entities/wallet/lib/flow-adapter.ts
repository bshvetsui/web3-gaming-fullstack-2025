import * as fcl from '@onflow/fcl';
import { WalletConnection } from '@/shared/types/wallet';

type FlowArgsBuilder = (
  arg: typeof fcl.arg,
  t: typeof fcl.t
) => ReturnType<typeof fcl.arg>[];

/**
 * Flow blockchain adapter
 * Handles connection to Flow Network using FCL (Flow Client Library)
 */
export class FlowAdapter {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Configure FCL
    fcl.config({
      'accessNode.api': process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-mainnet.onflow.org',
      'discovery.wallet': process.env.NEXT_PUBLIC_FLOW_DISCOVERY || 'https://fcl-discovery.onflow.org/authn',
      'app.detail.title': 'Web3 Gaming Platform',
      'app.detail.icon': 'https://placekitten.com/g/200/200',
    });

    this.isInitialized = true;
  }

  async connect(): Promise<WalletConnection> {
    await this.initialize();

    try {
      // Authenticate user
      const user = await fcl.authenticate();

      // Wait for current user to be set
      const currentUser = await fcl.currentUser.snapshot();

      if (!currentUser.addr) {
        throw new Error('Failed to get Flow address');
      }

      return {
        address: currentUser.addr,
        chainId: 'flow',
        provider: fcl,
        isConnected: true,
      };
    } catch (error) {
      console.error('Flow connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    await fcl.unauthenticate();
  }

  /**
   * Subscribe to current user changes
   */
  onUserChanged(callback: (user: any) => void) {
    fcl.currentUser.subscribe(callback);
  }

  /**
   * Execute a Flow script
   */
  async executeScript(code: string, args?: FlowArgsBuilder) {
    return await fcl.query({
      cadence: code,
      args: args || (() => []),
    });
  }

  /**
   * Send a Flow transaction
   */
  async sendTransaction(code: string, args?: FlowArgsBuilder) {
    const transactionId = await fcl.mutate({
      cadence: code,
      args: args || (() => []),
      limit: 999,
    });

    // Wait for transaction to be sealed
    const transaction = await fcl.tx(transactionId).onceSealed();
    return transaction;
  }

  getProvider() {
    return fcl;
  }
}

export const flowAdapter = new FlowAdapter();
