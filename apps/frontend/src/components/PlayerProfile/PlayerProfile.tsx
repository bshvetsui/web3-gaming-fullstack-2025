import React from 'react';
import {
  Trophy,
  Target,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatCard } from '@/components/ui/StatCard';

export interface PlayerProfileProps {
  address: string;
  username: string;
  avatar: string;
  bio?: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    kd: number;
    accuracy: number;
    totalEarnings: number;
    rank: string;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
  recentMatches?: Array<{
    id: string;
    result: 'win' | 'loss' | 'draw';
    mode: string;
    kills: number;
    deaths: number;
  }>;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  address,
  username,
  avatar,
  bio,
  level,
  experience,
  experienceToNextLevel,
  stats,
  badges,
  recentMatches = [],
}) => {
  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-400 bg-yellow-900/20';
      case 'epic':
        return 'border-purple-400 bg-purple-900/20';
      case 'rare':
        return 'border-blue-400 bg-blue-900/20';
      default:
        return 'border-gray-400 bg-gray-900/20';
    }
  };

  const experienceProgress = (experience / experienceToNextLevel) * 100;

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={avatar}
            alt={username}
            className="w-24 h-24 rounded-full border-4 border-gray-700"
          />
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full px-2 py-1 text-white text-xs font-bold">
            LVL {level}
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{username}</h2>
          <p className="text-gray-400 text-sm font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
          {bio && <p className="text-gray-300 mt-2">{bio}</p>}
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {stats.rank}
          </div>
          <div className="text-gray-400 text-sm">Global Rank</div>
        </div>
      </div>

      {/* Experience Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Experience</span>
          <span className="text-white">{experience.toLocaleString()} / {experienceToNextLevel.toLocaleString()} XP</span>
        </div>
        <ProgressBar value={experienceProgress} className="h-3" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Win Rate"
          value={`${stats.winRate}%`}
          color="text-green-400"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="K/D Ratio"
          value={stats.kd.toFixed(2)}
          color="text-red-400"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Accuracy"
          value={`${stats.accuracy}%`}
          color="text-blue-400"
        />
        <StatCard
          icon={<Shield className="w-5 h-5" />}
          label="Total Games"
          value={stats.totalGames.toLocaleString()}
          color="text-purple-400"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
        <div>
          <div className="text-gray-400 text-sm">Wins</div>
          <div className="text-white text-xl font-semibold">{stats.wins.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Losses</div>
          <div className="text-white text-xl font-semibold">{stats.losses.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Earnings</div>
          <div className="text-yellow-400 text-xl font-semibold">{stats.totalEarnings.toLocaleString()} TOKENS</div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Badges & Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-2 rounded-lg border ${getBadgeColor(badge.rarity)} cursor-pointer hover:scale-105 transition-transform`}
                title={badge.name}
              >
                <img src={badge.icon} alt={badge.name} className="w-8 h-8" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Matches
          </h3>
          <div className="space-y-2">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className={`p-3 rounded-lg border ${
                  match.result === 'win'
                    ? 'border-green-500/30 bg-green-900/10'
                    : match.result === 'loss'
                    ? 'border-red-500/30 bg-red-900/10'
                    : 'border-gray-500/30 bg-gray-900/10'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`font-semibold ${
                      match.result === 'win' ? 'text-green-400' :
                      match.result === 'loss' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {match.result.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-sm">{match.mode}</div>
                  </div>
                  <div className="text-gray-300 text-sm">
                    {match.kills}/{match.deaths} K/D
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};