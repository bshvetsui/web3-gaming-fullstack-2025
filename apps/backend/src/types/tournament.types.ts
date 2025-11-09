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
  status: TournamentStatus;
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  format: TournamentFormat;
  gameMode: GameMode;
  prizeDistribution: PrizeDistribution[];
  rules: TournamentRules;
  sponsors: Sponsor[];
  streamUrl?: string;
  spectators: number;
  region: string;
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  REGISTRATION = 'registration',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single-elimination',
  DOUBLE_ELIMINATION = 'double-elimination',
  ROUND_ROBIN = 'round-robin',
  SWISS = 'swiss',
}

export enum GameMode {
  SOLO = 'solo',
  DUO = 'duo',
  SQUAD = 'squad',
  TEAM_5V5 = '5v5',
}

export interface TournamentParticipant {
  id: string;
  username: string;
  walletAddress: string;
  seed: number;
  currentRound: number;
  isEliminated: boolean;
  wins: number;
  losses: number;
  points: number;
  placement?: number;
  checkedIn: boolean;
  registeredAt: number;
}

export interface TournamentBracket {
  round: number;
  matches: Match[];
  name: string;
  startTime: number;
  isComplete: boolean;
}

export interface Match {
  id: string;
  round: number;
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  score?: [number, number];
  status: MatchStatus;
  startedAt?: number;
  completedAt?: number;
  gameId?: string;
  vods?: string[];
  stats?: MatchStats;
}

export enum MatchStatus {
  PENDING = 'pending',
  LIVE = 'live',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
}

export interface MatchStats {
  duration: number;
  kills: { [playerId: string]: number };
  deaths: { [playerId: string]: number };
  assists: { [playerId: string]: number };
  damage: { [playerId: string]: number };
}

export interface PrizeDistribution {
  placement: number;
  prize: number;
  percentage: number;
}

export interface TournamentRules {
  mapPool: string[];
  banList: string[];
  timeLimit: number;
  scoreLimit: number;
  allowSpectators: boolean;
  requireCheckIn: boolean;
  checkInTime: number;
  minLevel?: number;
  maxLevel?: number;
}

export interface Sponsor {
  name: string;
  logo: string;
  contribution: number;
  website: string;
}

export interface CreateTournamentDto {
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  startTime: number;
  endTime: number;
  format: TournamentFormat;
  gameMode: GameMode;
  rules: TournamentRules;
}

export interface JoinTournamentDto {
  username: string;
  walletAddress: string;
}

export interface ReportMatchResultDto {
  matchId: string;
  winnerId: string;
  score: [number, number];
}