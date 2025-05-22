'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/Button';
import { useGameStore } from '@/entities/game';
import { useWalletStore } from '@/entities/wallet';
import styles from './GameLobby.module.css';

/**
 * Game lobby widget for matchmaking and game mode selection
 */
export function GameLobby() {
  const { gameMode, setGameMode } = useGameStore();
  const { activeChain, connections } = useWalletStore();
  const [isSearching, setIsSearching] = useState(false);

  const activeConnection = activeChain ? connections[activeChain] : null;

  const handleQuickMatch = () => {
    setIsSearching(true);
    // Matchmaking logic would go here
  };

  const gameModes = [
    {
      id: 'pvp',
      name: 'Player vs Player',
      description: 'Battle against other players',
      minPlayers: 2,
      maxPlayers: 10,
    },
    {
      id: 'pve',
      name: 'Player vs Environment',
      description: 'Fight against AI enemies',
      minPlayers: 1,
      maxPlayers: 4,
    },
    {
      id: 'tournament',
      name: 'Tournament',
      description: 'Compete in structured tournaments',
      minPlayers: 8,
      maxPlayers: 32,
    },
  ];

  return (
    <div className={styles.lobby}>
      <div className={styles.header}>
        <h1 className={styles.title}>Game Lobby</h1>

        {activeConnection && (
          <div className={styles.playerInfo}>
            <span className={styles.label}>Connected:</span>
            <span className={styles.address}>
              {activeConnection.address.slice(0, 6)}...
              {activeConnection.address.slice(-4)}
            </span>
          </div>
        )}
      </div>

      <div className={styles.modes}>
        {gameModes.map((mode) => (
          <div
            key={mode.id}
            className={`${styles.modeCard} ${
              gameMode === mode.id ? styles.active : ''
            }`}
            onClick={() => setGameMode(mode.id as any)}
          >
            <h3 className={styles.modeName}>{mode.name}</h3>
            <p className={styles.modeDescription}>{mode.description}</p>
            <div className={styles.modeInfo}>
              <span>
                {mode.minPlayers}-{mode.maxPlayers} players
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button
          onClick={handleQuickMatch}
          isLoading={isSearching}
          disabled={!activeConnection || isSearching}
          size="lg"
          fullWidth
        >
          {isSearching ? 'Searching for match...' : 'Quick Match'}
        </Button>
      </div>
    </div>
  );
}
