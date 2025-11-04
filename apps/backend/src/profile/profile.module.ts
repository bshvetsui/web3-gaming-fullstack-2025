import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

const ProfileSchema = new MongooseModule.forFeature([
  {
    name: 'PlayerProfile',
    schema: {
      address: { type: String, required: true, unique: true, index: true },
      username: { type: String, required: true, index: true },
      avatar: { type: String },
      bio: { type: String, maxlength: 500 },
      level: { type: Number, default: 1, index: true },
      experience: { type: Number, default: 0 },
      totalGamesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0, index: true },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      winStreak: { type: Number, default: 0 },
      bestWinStreak: { type: Number, default: 0 },
      totalEarnings: { type: String, default: '0', index: true },
      favoriteGame: { type: String },
      joinedAt: { type: Date, default: Date.now },
      lastActive: { type: Date, default: Date.now, index: true },
      achievements: [{ type: String }],
      badges: [{
        id: String,
        name: String,
        description: String,
        icon: String,
        rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'] },
        earnedAt: Date
      }],
      stats: {
        killDeathRatio: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        avgGameDuration: { type: Number, default: 0 },
        totalPlayTime: { type: Number, default: 0 },
        favoriteWeapon: String,
        headshots: { type: Number, default: 0 },
        criticalHits: { type: Number, default: 0 },
        damageDealt: { type: Number, default: 0 },
        damageTaken: { type: Number, default: 0 },
        healingDone: { type: Number, default: 0 },
        objectivesCaptured: { type: Number, default: 0 },
        mvpCount: { type: Number, default: 0 }
      },
      social: {
        twitter: String,
        discord: String,
        telegram: String,
        website: String
      },
      preferences: {
        displayBadges: { type: Boolean, default: true },
        showStats: { type: Boolean, default: true },
        acceptFriendRequests: { type: Boolean, default: true },
        allowSpectators: { type: Boolean, default: true },
        notifications: {
          gameInvites: { type: Boolean, default: true },
          friendRequests: { type: Boolean, default: true },
          achievements: { type: Boolean, default: true },
          tournamentUpdates: { type: Boolean, default: true },
          marketplaceAlerts: { type: Boolean, default: true }
        }
      },
      reputation: { type: Number, default: 100, min: 0, max: 1000, index: true }
    }
  }
]);

@Module({
  imports: [ProfileSchema],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}