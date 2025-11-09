export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderId: string;
  memberIds: string[];
  level: number;
  experience: number;
  maxMembers: number;
  treasury: number;
  createdAt: Date;
  perks: GuildPerk[];
  stats: GuildStats;
  requirements: GuildRequirements;
  logo: string;
  banner: string;
  discord: string;
  website: string;
  isRecruiting: boolean;
  language: string;
  region: string;
  type: GuildType;
  wars: GuildWar[];
  alliances: string[];
  achievements: GuildAchievement[];
  buildings: GuildBuilding[];
}

export enum GuildType {
  CASUAL = 'casual',
  COMPETITIVE = 'competitive',
  SOCIAL = 'social',
  HARDCORE = 'hardcore',
}

export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  level: number;
  bonus: {
    type: BonusType;
    value: number;
  };
  cost: number;
  requirements: {
    level: number;
    contribution: number;
  };
}

export enum BonusType {
  XP_BOOST = 'xp_boost',
  CURRENCY_BOOST = 'currency_boost',
  STORAGE = 'storage',
  DISCOUNT = 'discount',
  MEMBER_LIMIT = 'member_limit',
  TAX_REDUCTION = 'tax_reduction',
}

export interface GuildMember {
  playerId: string;
  guildId: string;
  role: GuildRole;
  joinedAt: Date;
  contribution: number;
  weeklyContribution: number;
  lastActive: Date;
  permissions: GuildPermission[];
  guildExp: number;
  donationRank: number;
  warParticipations: number;
}

export enum GuildRole {
  LEADER = 'leader',
  OFFICER = 'officer',
  ELITE = 'elite',
  MEMBER = 'member',
  RECRUIT = 'recruit',
}

export interface GuildPermission {
  action: PermissionAction;
  granted: boolean;
}

export enum PermissionAction {
  INVITE = 'invite',
  KICK = 'kick',
  PROMOTE = 'promote',
  MANAGE_TREASURY = 'manage_treasury',
  START_WAR = 'start_war',
  MANAGE_BUILDINGS = 'manage_buildings',
}

export interface GuildStats {
  totalWars: number;
  warsWon: number;
  warsLost: number;
  totalMembers: number;
  activeMembers: number;
  weeklyExp: number;
  monthlyExp: number;
  totalContributions: number;
  averagePlayerLevel: number;
  guildPower: number;
}

export interface GuildRequirements {
  minLevel: number;
  minTrophies: number;
  applicationRequired: boolean;
  autoAccept: boolean;
  applicationQuestions: string[];
}

export interface GuildWar {
  id: string;
  opponentGuildId: string;
  status: WarStatus;
  startTime: Date;
  endTime: Date;
  ourScore: number;
  opponentScore: number;
  participants: WarParticipant[];
  rewards: WarReward[];
  winner?: string;
}

export enum WarStatus {
  PREPARING = 'preparing',
  ACTIVE = 'active',
  ENDED = 'ended',
}

export interface WarParticipant {
  playerId: string;
  attacks: number;
  defenses: number;
  score: number;
  stars: number;
}

export interface WarReward {
  type: RewardType;
  amount: number;
  distributed: boolean;
}

export enum RewardType {
  CURRENCY = 'currency',
  ITEM = 'item',
  EXP = 'exp',
}

export interface GuildAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  tier: AchievementTier;
  rewards: { type: string; amount: number }[];
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export interface GuildBuilding {
  id: string;
  type: BuildingType;
  level: number;
  upgrading: boolean;
  upgradeEndTime?: Date;
  benefits: BuildingBenefit[];
}

export enum BuildingType {
  BARRACKS = 'barracks',
  TREASURY = 'treasury',
  WORKSHOP = 'workshop',
  ACADEMY = 'academy',
  MARKET = 'market',
}

export interface BuildingBenefit {
  type: string;
  value: number;
  description: string;
}

export interface GuildApplication {
  id: string;
  playerId: string;
  guildId: string;
  message: string;
  answers: { question: string; answer: string }[];
  status: ApplicationStatus;
  appliedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface CreateGuildDto {
  name: string;
  tag: string;
  description: string;
  type: GuildType;
  language: string;
  region: string;
}

export interface ApplyToGuildDto {
  message: string;
  answers: { question: string; answer: string }[];
}