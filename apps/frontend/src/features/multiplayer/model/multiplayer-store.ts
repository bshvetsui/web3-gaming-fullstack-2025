import { create } from 'zustand';
import { Room } from 'colyseus.js';

interface MultiplayerState {
  room: Room | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  playerCount: number;

  // Actions
  setRoom: (room: Room | null) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setPlayerCount: (count: number) => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  room: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  playerCount: 0,

  setRoom: (room) => set({ room }),
  setConnected: (connected) => set({ isConnected: connected }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setError: (error) => set({ error }),
  setPlayerCount: (count) => set({ playerCount: count }),
}));
