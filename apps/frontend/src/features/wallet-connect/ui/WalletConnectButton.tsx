'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { useWalletStore } from '@/entities/wallet';
import { ChainId } from '@/shared/types/wallet';
import { truncateAddress } from '@/shared/lib/utils';
import { immutableAdapter, roninAdapter, flowAdapter, solanaAdapter } from '@/entities/wallet';
import styles from './WalletConnectButton.module.css';

interface WalletConnectButtonProps {
  chainId: ChainId;
}

export function WalletConnectButton({ chainId }: WalletConnectButtonProps) {
  const { connections, activeChain, isConnecting, setConnection, setActiveChain } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);

  const connection = connections[chainId];
  const isConnected = connection?.isConnected || false;

  const getAdapter = (chain: ChainId) => {
    switch (chain) {
      case 'immutable-x':
        return immutableAdapter;
      case 'ronin':
        return roninAdapter;
      case 'flow':
        return flowAdapter;
      case 'solana':
        return solanaAdapter;
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);

    try {
      const adapter = getAdapter(chainId);
      const walletConnection = await adapter.connect();

      setConnection(chainId, walletConnection);
      setActiveChain(chainId);
    } catch (error) {
      console.error(`Failed to connect to ${chainId}:`, error);
      alert(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const adapter = getAdapter(chainId);
    await adapter.disconnect();

    setConnection(chainId, null);
  };

  const getChainName = (chain: ChainId): string => {
    const names: Record<ChainId, string> = {
      'immutable-x': 'Immutable X',
      'ronin': 'Ronin',
      'flow': 'Flow',
      'solana': 'Solana',
    };
    return names[chain];
  };

  if (isConnected && connection) {
    return (
      <div className={styles.connectedContainer}>
        <div className={styles.addressDisplay}>
          <span className={styles.chainBadge}>{getChainName(chainId)}</span>
          <span className={styles.address}>{truncateAddress(connection.address)}</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      isLoading={isLoading || isConnecting}
      disabled={isLoading || isConnecting}
      variant={activeChain === chainId ? 'primary' : 'outline'}
    >
      Connect {getChainName(chainId)}
    </Button>
  );
}
