import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  stats?: GuildStats;
  requirements?: GuildRequirements;
  logo?: string;
  banner?: string;
  discord?: string;
  website?: string;
  isRecruiting?: boolean;
  language?: string;
  region?: string;
  type?: 'casual' | 'competitive' | 'social' | 'hardcore';
  wars?: GuildWar[];
  alliances?: string[]; // guild IDs
  achievements?: GuildAchievement[];
  buildings?: GuildBuilding[];
}

export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  level: number;
  bonus: {
    type: 'xp_boost' | 'currency_boost' | 'storage' | 'discount' | 'member_limit' | 'tax_reduction';
    value: number;
  };
  cost: number;
  requirements: { level: number; contribution: number };
}

export interface GuildMember {
  playerId: string;
  guildId: string;
  role: 'leader' | 'officer' | 'elite' | 'member' | 'recruit';
  joinedAt: Date;
  contribution: number;
  weeklyContribution?: number;
  lastActive?: Date;
  permissions?: GuildPermission[];
  guildExp?: number;
  donationRank?: number;
  warParticipations?: number;
}

export interface GuildPermission {
  action: 'invite' | 'kick' | 'promote' | 'manage_treasury' | 'start_war' | 'manage_buildings';
  granted: boolean;
}

export interface GuildStats {
  totalWars: number;
  warsWon: number;
  warsLost: number;
  totalMembers: number;
  activeMembers: number; // active in last 7 days
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
  status: 'preparing' | 'active' | 'ended';
  startTime: Date;
  endTime: Date;
  ourScore: number;
  opponentScore: number;
  participants: WarParticipant[];
  rewards: WarReward[];
  winner?: string;
}

export interface WarParticipant {
  playerId: string;
  attacks: number;
  defenses: number;
  score: number;
  stars: number;
}

export interface WarReward {
  type: 'currency' | 'item' | 'exp';
  amount: number;
  distributed: boolean;
}

export interface GuildAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewards: { type: string; amount: number }[];
}

export interface GuildBuilding {
  id: string;
  type: 'barracks' | 'treasury' | 'workshop' | 'academy' | 'market';
  level: number;
  upgrading: boolean;
  upgradeEndTime?: Date;
  benefits: BuildingBenefit[];
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
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

@Injectable()
export class GuildsService {
  private guilds: Map<string, Guild> = new Map();
  private members: Map<string, GuildMember> = new Map();
  private invitations: Map<string, Set<string>> = new Map(); // playerId -> Set of guildIds
  private applications: Map<string, GuildApplication[]> = new Map(); // guildId -> applications

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeSampleGuild();
  }

  private initializeSampleGuild() {
    const sampleGuild: Guild = {
      id: 'guild-elite',
      name: 'Elite Warriors',
      tag: 'ELITE',
      description: 'Top competitive guild for serious players',
      leaderId: 'player-1',
      memberIds: ['player-1'],
      level: 10,
      experience: 5000,
      maxMembers: 50,
      treasury: 100000,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      perks: [],
      stats: {
        totalWars: 15,
        warsWon: 12,
        warsLost: 3,
        totalMembers: 1,
        activeMembers: 1,
        weeklyExp: 1000,
        monthlyExp: 5000,
        totalContributions: 100000,
        averagePlayerLevel: 50,
        guildPower: 5000
      },
      requirements: {
        minLevel: 25,
        minTrophies: 1000,
        applicationRequired: true,
        autoAccept: false,
        applicationQuestions: [
          'What is your main gaming experience?',
          'How many hours per week can you dedicate?',
          'Why do you want to join our guild?'
        ]
      },
      logo: 'https://example.com/logo.png',
      banner: 'https://example.com/banner.png',
      discord: 'https://discord.gg/elite',
      website: 'https://elite-guild.com',
      isRecruiting: true,
      language: 'en',
      region: 'NA',
      type: 'competitive',
      wars: [],
      alliances: [],
      achievements: [],
      buildings: [
        {
          id: 'building-1',
          type: 'barracks',
          level: 5,
          upgrading: false,
          benefits: [
            { type: 'member_capacity', value: 10, description: '+10 member capacity' }
          ]
        }
      ]
    };

    this.guilds.set(sampleGuild.id, sampleGuild);

    // Add sample member
    const sampleMember: GuildMember = {
      playerId: 'player-1',
      guildId: sampleGuild.id,
      role: 'leader',
      joinedAt: sampleGuild.createdAt,
      contribution: 100000,
      weeklyContribution: 5000,
      lastActive: new Date(),
      permissions: [
        { action: 'invite', granted: true },
        { action: 'kick', granted: true },
        { action: 'promote', granted: true },
        { action: 'manage_treasury', granted: true },
        { action: 'start_war', granted: true },
        { action: 'manage_buildings', granted: true }
      ],
      guildExp: 5000,
      donationRank: 1,
      warParticipations: 15
    };

    this.members.set('player-1', sampleMember);
  }

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

  /**
   * Apply to guild
   */
  async applyToGuild(
    playerId: string,
    guildId: string,
    message: string,
    answers: { question: string; answer: string }[]
  ): Promise<GuildApplication> {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    if (!guild.isRecruiting) {
      throw new BadRequestException('Guild is not recruiting');
    }

    // Check if player already applied
    const guildApplications = this.applications.get(guildId) || [];
    const existingApplication = guildApplications.find(
      a => a.playerId === playerId && a.status === 'pending'
    );

    if (existingApplication) {
      throw new BadRequestException('Application already pending');
    }

    const application: GuildApplication = {
      id: `app-${Date.now()}`,
      playerId,
      guildId,
      message,
      answers,
      status: 'pending',
      appliedAt: new Date()
    };

    guildApplications.push(application);
    this.applications.set(guildId, guildApplications);

    this.eventEmitter.emit('guild.application.submitted', {
      guildId,
      playerId,
      applicationId: application.id
    });

    return application;
  }

  /**
   * Review guild application
   */
  async reviewApplication(
    applicationId: string,
    reviewerId: string,
    decision: 'accepted' | 'rejected'
  ): Promise<void> {
    // Find application
    let foundApplication: GuildApplication | undefined;
    let guildId: string | undefined;

    for (const [id, applications] of this.applications.entries()) {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        foundApplication = app;
        guildId = id;
        break;
      }
    }

    if (!foundApplication || !guildId) {
      throw new NotFoundException('Application not found');
    }

    // Check reviewer permissions
    const reviewer = this.members.get(reviewerId);
    if (!reviewer || reviewer.guildId !== guildId) {
      throw new BadRequestException('No permission to review applications');
    }

    const invitePermission = reviewer.permissions.find(p => p.action === 'invite');
    if (!invitePermission || !invitePermission.granted) {
      throw new BadRequestException('No invite permission');
    }

    foundApplication.status = decision;
    foundApplication.reviewedBy = reviewerId;
    foundApplication.reviewedAt = new Date();

    if (decision === 'accepted') {
      // Add player to guild
      this.acceptInvitation(foundApplication.playerId, guildId);
    }

    this.eventEmitter.emit('guild.application.reviewed', {
      applicationId,
      guildId,
      playerId: foundApplication.playerId,
      decision
    });
  }

  /**
   * Start guild war
   */
  async startGuildWar(
    guildId: string,
    opponentGuildId: string,
    starterId: string
  ): Promise<GuildWar> {
    const guild = this.guilds.get(guildId);
    const opponentGuild = this.guilds.get(opponentGuildId);

    if (!guild || !opponentGuild) {
      throw new NotFoundException('Guild not found');
    }

    // Check permissions
    const starter = this.members.get(starterId);
    if (!starter || starter.guildId !== guildId) {
      throw new BadRequestException('Not a member of this guild');
    }

    const warPermission = starter.permissions.find(p => p.action === 'start_war');
    if (!warPermission || !warPermission.granted) {
      throw new BadRequestException('No permission to start wars');
    }

    // Check if already in war
    const activeWar = guild.wars.find(w => w.status === 'active' || w.status === 'preparing');
    if (activeWar) {
      throw new BadRequestException('Already in an active war');
    }

    const war: GuildWar = {
      id: `war-${Date.now()}`,
      opponentGuildId,
      status: 'preparing',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours preparation
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days total
      ourScore: 0,
      opponentScore: 0,
      participants: [],
      rewards: []
    };

    guild.wars.push(war);
    this.guilds.set(guildId, guild);

    // Add war to opponent guild
    const opponentWar: GuildWar = {
      ...war,
      opponentGuildId: guildId
    };
    opponentGuild.wars.push(opponentWar);
    this.guilds.set(opponentGuildId, opponentGuild);

    this.eventEmitter.emit('guild.war.started', {
      guildId,
      opponentGuildId,
      warId: war.id
    });

    return war;
  }

  /**
   * Upgrade guild building
   */
  async upgradeBuilding(
    guildId: string,
    buildingId: string,
    upgraderId: string
  ): Promise<GuildBuilding> {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    // Check permissions
    const upgrader = this.members.get(upgraderId);
    if (!upgrader || upgrader.guildId !== guildId) {
      throw new BadRequestException('Not a member of this guild');
    }

    const buildingPermission = upgrader.permissions.find(p => p.action === 'manage_buildings');
    if (!buildingPermission || !buildingPermission.granted) {
      throw new BadRequestException('No permission to manage buildings');
    }

    const building = guild.buildings.find(b => b.id === buildingId);
    if (!building) {
      throw new NotFoundException('Building not found');
    }

    if (building.upgrading) {
      throw new BadRequestException('Building is already upgrading');
    }

    // Calculate upgrade cost
    const upgradeCost = building.level * 10000;
    if (guild.treasury < upgradeCost) {
      throw new BadRequestException('Insufficient treasury funds');
    }

    // Start upgrade
    guild.treasury -= upgradeCost;
    building.upgrading = true;
    building.upgradeEndTime = new Date(Date.now() + building.level * 60 * 60 * 1000); // 1 hour per level

    this.guilds.set(guildId, guild);

    this.eventEmitter.emit('guild.building.upgrade.started', {
      guildId,
      buildingId,
      newLevel: building.level + 1,
      endTime: building.upgradeEndTime
    });

    // Schedule upgrade completion
    setTimeout(() => {
      this.completeUpgrade(guildId, buildingId);
    }, building.level * 60 * 60 * 1000);

    return building;
  }

  private async completeUpgrade(guildId: string, buildingId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    const building = guild.buildings.find(b => b.id === buildingId);
    if (!building || !building.upgrading) return;

    building.level++;
    building.upgrading = false;
    building.upgradeEndTime = undefined;

    // Add new benefits based on building type
    switch (building.type) {
      case 'barracks':
        guild.maxMembers += 5;
        building.benefits.push({
          type: 'member_capacity',
          value: 5,
          description: '+5 member capacity'
        });
        break;
      case 'treasury':
        building.benefits.push({
          type: 'tax_reduction',
          value: 5,
          description: '5% tax reduction'
        });
        break;
      case 'workshop':
        building.benefits.push({
          type: 'craft_speed',
          value: 10,
          description: '10% faster crafting'
        });
        break;
      case 'academy':
        building.benefits.push({
          type: 'exp_boost',
          value: 5,
          description: '5% experience boost'
        });
        break;
      case 'market':
        building.benefits.push({
          type: 'trade_discount',
          value: 5,
          description: '5% trade discount'
        });
        break;
    }

    this.guilds.set(guildId, guild);

    this.eventEmitter.emit('guild.building.upgrade.completed', {
      guildId,
      buildingId,
      newLevel: building.level
    });
  }

  /**
   * Form alliance between guilds
   */
  async formAlliance(
    guildId: string,
    allyGuildId: string,
    proposerId: string
  ): Promise<void> {
    const guild = this.guilds.get(guildId);
    const allyGuild = this.guilds.get(allyGuildId);

    if (!guild || !allyGuild) {
      throw new NotFoundException('Guild not found');
    }

    // Check permissions
    const proposer = this.members.get(proposerId);
    if (!proposer || proposer.guildId !== guildId || proposer.role !== 'leader') {
      throw new BadRequestException('Only guild leaders can form alliances');
    }

    // Check if already allied
    if (guild.alliances.includes(allyGuildId)) {
      throw new BadRequestException('Already allied with this guild');
    }

    // Add alliance
    guild.alliances.push(allyGuildId);
    allyGuild.alliances.push(guildId);

    this.guilds.set(guildId, guild);
    this.guilds.set(allyGuildId, allyGuild);

    this.eventEmitter.emit('guild.alliance.formed', {
      guild1: guildId,
      guild2: allyGuildId
    });
  }

  /**
   * Calculate guild power
   */
  calculateGuildPower(guild: Guild): number {
    let power = 0;

    // Base power from level
    power += guild.level * 100;

    // Power from members
    power += guild.memberIds.length * 50;

    // Power from treasury
    power += Math.floor(guild.treasury / 1000);

    // Power from buildings
    guild.buildings.forEach(building => {
      power += building.level * 75;
    });

    // Power from war victories
    power += guild.stats.warsWon * 200;

    // Power from achievements
    power += guild.achievements.length * 150;

    return power;
  }

  /**
   * Get guild recommendations for player
   */
  async getRecommendedGuilds(
    playerLevel: number,
    playerRegion: string,
    playerLanguage: string
  ): Promise<Guild[]> {
    return Array.from(this.guilds.values())
      .filter(guild => {
        return guild.isRecruiting &&
          playerLevel >= guild.requirements.minLevel &&
          guild.region === playerRegion &&
          guild.language === playerLanguage &&
          guild.memberIds.length < guild.maxMembers;
      })
      .sort((a, b) => this.calculateGuildPower(b) - this.calculateGuildPower(a))
      .slice(0, 5);
  }
}
