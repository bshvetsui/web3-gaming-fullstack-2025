// Shared types between frontend and backend

export interface User {
  id: string;
  address: string;
  username: string;
  email?: string;
  avatar: string;
  role: UserRole;
  createdAt: Date;
  lastActive: Date;
}

export enum UserRole {
  PLAYER = 'player',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export interface GameSession {
  id: string;
  players: string[];
  mode: string;
  map: string;
  status: GameStatus;
  startedAt: Date;
  endedAt?: Date;
  winner?: string;
}

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  icon?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: Date;
  status: TransactionStatus;
  type: TransactionType;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum TransactionType {
  TRANSFER = 'transfer',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CLAIM = 'claim',
  PURCHASE = 'purchase',
  SALE = 'sale',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  data?: any;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  GAME_INVITE = 'game_invite',
  FRIEND_REQUEST = 'friend_request',
  ACHIEVEMENT = 'achievement',
  REWARD = 'reward',
}

export interface Asset {
  id: string;
  tokenId: string;
  owner: string;
  metadata: AssetMetadata;
  rarity: AssetRarity;
  category: AssetCategory;
  price?: string;
  listed: boolean;
  createdAt: Date;
}

export interface AssetMetadata {
  name: string;
  description: string;
  image: string;
  attributes: AssetAttribute[];
  external_url?: string;
}

export interface AssetAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export enum AssetRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

export enum AssetCategory {
  CHARACTER = 'character',
  WEAPON = 'weapon',
  ARMOR = 'armor',
  CONSUMABLE = 'consumable',
  COSMETIC = 'cosmetic',
  LAND = 'land',
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  score: number;
  wins: number;
  losses: number;
  winRate: number;
  avatar?: string;
  change?: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: SeasonStatus;
  rewards: SeasonReward[];
}

export enum SeasonStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
}

export interface SeasonReward {
  tier: number;
  requiredPoints: number;
  rewards: {
    type: string;
    amount: number;
    item?: string;
  }[];
}