import { config, passport } from '@imtbl/sdk';
import { WalletConnection } from '@/shared/types/wallet';

/**
 * Immutable X wallet adapter
 * Handles connection to Immutable X using Passport
 */
export class ImmutableAdapter {
  private passportInstance: any;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    const passportConfig = {
      baseConfig: {
        environment: config.Environment.PRODUCTION,
      },
      clientId: process.env.NEXT_PUBLIC_IMMUTABLE_CLIENT_ID || '',
      redirectUri: process.env.NEXT_PUBLIC_IMMUTABLE_REDIRECT_URI || 'http://localhost:3000/callback',
      logoutRedirectUri: process.env.NEXT_PUBLIC_IMMUTABLE_LOGOUT_URI || 'http://localhost:3000',
      audience: 'platform_api',
      scope: 'openid profile email transact',
    };

    this.passportInstance = new passport.Passport(passportConfig);
    this.isInitialized = true;
  }

  async connect(): Promise<WalletConnection> {
    await this.initialize();

    try {
      const provider = this.passportInstance.connectEvm();
      const accounts = await provider.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const userProfile = await this.passportInstance.getUserInfo();

      return {
        address,
        chainId: 'immutable-x',
        provider,
        isConnected: true,
      };
    } catch (error) {
      console.error('Immutable X connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.passportInstance) {
      await this.passportInstance.logout();
    }
  }

  getProvider() {
    return this.passportInstance?.connectEvm();
  }
}

export const immutableAdapter = new ImmutableAdapter();
