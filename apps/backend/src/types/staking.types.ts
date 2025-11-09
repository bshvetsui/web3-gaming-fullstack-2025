export interface StakingPool {
  id: string;
  name: string;
  tokenAddress: string;
  totalStaked: string;
  apy: number;
  lockPeriod: number;
  minStake: string;
  maxStake: string;
  rewardTokenAddress: string;
  status: StakingPoolStatus;
  startTime: Date;
  endTime?: Date;
  participants: number;
}

export enum StakingPoolStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export interface UserStake {
  userId: string;
  poolId: string;
  amount: string;
  stakedAt: Date;
  lockEndTime: Date;
  rewards: string;
  lastRewardClaim: Date;
  autoCompound: boolean;
  tier: StakingTier;
}

export interface StakingTier {
  level: TierLevel;
  multiplier: number;
  minStake: string;
  benefits: string[];
  nftBoostEnabled: boolean;
  nftBoostMultiplier?: number;
}

export enum TierLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export interface RewardHistory {
  userId: string;
  poolId: string;
  amount: string;
  timestamp: Date;
  type: RewardType;
  txHash: string;
}

export enum RewardType {
  CLAIM = 'claim',
  COMPOUND = 'compound',
  BONUS = 'bonus',
}

export interface StakeDto {
  poolId: string;
  amount: string;
}

export interface UnstakeDto {
  poolId: string;
  amount?: string;
}

export interface ClaimRewardsDto {
  poolId: string;
}