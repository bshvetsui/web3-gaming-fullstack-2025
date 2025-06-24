'use client';

import { useEffect, useRef } from 'react';
import { ThreeGameSetup } from '../lib/three-setup';
import styles from './ThreeGame.module.css';

interface ThreeGameProps {
  onSetupReady?: (setup: ThreeGameSetup) => void;
  enableControls?: boolean;
  backgroundColor?: number;
  cameraPosition?: [number, number, number];
}

/**
 * React wrapper component for Three.js game
 */
export function ThreeGame({
  onSetupReady,
  enableControls = true,
  backgroundColor = 0x1a1a2e,
  cameraPosition,
}: ThreeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef<ThreeGameSetup | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js setup
    const setup = new ThreeGameSetup(containerRef.current, {
      enableControls,
      backgroundColor,
      cameraPosition,
    });

    setupRef.current = setup;

    // Start animation loop
    setup.start();

    // Notify parent component
    if (onSetupReady) {
      onSetupReady(setup);
    }

    // Cleanup on unmount
    return () => {
      setup.dispose();
      setupRef.current = null;
    };
  }, [enableControls, backgroundColor, cameraPosition, onSetupReady]);

  return (
    <div className={styles.container} ref={containerRef} />
  );
}
