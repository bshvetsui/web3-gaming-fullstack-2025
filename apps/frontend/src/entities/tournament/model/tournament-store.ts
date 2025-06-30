import { create } from 'zustand';
import { Tournament, Leaderboard } from '@/shared/types/game';

interface TournamentState {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  leaderboards: Record<'daily' | 'weekly' | 'alltime', Leaderboard | null>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTournaments: (tournaments: Tournament[]) => void;
  setActiveTournament: (tournament: Tournament | null) => void;
  setLeaderboard: (
    type: 'daily' | 'weekly' | 'alltime',
    leaderboard: Leaderboard
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  tournaments: [],
  activeTournament: null,
  leaderboards: {
    daily: null,
    weekly: null,
    alltime: null,
  },
  isLoading: false,
  error: null,

  setTournaments: (tournaments) => set({ tournaments }),
  setActiveTournament: (tournament) => set({ activeTournament: tournament }),

  setLeaderboard: (type, leaderboard) =>
    set((state) => ({
      leaderboards: {
        ...state.leaderboards,
        [type]: leaderboard,
      },
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
