export interface Player {
  id: string;
  username: string;
  rating: number;
  level: number;
  wins: number;
  losses: number;
  winRate: number;
  preferredMode: string;
  region: string;
  latency: number;
  partyId?: string;
  guildId?: string;
  premiumTier: number;
}

export interface MatchmakingQueue {
  id: string;
  mode: GameMode;
  players: QueuedPlayer[];
  maxPlayers: number;
  minPlayers: number;
  averageWaitTime: number;
  estimatedWaitTime: Map<string, number>;
  priorityQueue: QueuedPlayer[];
  normalQueue: QueuedPlayer[];
}

export interface QueuedPlayer extends Player {
  queueTime: Date;
  priority: number;
  acceptableRatingRange: { min: number; max: number };
  searchExpansionRate: number;
  attemptedMatches: string[];
  declined: number;
}

export interface GameMode {
  id: string;
  name: string;
  teamSize: number;
  maxPlayers: number;
  minPlayers: number;
  ranked: boolean;
  ratingEnabled: boolean;
  requirements: GameModeRequirements;
  mapPool: string[];
  timeLimit: number;
  respawns: boolean;
}

export interface GameModeRequirements {
  minLevel: number;
  minRating?: number;
  maxRating?: number;
}

export interface Match {
  id: string;
  mode: string;
  status: MatchStatus;
  teams: Team[];
  map: string;
  server: GameServer;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  averageRating: number;
  ratingSpread: number;
  fairnessScore: number;
}

export enum MatchStatus {
  PENDING = 'pending',
  READY = 'ready',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Team {
  id: string;
  players: Player[];
  averageRating: number;
  totalRating: number;
  side: TeamSide;
}

export enum TeamSide {
  TEAM1 = 'team1',
  TEAM2 = 'team2',
}

export interface GameServer {
  id: string;
  name: string;
  region: string;
  ip: string;
  port: number;
  currentPlayers: number;
  maxPlayers: number;
  status: ServerStatus;
  latency: Map<string, number>;
  load: number;
}

export enum ServerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

export interface MatchmakingSettings {
  maxRatingDifference: number;
  expansionRate: number;
  maxWaitTime: number;
  partyBonus: number;
  guildBonus: number;
  premiumPriorityMultiplier: number;
  balanceThreshold: number;
  regionLock: boolean;
  crossPlayEnabled: boolean;
}