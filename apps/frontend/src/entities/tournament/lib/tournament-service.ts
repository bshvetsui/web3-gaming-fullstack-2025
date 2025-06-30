import axios from 'axios';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import { Tournament } from '@/shared/types/game';

/**
 * Tournament service for managing tournaments and leaderboards
 */
export class TournamentService {
  /**
   * Fetch all tournaments
   */
  async getTournaments(status?: 'upcoming' | 'active' | 'completed'): Promise<Tournament[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await axios.get(`${API_ENDPOINTS.BASE}/tournament${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  }

  /**
   * Get specific tournament
   */
  async getTournament(id: string): Promise<Tournament> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.BASE}/tournament/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      throw error;
    }
  }

  /**
   * Join a tournament
   */
  async joinTournament(
    tournamentId: string,
    username: string,
    walletAddress: string
  ): Promise<void> {
    try {
      await axios.post(`${API_ENDPOINTS.BASE}/tournament/${tournamentId}/join`, {
        username,
        walletAddress,
      });
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type: 'daily' | 'weekly' | 'alltime') {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.BASE}/tournament/leaderboard/${type}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
}

export const tournamentService = new TournamentService();
