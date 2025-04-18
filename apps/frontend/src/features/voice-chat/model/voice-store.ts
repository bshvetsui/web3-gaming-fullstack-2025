import { create } from 'zustand';

interface VoiceChatState {
  isInitialized: boolean;
  isConnected: boolean;
  isMuted: boolean;
  activePeers: Set<string>;
  error: string | null;

  // Actions
  setInitialized: (initialized: boolean) => void;
  setConnected: (connected: boolean) => void;
  setMuted: (muted: boolean) => void;
  addPeer: (peerId: string) => void;
  removePeer: (peerId: string) => void;
  setError: (error: string | null) => void;
}

export const useVoiceStore = create<VoiceChatState>((set) => ({
  isInitialized: false,
  isConnected: false,
  isMuted: false,
  activePeers: new Set(),
  error: null,

  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setConnected: (connected) => set({ isConnected: connected }),
  setMuted: (muted) => set({ isMuted: muted }),

  addPeer: (peerId) =>
    set((state) => ({
      activePeers: new Set([...state.activePeers, peerId]),
    })),

  removePeer: (peerId) =>
    set((state) => {
      const newPeers = new Set(state.activePeers);
      newPeers.delete(peerId);
      return { activePeers: newPeers };
    }),

  setError: (error) => set({ error }),
}));
