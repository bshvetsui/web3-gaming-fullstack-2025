import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
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

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel('PlayerProfile') private profileModel: Model<PlayerProfile>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createProfile(address: string, username: string): Promise<PlayerProfile> {
    const existingProfile = await this.profileModel.findOne({ address });

    if (existingProfile) {
      return existingProfile;
    }

    const profile = new this.profileModel({
      address,
      username,
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`,
      bio: '',
      level: 1,
      experience: 0,
      totalGamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winStreak: 0,
      bestWinStreak: 0,
      totalEarnings: '0',
      favoriteGame: '',
      joinedAt: new Date(),
      lastActive: new Date(),
      achievements: [],
      badges: [],
      stats: {
        killDeathRatio: 0,
        accuracy: 0,
        avgGameDuration: 0,
        totalPlayTime: 0,
        favoriteWeapon: '',
        headshots: 0,
        criticalHits: 0,
        damageDealt: 0,
        damageTaken: 0,
        healingDone: 0,
        objectivesCaptured: 0,
        mvpCount: 0,
      },
      social: {
        twitter: '',
        discord: '',
        telegram: '',
        website: '',
      },
      preferences: {
        displayBadges: true,
        showStats: true,
        acceptFriendRequests: true,
        allowSpectators: true,
        notifications: {
          gameInvites: true,
          friendRequests: true,
          achievements: true,
          tournamentUpdates: true,
          marketplaceAlerts: true,
        },
      },
      reputation: 100,
    });

    await profile.save();

    this.eventEmitter.emit('profile.created', { address, username });

    return profile;
  }

  async updateProfile(
    address: string,
    updates: Partial<PlayerProfile>
  ): Promise<PlayerProfile> {
    const profile = await this.profileModel.findOneAndUpdate(
      { address },
      { ...updates, lastActive: new Date() },
      { new: true }
    );

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    this.eventEmitter.emit('profile.updated', { address });

    return profile;
  }

  async updateGameStats(
    address: string,
    gameResult: {
      won: boolean;
      kills: number;
      deaths: number;
      assists: number;
      damage: number;
      healing: number;
      duration: number;
      mvp: boolean;
    }
  ): Promise<PlayerProfile> {
    const profile = await this.profileModel.findOne({ address });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Update basic stats
    profile.totalGamesPlayed++;
    profile.lastActive = new Date();

    if (gameResult.won) {
      profile.wins++;
      profile.winStreak++;
      if (profile.winStreak > profile.bestWinStreak) {
        profile.bestWinStreak = profile.winStreak;
      }
    } else {
      profile.losses++;
      profile.winStreak = 0;
    }

    // Update detailed stats
    profile.stats.damageDealt += gameResult.damage;
    profile.stats.healingDone += gameResult.healing;
    profile.stats.totalPlayTime += gameResult.duration;
    profile.stats.avgGameDuration =
      profile.stats.totalPlayTime / profile.totalGamesPlayed;

    if (gameResult.mvp) {
      profile.stats.mvpCount++;
    }

    // Calculate K/D ratio
    const totalKills = (profile.stats.killDeathRatio * (profile.totalGamesPlayed - 1) * 10) + gameResult.kills;
    const totalDeaths = ((profile.totalGamesPlayed - 1) * 10) + (gameResult.deaths || 1);
    profile.stats.killDeathRatio = totalKills / totalDeaths;

    // Add experience
    let expGained = 100; // Base experience
    if (gameResult.won) expGained += 150;
    if (gameResult.mvp) expGained += 100;
    expGained += gameResult.kills * 10;
    expGained += gameResult.assists * 5;

    profile.experience += expGained;

    // Check for level up
    const expForNextLevel = profile.level * 1000;
    if (profile.experience >= expForNextLevel) {
      profile.level++;
      profile.experience = profile.experience - expForNextLevel;

      this.eventEmitter.emit('player.levelup', {
        address,
        newLevel: profile.level,
      });
    }

    await profile.save();

    this.eventEmitter.emit('stats.updated', { address });

    return profile;
  }

  async awardBadge(
    address: string,
    badge: Badge
  ): Promise<PlayerProfile> {
    const profile = await this.profileModel.findOne({ address });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if badge already exists
    const existingBadge = profile.badges.find(b => b.id === badge.id);
    if (existingBadge) {
      return profile;
    }

    profile.badges.push(badge);

    // Add reputation based on badge rarity
    const reputationBonus = {
      common: 10,
      rare: 25,
      epic: 50,
      legendary: 100,
    };

    profile.reputation += reputationBonus[badge.rarity];

    await profile.save();

    this.eventEmitter.emit('badge.awarded', {
      address,
      badge: badge.name,
      rarity: badge.rarity,
    });

    return profile;
  }

  async getProfile(address: string): Promise<PlayerProfile> {
    const profile = await this.profileModel.findOne({ address });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async getTopPlayers(
    criteria: 'level' | 'wins' | 'reputation' | 'earnings',
    limit: number = 100
  ): Promise<PlayerProfile[]> {
    const sortField = {
      level: 'level',
      wins: 'wins',
      reputation: 'reputation',
      earnings: 'totalEarnings',
    }[criteria];

    return await this.profileModel
      .find()
      .sort({ [sortField]: -1 })
      .limit(limit);
  }

  async searchProfiles(query: string): Promise<PlayerProfile[]> {
    return await this.profileModel.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
      ],
    }).limit(20);
  }

  async updateReputation(
    address: string,
    change: number,
    reason: string
  ): Promise<PlayerProfile> {
    const profile = await this.profileModel.findOne({ address });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    profile.reputation = Math.max(0, Math.min(1000, profile.reputation + change));

    await profile.save();

    this.eventEmitter.emit('reputation.changed', {
      address,
      change,
      newReputation: profile.reputation,
      reason,
    });

    return profile;
  }
}