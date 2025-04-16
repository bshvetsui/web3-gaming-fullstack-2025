import { Injectable } from '@nestjs/common';

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
}

export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  level: number;
  bonus: {
    type: 'xp_boost' | 'currency_boost' | 'storage' | 'discount';
    value: number;
  };
}

export interface GuildMember {
  playerId: string;
  guildId: string;
  role: 'leader' | 'officer' | 'member';
  joinedAt: Date;
  contribution: number;
}

@Injectable()
export class GuildsService {
  private guilds: Map<string, Guild> = new Map();
  private members: Map<string, GuildMember> = new Map();
  private invitations: Map<string, Set<string>> = new Map(); // playerId -> Set of guildIds

  /**
   * Create a new guild
   */
  async createGuild(
    leaderId: string,
    name: string,
    tag: string,
    description: string
  ): Promise<Guild> {
    // Check if player is already in a guild
    if (this.members.has(leaderId)) {
      throw new Error('Player is already in a guild');
    }

    // Check if tag is unique
    const existingGuild = Array.from(this.guilds.values()).find(
      (g) => g.tag === tag
    );

    if (existingGuild) {
      throw new Error('Guild tag already taken');
    }

    const guild: Guild = {
      id: `guild-${Date.now()}`,
      name,
      tag,
      description,
      leaderId,
      memberIds: [leaderId],
      level: 1,
      experience: 0,
      maxMembers: 20,
      treasury: 0,
      createdAt: new Date(),
      perks: [],
    };

    this.guilds.set(guild.id, guild);

    // Add leader as member
    const member: GuildMember = {
      playerId: leaderId,
      guildId: guild.id,
      role: 'leader',
      joinedAt: new Date(),
      contribution: 0,
    };

    this.members.set(leaderId, member);

    return guild;
  }

  /**
   * Get guild by ID
   */
  getGuild(guildId: string): Guild | null {
    return this.guilds.get(guildId) || null;
  }

  /**
   * Get all guilds
   */
  getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  /**
   * Get player's guild
   */
  getPlayerGuild(playerId: string): Guild | null {
    const member = this.members.get(playerId);
    if (!member) return null;

    return this.guilds.get(member.guildId) || null;
  }

  /**
   * Invite player to guild
   */
  invitePlayer(guildId: string, playerId: string, inviterId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    // Check if inviter is officer or leader
    const inviter = this.members.get(inviterId);
    if (!inviter || inviter.guildId !== guildId) return false;

    if (inviter.role !== 'leader' && inviter.role !== 'officer') {
      return false;
    }

    // Check if player is already in a guild
    if (this.members.has(playerId)) return false;

    // Add invitation
    const playerInvites = this.invitations.get(playerId) || new Set();
    playerInvites.add(guildId);
    this.invitations.set(playerId, playerInvites);

    return true;
  }

  /**
   * Accept guild invitation
   */
  acceptInvitation(playerId: string, guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    // Check if player has invitation
    const invites = this.invitations.get(playerId);
    if (!invites || !invites.has(guildId)) return false;

    // Check if guild is full
    if (guild.memberIds.length >= guild.maxMembers) return false;

    // Add player to guild
    guild.memberIds.push(playerId);
    this.guilds.set(guildId, guild);

    // Add member record
    const member: GuildMember = {
      playerId,
      guildId,
      role: 'member',
      joinedAt: new Date(),
      contribution: 0,
    };

    this.members.set(playerId, member);

    // Remove all invitations for this player
    this.invitations.delete(playerId);

    return true;
  }

  /**
   * Leave guild
   */
  leaveGuild(playerId: string): boolean {
    const member = this.members.get(playerId);
    if (!member) return false;

    const guild = this.guilds.get(member.guildId);
    if (!guild) return false;

    // Leader can't leave if there are other members
    if (member.role === 'leader' && guild.memberIds.length > 1) {
      throw new Error('Leader must transfer leadership before leaving');
    }

    // Remove from guild
    guild.memberIds = guild.memberIds.filter((id) => id !== playerId);

    // If guild is empty, delete it
    if (guild.memberIds.length === 0) {
      this.guilds.delete(member.guildId);
    } else {
      this.guilds.set(member.guildId, guild);
    }

    // Remove member record
    this.members.delete(playerId);

    return true;
  }

  /**
   * Kick member from guild
   */
  kickMember(
    guildId: string,
    playerId: string,
    kickerId: string
  ): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    const kicker = this.members.get(kickerId);
    if (!kicker || kicker.guildId !== guildId) return false;

    // Only leader and officers can kick
    if (kicker.role !== 'leader' && kicker.role !== 'officer') {
      return false;
    }

    const target = this.members.get(playerId);
    if (!target || target.guildId !== guildId) return false;

    // Can't kick the leader
    if (target.role === 'leader') return false;

    // Officers can't kick other officers
    if (kicker.role === 'officer' && target.role === 'officer') {
      return false;
    }

    // Remove from guild
    guild.memberIds = guild.memberIds.filter((id) => id !== playerId);
    this.guilds.set(guildId, guild);

    this.members.delete(playerId);

    return true;
  }

  /**
   * Promote member
   */
  promoteMember(
    guildId: string,
    playerId: string,
    promoterId: string
  ): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    const promoter = this.members.get(promoterId);
    if (!promoter || promoter.role !== 'leader') return false;

    const member = this.members.get(playerId);
    if (!member || member.guildId !== guildId) return false;

    if (member.role === 'member') {
      member.role = 'officer';
      this.members.set(playerId, member);
      return true;
    }

    return false;
  }

  /**
   * Contribute to guild treasury
   */
  contribute(playerId: string, amount: number): boolean {
    const member = this.members.get(playerId);
    if (!member) return false;

    const guild = this.guilds.get(member.guildId);
    if (!guild) return false;

    guild.treasury += amount;
    member.contribution += amount;

    this.guilds.set(member.guildId, guild);
    this.members.set(playerId, member);

    return true;
  }

  /**
   * Add experience to guild
   */
  addExperience(guildId: string, experience: number): void {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    guild.experience += experience;

    // Level up logic
    const requiredXP = guild.level * 1000;
    while (guild.experience >= requiredXP) {
      guild.experience -= requiredXP;
      guild.level++;

      // Increase max members every 5 levels
      if (guild.level % 5 === 0) {
        guild.maxMembers += 5;
      }
    }

    this.guilds.set(guildId, guild);
  }

  /**
   * Get guild leaderboard
   */
  getLeaderboard(limit: number = 10): Guild[] {
    return Array.from(this.guilds.values())
      .sort((a, b) => b.level - a.level || b.experience - a.experience)
      .slice(0, limit);
  }
}
