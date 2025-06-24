import { create } from 'zustand';
import { GameSession, Player } from '@/shared/types/game';

interface GameState {
  currentSession: GameSession | null;
  localPlayer: Player | null;
  isInGame: boolean;
  gameMode: 'pvp' | 'pve' | 'tournament' | null;

  // Actions
  startSession: (session: GameSession, player: Player) => void;
  endSession: () => void;
  updateSession: (updates: Partial<GameSession>) => void;
  setGameMode: (mode: 'pvp' | 'pve' | 'tournament') => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentSession: null,
  localPlayer: null,
  isInGame: false,
  gameMode: null,

  startSession: (session, player) => {
    set({
      currentSession: session,
      localPlayer: player,
      isInGame: true,
      gameMode: session.gameMode,
    });
  },

  endSession: () => {
    set({
      currentSession: null,
      isInGame: false,
    });
  },

  updateSession: (updates) => {
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, ...updates }
        : null,
    }));
  },

  setGameMode: (mode) => {
    set({ gameMode: mode });
  },
}));
