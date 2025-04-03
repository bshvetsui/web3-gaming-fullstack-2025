export interface Player {
  id: string;
  username: string;
  walletAddress: string;
  avatar?: string;
  level: number;
  experience: number;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  nftId?: string;
  itemType: 'weapon' | 'armor' | 'consumable' | 'resource';
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats: Record<string, number>;
  quantity: number;
}

export interface GameSession {
  id: string;
  roomId: string;
  players: Player[];
  state: 'waiting' | 'active' | 'ended';
  gameMode: 'pvp' | 'pve' | 'tournament';
  startedAt?: number;
  endedAt?: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  currentPlayers: number;
  startTime: number;
  endTime: number;
  status: 'upcoming' | 'active' | 'completed';
  brackets: TournamentBracket[];
}

export interface TournamentBracket {
  round: number;
  matches: Match[];
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  winner?: string;
  score?: [number, number];
}

export interface Leaderboard {
  id: string;
  type: 'daily' | 'weekly' | 'alltime';
  entries: LeaderboardEntry[];
  lastUpdated: number;
}

export interface LeaderboardEntry {
  rank: number;
  player: Player;
  score: number;
  wins: number;
  losses: number;
}
