import React from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Star,
  Crown
} from 'lucide-react';

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  playerId: string;
  username: string;
  avatar: string;
  score: number;
  wins: number;
  losses: number;
  winRate: number;
  rating: number;
  change?: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  onPlayerClick?: (playerId: string) => void;
  loading?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  timeframe = 'all-time',
  onPlayerClick,
  loading = false,
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="text-gray-400 font-mono">#{rank}</span>;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;

    const change = previous - current;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs">+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-400">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs">{change}</span>
        </div>
      );
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getRatingChange = (change?: number) => {
    if (!change) return null;

    const color = change > 0 ? 'text-green-400' : 'text-red-400';
    const prefix = change > 0 ? '+' : '';

    return (
      <span className={`text-sm ${color}`}>
        {prefix}{change}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Rank</th>
            <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Player</th>
            <th className="text-center py-3 px-4 text-gray-400 text-sm font-medium">Rating</th>
            <th className="text-center py-3 px-4 text-gray-400 text-sm font-medium">W/L</th>
            <th className="text-center py-3 px-4 text-gray-400 text-sm font-medium">Win Rate</th>
            <th className="text-center py-3 px-4 text-gray-400 text-sm font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.playerId}
              className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                entry.isCurrentUser ? 'bg-blue-900/20' : ''
              }`}
              onClick={() => onPlayerClick?.(entry.playerId)}
            >
              {/* Rank Column */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  {entry.previousRank && getRankChange(entry.rank, entry.previousRank)}
                </div>
              </td>

              {/* Player Column */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <img
                    src={entry.avatar}
                    alt={entry.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="text-white font-medium flex items-center gap-2">
                      {entry.username}
                      {entry.isCurrentUser && (
                        <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">YOU</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs font-mono">
                      {entry.playerId.slice(0, 6)}...{entry.playerId.slice(-4)}
                    </div>
                  </div>
                </div>
              </td>

              {/* Rating Column */}
              <td className="py-3 px-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="text-white font-semibold">{entry.rating}</div>
                  {getRatingChange(entry.change)}
                </div>
              </td>

              {/* W/L Column */}
              <td className="py-3 px-4 text-center">
                <div className="text-white">
                  <span className="text-green-400">{entry.wins}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-red-400">{entry.losses}</span>
                </div>
              </td>

              {/* Win Rate Column */}
              <td className="py-3 px-4 text-center">
                <div className={`font-semibold ${
                  entry.winRate >= 60 ? 'text-green-400' :
                  entry.winRate >= 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {entry.winRate.toFixed(1)}%
                </div>
              </td>

              {/* Score Column */}
              <td className="py-3 px-4 text-center">
                <div className="text-white font-semibold">
                  {entry.score.toLocaleString()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {entries.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No players found for this timeframe
        </div>
      )}
    </div>
  );
};