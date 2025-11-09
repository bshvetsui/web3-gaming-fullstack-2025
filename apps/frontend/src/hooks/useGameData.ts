import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, GameSession } from '@web3-gaming/shared-types';

export interface UseGameDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useGameData(gameId?: string, options: UseGameDataOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [data, setData] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameData = useCallback(async () => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/games/${gameId}`);
      const result: ApiResponse<GameSession> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch game data');
      }

      setData(result.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGameData();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchGameData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchGameData, autoRefresh, refreshInterval]);

  const refresh = useCallback(() => {
    return fetchGameData();
  }, [fetchGameData]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}