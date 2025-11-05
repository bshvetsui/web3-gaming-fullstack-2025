import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ethers } from 'ethers';

export interface StakingPool {
  id: string;
  name: string;
  tokenAddress: string;
  totalStaked: string;
  apy: number;
  lockPeriod: number; // in days
  minStake: string;
  maxStake: string;
  rewardTokenAddress: string;
  status: 'active' | 'paused' | 'closed';
  startTime: Date;
  endTime?: Date;
  participants: number;
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
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  multiplier: number;
  minStake: string;
  benefits: string[];
  nftBoostEnabled: boolean;
  nftBoostMultiplier?: number;
}

export interface RewardHistory {
  userId: string;
  poolId: string;
  amount: string;
  timestamp: Date;
  type: 'claim' | 'compound' | 'bonus';
  txHash: string;
}

@Injectable()
export class StakingService {
  private stakingPools: Map<string, StakingPool> = new Map();
  private userStakes: Map<string, UserStake[]> = new Map();
  private rewardHistory: RewardHistory[] = [];
  private tiers: StakingTier[] = [
    {
      level: 'bronze',
      multiplier: 1,
      minStake: '100',
      benefits: ['Basic rewards', '5% bonus on events'],
      nftBoostEnabled: false
    },
    {
      level: 'silver',
      multiplier: 1.1,
      minStake: '1000',
      benefits: ['10% reward boost', '10% bonus on events', 'Priority queue'],
      nftBoostEnabled: true,
      nftBoostMultiplier: 1.05
    },
    {
      level: 'gold',
      multiplier: 1.25,
      minStake: '5000',
      benefits: ['25% reward boost', '15% bonus on events', 'VIP support', 'Exclusive tournaments'],
      nftBoostEnabled: true,
      nftBoostMultiplier: 1.1
    },
    {
      level: 'platinum',
      multiplier: 1.5,
      minStake: '20000',
      benefits: ['50% reward boost', '20% bonus on events', 'Personal manager', 'Early access'],
      nftBoostEnabled: true,
      nftBoostMultiplier: 1.15
    },
    {
      level: 'diamond',
      multiplier: 2,
      minStake: '100000',
      benefits: ['100% reward boost', '30% bonus on events', 'All premium features', 'Governance rights'],
      nftBoostEnabled: true,
      nftBoostMultiplier: 1.25
    }
  ];

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeDefaultPools();
  }

  private initializeDefaultPools() {
    const defaultPools: StakingPool[] = [
      {
        id: 'pool-flexible',
        name: 'Flexible Staking',
        tokenAddress: '0x0000000000000000000000000000000000000001',
        totalStaked: '0',
        apy: 15,
        lockPeriod: 0,
        minStake: '100',
        maxStake: '1000000',
        rewardTokenAddress: '0x0000000000000000000000000000000000000001',
        status: 'active',
        startTime: new Date(),
        participants: 0
      },
      {
        id: 'pool-30days',
        name: '30 Days Locked',
        tokenAddress: '0x0000000000000000000000000000000000000001',
        totalStaked: '0',
        apy: 25,
        lockPeriod: 30,
        minStake: '500',
        maxStake: '500000',
        rewardTokenAddress: '0x0000000000000000000000000000000000000001',
        status: 'active',
        startTime: new Date(),
        participants: 0
      },
      {
        id: 'pool-90days',
        name: '90 Days Locked',
        tokenAddress: '0x0000000000000000000000000000000000000001',
        totalStaked: '0',
        apy: 40,
        lockPeriod: 90,
        minStake: '1000',
        maxStake: '250000',
        rewardTokenAddress: '0x0000000000000000000000000000000000000001',
        status: 'active',
        startTime: new Date(),
        participants: 0
      },
      {
        id: 'pool-365days',
        name: 'Annual Staking',
        tokenAddress: '0x0000000000000000000000000000000000000001',
        totalStaked: '0',
        apy: 80,
        lockPeriod: 365,
        minStake: '5000',
        maxStake: '100000',
        rewardTokenAddress: '0x0000000000000000000000000000000000000001',
        status: 'active',
        startTime: new Date(),
        participants: 0
      }
    ];

    defaultPools.forEach(pool => {
      this.stakingPools.set(pool.id, pool);
    });
  }

  async stake(userId: string, poolId: string, amount: string): Promise<UserStake> {
    const pool = this.stakingPools.get(poolId);

    if (!pool) {
      throw new NotFoundException('Staking pool not found');
    }

    if (pool.status !== 'active') {
      throw new BadRequestException('Pool is not active');
    }

    const amountWei = ethers.parseEther(amount);
    const minStakeWei = ethers.parseEther(pool.minStake);
    const maxStakeWei = ethers.parseEther(pool.maxStake);

    if (amountWei < minStakeWei) {
      throw new BadRequestException(`Minimum stake is ${pool.minStake} tokens`);
    }

    if (amountWei > maxStakeWei) {
      throw new BadRequestException(`Maximum stake is ${pool.maxStake} tokens`);
    }

    // Check existing stakes
    let userStakesList = this.userStakes.get(userId) || [];
    const existingStake = userStakesList.find(s => s.poolId === poolId);

    if (existingStake) {
      // Add to existing stake
      const currentAmount = ethers.parseEther(existingStake.amount);
      const newAmount = currentAmount + amountWei;

      if (newAmount > maxStakeWei) {
        throw new BadRequestException('Total stake would exceed maximum');
      }

      existingStake.amount = ethers.formatEther(newAmount);
      existingStake.tier = this.calculateTier(existingStake.amount);

      // Update pool total
      const poolTotal = ethers.parseEther(pool.totalStaked);
      pool.totalStaked = ethers.formatEther(poolTotal + amountWei);

      this.stakingPools.set(poolId, pool);
      this.userStakes.set(userId, userStakesList);

      this.eventEmitter.emit('stake.increased', {
        userId,
        poolId,
        amount,
        newTotal: existingStake.amount
      });

      return existingStake;
    }

    // Create new stake
    const lockEndTime = new Date();
    lockEndTime.setDate(lockEndTime.getDate() + pool.lockPeriod);

    const newStake: UserStake = {
      userId,
      poolId,
      amount,
      stakedAt: new Date(),
      lockEndTime,
      rewards: '0',
      lastRewardClaim: new Date(),
      autoCompound: false,
      tier: this.calculateTier(amount)
    };

    userStakesList.push(newStake);
    this.userStakes.set(userId, userStakesList);

    // Update pool
    const poolTotal = ethers.parseEther(pool.totalStaked);
    pool.totalStaked = ethers.formatEther(poolTotal + amountWei);
    pool.participants++;

    this.stakingPools.set(poolId, pool);

    this.eventEmitter.emit('stake.created', {
      userId,
      poolId,
      amount,
      lockPeriod: pool.lockPeriod,
      apy: pool.apy
    });

    return newStake;
  }

  async unstake(userId: string, poolId: string, amount?: string): Promise<void> {
    const userStakesList = this.userStakes.get(userId);

    if (!userStakesList) {
      throw new NotFoundException('No stakes found');
    }

    const stake = userStakesList.find(s => s.poolId === poolId);

    if (!stake) {
      throw new NotFoundException('Stake not found');
    }

    if (new Date() < stake.lockEndTime) {
      throw new BadRequestException('Tokens are still locked');
    }

    const pool = this.stakingPools.get(poolId);

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    const amountToUnstake = amount || stake.amount;
    const amountWei = ethers.parseEther(amountToUnstake);
    const stakeAmountWei = ethers.parseEther(stake.amount);

    if (amountWei > stakeAmountWei) {
      throw new BadRequestException('Insufficient staked amount');
    }

    // Calculate and claim rewards
    const rewards = await this.calculateRewards(stake);

    if (amountWei === stakeAmountWei) {
      // Full unstake
      const index = userStakesList.indexOf(stake);
      userStakesList.splice(index, 1);

      pool.participants--;
    } else {
      // Partial unstake
      stake.amount = ethers.formatEther(stakeAmountWei - amountWei);
      stake.tier = this.calculateTier(stake.amount);
    }

    // Update pool total
    const poolTotal = ethers.parseEther(pool.totalStaked);
    pool.totalStaked = ethers.formatEther(poolTotal - amountWei);

    this.stakingPools.set(poolId, pool);

    if (userStakesList.length === 0) {
      this.userStakes.delete(userId);
    } else {
      this.userStakes.set(userId, userStakesList);
    }

    this.eventEmitter.emit('stake.withdrawn', {
      userId,
      poolId,
      amount: amountToUnstake,
      rewards
    });
  }

  async claimRewards(userId: string, poolId: string): Promise<string> {
    const userStakesList = this.userStakes.get(userId);

    if (!userStakesList) {
      throw new NotFoundException('No stakes found');
    }

    const stake = userStakesList.find(s => s.poolId === poolId);

    if (!stake) {
      throw new NotFoundException('Stake not found');
    }

    const rewards = await this.calculateRewards(stake);

    if (parseFloat(rewards) === 0) {
      throw new BadRequestException('No rewards to claim');
    }

    stake.rewards = '0';
    stake.lastRewardClaim = new Date();

    this.userStakes.set(userId, userStakesList);

    // Record reward history
    this.rewardHistory.push({
      userId,
      poolId,
      amount: rewards,
      timestamp: new Date(),
      type: 'claim',
      txHash: '0x' + Math.random().toString(16).substr(2, 64)
    });

    this.eventEmitter.emit('rewards.claimed', {
      userId,
      poolId,
      amount: rewards
    });

    return rewards;
  }

  async enableAutoCompound(userId: string, poolId: string): Promise<void> {
    const userStakesList = this.userStakes.get(userId);

    if (!userStakesList) {
      throw new NotFoundException('No stakes found');
    }

    const stake = userStakesList.find(s => s.poolId === poolId);

    if (!stake) {
      throw new NotFoundException('Stake not found');
    }

    stake.autoCompound = true;
    this.userStakes.set(userId, userStakesList);

    this.eventEmitter.emit('autocompound.enabled', { userId, poolId });
  }

  private async calculateRewards(stake: UserStake): Promise<string> {
    const pool = this.stakingPools.get(stake.poolId);

    if (!pool) {
      return '0';
    }

    const now = Date.now();
    const stakingDuration = now - stake.lastRewardClaim.getTime();
    const daysStaked = stakingDuration / (1000 * 60 * 60 * 24);

    const stakeAmount = parseFloat(stake.amount);
    const baseReward = (stakeAmount * (pool.apy / 100) * daysStaked) / 365;

    // Apply tier multiplier
    const tierReward = baseReward * stake.tier.multiplier;

    // Apply NFT boost if applicable
    const finalReward = stake.tier.nftBoostEnabled && stake.tier.nftBoostMultiplier
      ? tierReward * stake.tier.nftBoostMultiplier
      : tierReward;

    return finalReward.toFixed(18);
  }

  private calculateTier(amount: string): StakingTier {
    const amountNum = parseFloat(amount);

    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (amountNum >= parseFloat(this.tiers[i].minStake)) {
        return this.tiers[i];
      }
    }

    return this.tiers[0];
  }

  async getUserStakes(userId: string): Promise<UserStake[]> {
    return this.userStakes.get(userId) || [];
  }

  async getStakingPools(): Promise<StakingPool[]> {
    return Array.from(this.stakingPools.values());
  }

  async getPoolDetails(poolId: string): Promise<StakingPool> {
    const pool = this.stakingPools.get(poolId);

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    return pool;
  }

  async getTotalValueLocked(): Promise<string> {
    let total = BigInt(0);

    this.stakingPools.forEach(pool => {
      total += ethers.parseEther(pool.totalStaked);
    });

    return ethers.formatEther(total);
  }

  async getUserTier(userId: string): Promise<StakingTier | null> {
    const stakes = this.userStakes.get(userId);

    if (!stakes || stakes.length === 0) {
      return null;
    }

    // Return highest tier among all stakes
    return stakes.reduce((highest, stake) => {
      const tierIndex = this.tiers.indexOf(stake.tier);
      const highestIndex = this.tiers.indexOf(highest);
      return tierIndex > highestIndex ? stake.tier : highest;
    }, this.tiers[0]);
  }
}