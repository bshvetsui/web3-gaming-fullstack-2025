export interface PlayerProfile {
  address: string;
  username: string;
  avatar: string;
  bio: string;
  level: number;
  experience: number;
  totalGamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestWinStreak: number;
  totalEarnings: string;
  favoriteGame: string;
  joinedAt: Date;
  lastActive: Date;
  achievements: string[];
  badges: Badge[];
  stats: GameStats;
  social: SocialLinks;
  preferences: PlayerPreferences;
  reputation: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  earnedAt: Date;
}

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface GameStats {
  killDeathRatio: number;
  accuracy: number;
  avgGameDuration: number;
  totalPlayTime: number;
  favoriteWeapon: string;
  headshots: number;
  criticalHits: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  objectivesCaptured: number;
  mvpCount: number;
}

export interface SocialLinks {
  twitter: string;
  discord: string;
  telegram: string;
  website: string;
}

export interface PlayerPreferences {
  displayBadges: boolean;
  showStats: boolean;
  acceptFriendRequests: boolean;
  allowSpectators: boolean;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  gameInvites: boolean;
  friendRequests: boolean;
  achievements: boolean;
  tournamentUpdates: boolean;
  marketplaceAlerts: boolean;
}

export interface UpdateProfileDto {
  username?: string;
  avatar?: string;
  bio?: string;
  social?: Partial<SocialLinks>;
  preferences?: Partial<PlayerPreferences>;
}

export interface GameResultDto {
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  healing: number;
  duration: number;
  mvp: boolean;
}