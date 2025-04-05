'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from '../lib/phaser-config';
import styles from './PhaserGame.module.css';

interface PhaserGameProps {
  scenes: (typeof Phaser.Scene)[];
  onGameReady?: (game: Phaser.Game) => void;
}

/**
 * React wrapper component for Phaser game
 */
export function PhaserGame({ scenes, onGameReady }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create game config
    const config = createPhaserConfig('phaser-container');
    config.scene = scenes;

    // Initialize game
    gameRef.current = new Phaser.Game(config);

    if (onGameReady) {
      onGameReady(gameRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [scenes, onGameReady]);

  return (
    <div className={styles.container}>
      <div id="phaser-container" ref={containerRef} className={styles.gameCanvas} />
    </div>
  );
}
