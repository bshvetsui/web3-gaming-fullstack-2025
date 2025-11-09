// Barrel export for all custom hooks

export * from './useWeb3';
export * from './useGameData';
export * from './useLocalStorage';

// Re-export commonly used hooks for convenience
export { useWeb3, useWeb3Context, Web3Provider } from './useWeb3';
export { useGameData } from './useGameData';
export { useLocalStorage } from './useLocalStorage';