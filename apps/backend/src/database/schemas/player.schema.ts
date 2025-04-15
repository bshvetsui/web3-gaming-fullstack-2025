import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Player document schema for MongoDB
 */
@Schema({ timestamps: true })
export class Player extends Document {
  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  experience: number;

  @Prop({ type: Object, default: {} })
  stats: {
    gamesPlayed?: number;
    wins?: number;
    losses?: number;
    killDeathRatio?: number;
    totalScore?: number;
  };

  @Prop({ type: Array, default: [] })
  inventory: Array<{
    itemId: string;
    itemType: string;
    quantity: number;
    acquiredAt: Date;
  }>;

  @Prop({ type: Array, default: [] })
  achievements: Array<{
    achievementId: string;
    unlockedAt: Date;
  }>;

  @Prop({ type: Object, default: {} })
  settings: {
    soundEnabled?: boolean;
    musicVolume?: number;
    sfxVolume?: number;
    graphicsQuality?: 'low' | 'medium' | 'high';
  };

  @Prop({ default: Date.now })
  lastLoginAt: Date;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);

// Add indexes for better query performance
PlayerSchema.index({ walletAddress: 1 });
PlayerSchema.index({ username: 1 });
PlayerSchema.index({ 'stats.totalScore': -1 });
