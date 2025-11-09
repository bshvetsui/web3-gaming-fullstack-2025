import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface ReplayMetadata {
  id: string;
  matchId: string;
  gameMode: string;
  map: string;
  players: ReplayPlayer[];
  duration: number;
  recordedAt: Date;
  version: string;
  fileSize: number;
  compressed: boolean;
  highlights: Highlight[];
  statistics: MatchStatistics;
  winner?: string;
  viewCount: number;
  rating: number;
  tags: string[];
}

export interface ReplayPlayer {
  id: string;
  username: string;
  team: string;
  character: string;
  level: number;
  rating: number;
  stats: PlayerStats;
}

export interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  healing: number;
  score: number;
  accuracy: number;
  headshots: number;
}

export interface GameFrame {
  frameNumber: number;
  timestamp: number;
  events: GameEvent[];
  worldState: WorldState;
  playerStates: Map<string, PlayerState>;
}

export interface GameEvent {
  id: string;
  type: EventType;
  timestamp: number;
  playerId?: string;
  data: any;
  importance: number; // 0-10 for highlight detection
}

export enum EventType {
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  PLAYER_SPAWN = 'player_spawn',
  PLAYER_DEATH = 'player_death',
  PLAYER_KILL = 'player_kill',
  PLAYER_ASSIST = 'player_assist',
  PLAYER_MOVE = 'player_move',
  PLAYER_SHOOT = 'player_shoot',
  PLAYER_RELOAD = 'player_reload',
  PLAYER_USE_ABILITY = 'player_use_ability',
  PLAYER_HEAL = 'player_heal',
  PLAYER_DAMAGE = 'player_damage',
  OBJECTIVE_CAPTURE = 'objective_capture',
  OBJECTIVE_CONTEST = 'objective_contest',
  ITEM_PICKUP = 'item_pickup',
  ITEM_DROP = 'item_drop',
  CHAT_MESSAGE = 'chat_message',
  ROUND_START = 'round_start',
  ROUND_END = 'round_end',
  MULTIKILL = 'multikill',
  KILLSTREAK = 'killstreak',
  COMEBACK = 'comeback',
  CLUTCH = 'clutch',
}

export interface WorldState {
  objectives: Objective[];
  items: WorldItem[];
  projectiles: Projectile[];
  effects: VisualEffect[];
  gameTime: number;
  score: { team1: number; team2: number };
}

export interface PlayerState {
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  health: number;
  armor: number;
  ammo: number;
  weapons: string[];
  activeWeapon: string;
  abilities: AbilityState[];
  buffs: Buff[];
  debuffs: Debuff[];
  isAlive: boolean;
  isRespawning: boolean;
  respawnTime?: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Objective {
  id: string;
  type: string;
  position: Vector3;
  status: 'neutral' | 'captured' | 'contested';
  controllingTeam?: string;
  captureProgress: number;
}

export interface WorldItem {
  id: string;
  type: string;
  position: Vector3;
  available: boolean;
  respawnTime?: number;
}

export interface Projectile {
  id: string;
  type: string;
  position: Vector3;
  velocity: Vector3;
  owner: string;
  damage: number;
}

export interface VisualEffect {
  id: string;
  type: string;
  position: Vector3;
  duration: number;
  startTime: number;
}

export interface AbilityState {
  id: string;
  name: string;
  cooldown: number;
  charges: number;
  active: boolean;
}

export interface Buff {
  id: string;
  name: string;
  duration: number;
  stacks: number;
}

export interface Debuff {
  id: string;
  name: string;
  duration: number;
  stacks: number;
}

export interface Highlight {
  id: string;
  type: 'multikill' | 'ace' | 'clutch' | 'comeback' | 'perfect_round' | 'long_range' | 'quick_scope';
  playerId: string;
  timestamp: number;
  frameStart: number;
  frameEnd: number;
  description: string;
  importance: number;
}

export interface MatchStatistics {
  totalKills: number;
  totalDeaths: number;
  totalDamage: number;
  totalHealing: number;
  longestKillStreak: number;
  mostKillsPlayer: string;
  mostDamagePlayer: string;
  mvpPlayer: string;
  comebacks: number;
  clutches: number;
  perfectRounds: number;
}

export interface ReplayAnalysis {
  replayId: string;
  heatmaps: HeatmapData[];
  playerPaths: PlayerPath[];
  weaponUsage: WeaponUsage[];
  abilityUsage: AbilityUsage[];
  economyTimeline: EconomySnapshot[];
  teamfights: Teamfight[];
  keyMoments: KeyMoment[];
}

export interface HeatmapData {
  type: 'kills' | 'deaths' | 'movement' | 'objectives';
  data: { position: Vector3; intensity: number }[];
}

export interface PlayerPath {
  playerId: string;
  path: Vector3[];
  timestamps: number[];
}

export interface WeaponUsage {
  weapon: string;
  usage: number;
  kills: number;
  accuracy: number;
  headshotRate: number;
}

export interface AbilityUsage {
  ability: string;
  uses: number;
  effectiveness: number;
  averageCooldown: number;
}

export interface EconomySnapshot {
  timestamp: number;
  team1Economy: number;
  team2Economy: number;
  goldDifference: number;
}

export interface Teamfight {
  startTime: number;
  endTime: number;
  location: Vector3;
  participants: string[];
  winner: string;
  casualties: { team1: number; team2: number };
}

export interface KeyMoment {
  timestamp: number;
  type: string;
  description: string;
  impact: number; // 0-10
  participants: string[];
}

@Injectable()
export class ReplayService {
  private logger = new Logger('ReplayService');
  private replays: Map<string, ReplayMetadata> = new Map();
  private activeRecordings: Map<string, GameFrame[]> = new Map();
  private replayDirectory = './replays';
  private maxReplaySize = 100 * 1024 * 1024; // 100MB
  private frameRate = 60; // 60 fps recording
  private compressionEnabled = true;

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeReplaySystem();
  }

  private async initializeReplaySystem() {
    try {
      await fs.mkdir(this.replayDirectory, { recursive: true });
      this.logger.log('Replay system initialized');
    } catch (error) {
      this.logger.error('Failed to initialize replay system', error);
    }
  }

  async startRecording(matchId: string, metadata: Partial<ReplayMetadata>): Promise<string> {
    const replayId = `replay-${matchId}-${Date.now()}`;

    const replay: ReplayMetadata = {
      id: replayId,
      matchId,
      gameMode: metadata.gameMode || '',
      map: metadata.map || '',
      players: metadata.players || [],
      duration: 0,
      recordedAt: new Date(),
      version: '1.0.0',
      fileSize: 0,
      compressed: this.compressionEnabled,
      highlights: [],
      statistics: {
        totalKills: 0,
        totalDeaths: 0,
        totalDamage: 0,
        totalHealing: 0,
        longestKillStreak: 0,
        mostKillsPlayer: '',
        mostDamagePlayer: '',
        mvpPlayer: '',
        comebacks: 0,
        clutches: 0,
        perfectRounds: 0,
      },
      viewCount: 0,
      rating: 0,
      tags: [],
    };

    this.replays.set(replayId, replay);
    this.activeRecordings.set(replayId, []);

    this.eventEmitter.emit('replay.recording.started', { replayId, matchId });
    this.logger.log(`Started recording replay ${replayId} for match ${matchId}`);

    return replayId;
  }

  async recordFrame(replayId: string, frame: GameFrame): Promise<void> {
    const frames = this.activeRecordings.get(replayId);

    if (!frames) {
      throw new NotFoundException('Recording not found');
    }

    frames.push(frame);

    // Process events for highlights
    frame.events.forEach(event => {
      if (event.importance >= 7) {
        this.detectHighlight(replayId, event, frame.frameNumber);
      }
    });

    // Update statistics
    this.updateStatistics(replayId, frame);
  }

  async stopRecording(replayId: string): Promise<ReplayMetadata> {
    const frames = this.activeRecordings.get(replayId);
    const metadata = this.replays.get(replayId);

    if (!frames || !metadata) {
      throw new NotFoundException('Recording not found');
    }

    // Calculate duration
    const lastFrame = frames[frames.length - 1];
    metadata.duration = lastFrame ? lastFrame.timestamp : 0;

    // Analyze replay for additional insights
    const analysis = await this.analyzeReplay(replayId, frames);

    // Save to file
    const filePath = await this.saveReplay(replayId, frames, metadata);
    metadata.fileSize = (await fs.stat(filePath)).size;

    // Clean up active recording
    this.activeRecordings.delete(replayId);

    this.eventEmitter.emit('replay.recording.stopped', {
      replayId,
      duration: metadata.duration,
      frameCount: frames.length,
      fileSize: metadata.fileSize,
    });

    this.logger.log(`Stopped recording replay ${replayId}`);

    return metadata;
  }

  private async saveReplay(
    replayId: string,
    frames: GameFrame[],
    metadata: ReplayMetadata
  ): Promise<string> {
    const replayData = {
      metadata,
      frames,
    };

    let data = JSON.stringify(replayData);

    if (this.compressionEnabled) {
      data = (await gzip(data)).toString('base64');
    }

    const filePath = path.join(this.replayDirectory, `${replayId}.replay`);
    await fs.writeFile(filePath, data);

    return filePath;
  }

  async loadReplay(replayId: string): Promise<{ metadata: ReplayMetadata; frames: GameFrame[] }> {
    const filePath = path.join(this.replayDirectory, `${replayId}.replay`);

    try {
      let data = await fs.readFile(filePath, 'utf-8');

      if (this.compressionEnabled) {
        const buffer = Buffer.from(data, 'base64');
        data = (await gunzip(buffer)).toString();
      }

      const replayData = JSON.parse(data);

      // Update view count
      const metadata = this.replays.get(replayId);
      if (metadata) {
        metadata.viewCount++;
      }

      return replayData;
    } catch (error) {
      this.logger.error(`Failed to load replay ${replayId}`, error);
      throw new NotFoundException('Replay not found');
    }
  }

  async getReplayMetadata(replayId: string): Promise<ReplayMetadata> {
    const metadata = this.replays.get(replayId);

    if (!metadata) {
      // Try to load from file
      const replay = await this.loadReplay(replayId);
      return replay.metadata;
    }

    return metadata;
  }

  async searchReplays(criteria: {
    playerId?: string;
    gameMode?: string;
    map?: string;
    minDuration?: number;
    maxDuration?: number;
    tags?: string[];
  }): Promise<ReplayMetadata[]> {
    const replays = Array.from(this.replays.values());

    return replays.filter(replay => {
      if (criteria.playerId && !replay.players.some(p => p.id === criteria.playerId)) {
        return false;
      }

      if (criteria.gameMode && replay.gameMode !== criteria.gameMode) {
        return false;
      }

      if (criteria.map && replay.map !== criteria.map) {
        return false;
      }

      if (criteria.minDuration && replay.duration < criteria.minDuration) {
        return false;
      }

      if (criteria.maxDuration && replay.duration > criteria.maxDuration) {
        return false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const hasAllTags = criteria.tags.every(tag => replay.tags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }

  async getHighlights(replayId: string): Promise<Highlight[]> {
    const metadata = await this.getReplayMetadata(replayId);
    return metadata.highlights;
  }

  async extractClip(
    replayId: string,
    startFrame: number,
    endFrame: number
  ): Promise<GameFrame[]> {
    const replay = await this.loadReplay(replayId);
    return replay.frames.slice(startFrame, endFrame + 1);
  }

  async rateReplay(replayId: string, rating: number): Promise<void> {
    const metadata = this.replays.get(replayId);

    if (!metadata) {
      throw new NotFoundException('Replay not found');
    }

    // Simple average rating (in production, track individual ratings)
    const currentTotal = metadata.rating * metadata.viewCount;
    metadata.rating = (currentTotal + rating) / (metadata.viewCount + 1);

    this.eventEmitter.emit('replay.rated', { replayId, rating: metadata.rating });
  }

  private detectHighlight(replayId: string, event: GameEvent, frameNumber: number) {
    const metadata = this.replays.get(replayId);

    if (!metadata) return;

    let highlight: Highlight | null = null;

    switch (event.type) {
      case EventType.MULTIKILL:
        highlight = {
          id: `highlight-${Date.now()}`,
          type: 'multikill',
          playerId: event.playerId!,
          timestamp: event.timestamp,
          frameStart: Math.max(0, frameNumber - this.frameRate * 3), // 3 seconds before
          frameEnd: frameNumber + this.frameRate * 2, // 2 seconds after
          description: `${event.data.kills} kills in ${event.data.timeWindow}ms`,
          importance: event.importance,
        };
        break;

      case EventType.CLUTCH:
        highlight = {
          id: `highlight-${Date.now()}`,
          type: 'clutch',
          playerId: event.playerId!,
          timestamp: event.timestamp,
          frameStart: Math.max(0, frameNumber - this.frameRate * 5),
          frameEnd: frameNumber + this.frameRate * 3,
          description: `1v${event.data.enemies} clutch`,
          importance: event.importance,
        };
        break;

      case EventType.COMEBACK:
        highlight = {
          id: `highlight-${Date.now()}`,
          type: 'comeback',
          playerId: event.playerId!,
          timestamp: event.timestamp,
          frameStart: Math.max(0, frameNumber - this.frameRate * 10),
          frameEnd: frameNumber + this.frameRate * 5,
          description: `Comeback from ${event.data.deficit} point deficit`,
          importance: event.importance,
        };
        break;
    }

    if (highlight) {
      metadata.highlights.push(highlight);
      metadata.highlights.sort((a, b) => b.importance - a.importance);

      // Keep only top 10 highlights
      if (metadata.highlights.length > 10) {
        metadata.highlights = metadata.highlights.slice(0, 10);
      }
    }
  }

  private updateStatistics(replayId: string, frame: GameFrame) {
    const metadata = this.replays.get(replayId);

    if (!metadata) return;

    frame.events.forEach(event => {
      switch (event.type) {
        case EventType.PLAYER_KILL:
          metadata.statistics.totalKills++;
          // Update kill streaks, most kills player, etc.
          break;

        case EventType.PLAYER_DEATH:
          metadata.statistics.totalDeaths++;
          break;

        case EventType.PLAYER_DAMAGE:
          metadata.statistics.totalDamage += event.data.damage || 0;
          break;

        case EventType.PLAYER_HEAL:
          metadata.statistics.totalHealing += event.data.healing || 0;
          break;

        case EventType.COMEBACK:
          metadata.statistics.comebacks++;
          break;

        case EventType.CLUTCH:
          metadata.statistics.clutches++;
          break;
      }
    });
  }

  private async analyzeReplay(replayId: string, frames: GameFrame[]): Promise<ReplayAnalysis> {
    const analysis: ReplayAnalysis = {
      replayId,
      heatmaps: this.generateHeatmaps(frames),
      playerPaths: this.extractPlayerPaths(frames),
      weaponUsage: this.analyzeWeaponUsage(frames),
      abilityUsage: this.analyzeAbilityUsage(frames),
      economyTimeline: this.generateEconomyTimeline(frames),
      teamfights: this.detectTeamfights(frames),
      keyMoments: this.identifyKeyMoments(frames),
    };

    return analysis;
  }

  private generateHeatmaps(frames: GameFrame[]): HeatmapData[] {
    const killHeatmap: Map<string, number> = new Map();
    const deathHeatmap: Map<string, number> = new Map();

    frames.forEach(frame => {
      frame.events.forEach(event => {
        if (event.type === EventType.PLAYER_KILL && event.data.position) {
          const key = `${Math.floor(event.data.position.x / 10)},${Math.floor(event.data.position.y / 10)}`;
          killHeatmap.set(key, (killHeatmap.get(key) || 0) + 1);
        }

        if (event.type === EventType.PLAYER_DEATH && event.data.position) {
          const key = `${Math.floor(event.data.position.x / 10)},${Math.floor(event.data.position.y / 10)}`;
          deathHeatmap.set(key, (deathHeatmap.get(key) || 0) + 1);
        }
      });
    });

    return [
      {
        type: 'kills',
        data: Array.from(killHeatmap.entries()).map(([key, intensity]) => {
          const [x, y] = key.split(',').map(Number);
          return {
            position: { x: x * 10, y: y * 10, z: 0 },
            intensity,
          };
        }),
      },
      {
        type: 'deaths',
        data: Array.from(deathHeatmap.entries()).map(([key, intensity]) => {
          const [x, y] = key.split(',').map(Number);
          return {
            position: { x: x * 10, y: y * 10, z: 0 },
            intensity,
          };
        }),
      },
    ];
  }

  private extractPlayerPaths(frames: GameFrame[]): PlayerPath[] {
    const paths: Map<string, PlayerPath> = new Map();

    frames.forEach(frame => {
      frame.playerStates.forEach((state, playerId) => {
        if (!paths.has(playerId)) {
          paths.set(playerId, {
            playerId,
            path: [],
            timestamps: [],
          });
        }

        const playerPath = paths.get(playerId)!;
        playerPath.path.push(state.position);
        playerPath.timestamps.push(frame.timestamp);
      });
    });

    return Array.from(paths.values());
  }

  private analyzeWeaponUsage(frames: GameFrame[]): WeaponUsage[] {
    const usage: Map<string, WeaponUsage> = new Map();

    frames.forEach(frame => {
      frame.events.forEach(event => {
        if (event.type === EventType.PLAYER_SHOOT) {
          const weapon = event.data.weapon;

          if (!usage.has(weapon)) {
            usage.set(weapon, {
              weapon,
              usage: 0,
              kills: 0,
              accuracy: 0,
              headshotRate: 0,
            });
          }

          const weaponUsage = usage.get(weapon)!;
          weaponUsage.usage++;

          if (event.data.hit) {
            weaponUsage.accuracy = (weaponUsage.accuracy * (weaponUsage.usage - 1) + 1) / weaponUsage.usage;
          } else {
            weaponUsage.accuracy = (weaponUsage.accuracy * (weaponUsage.usage - 1)) / weaponUsage.usage;
          }

          if (event.data.headshot) {
            weaponUsage.headshotRate = (weaponUsage.headshotRate * (weaponUsage.usage - 1) + 1) / weaponUsage.usage;
          }
        }

        if (event.type === EventType.PLAYER_KILL) {
          const weapon = event.data.weapon;
          if (usage.has(weapon)) {
            usage.get(weapon)!.kills++;
          }
        }
      });
    });

    return Array.from(usage.values());
  }

  private analyzeAbilityUsage(frames: GameFrame[]): AbilityUsage[] {
    const usage: Map<string, AbilityUsage> = new Map();

    frames.forEach(frame => {
      frame.events.forEach(event => {
        if (event.type === EventType.PLAYER_USE_ABILITY) {
          const ability = event.data.ability;

          if (!usage.has(ability)) {
            usage.set(ability, {
              ability,
              uses: 0,
              effectiveness: 0,
              averageCooldown: 0,
            });
          }

          const abilityUsage = usage.get(ability)!;
          abilityUsage.uses++;
          abilityUsage.effectiveness += event.data.effectiveness || 0;
          abilityUsage.averageCooldown = event.data.cooldown || 0;
        }
      });
    });

    return Array.from(usage.values());
  }

  private generateEconomyTimeline(frames: GameFrame[]): EconomySnapshot[] {
    const snapshots: EconomySnapshot[] = [];
    const interval = this.frameRate * 30; // Every 30 seconds

    for (let i = 0; i < frames.length; i += interval) {
      const frame = frames[i];

      // Calculate team economies (simplified)
      let team1Economy = 0;
      let team2Economy = 0;

      frame.playerStates.forEach((state, playerId) => {
        // Determine team and add to economy
        // This is simplified - in real implementation would track actual economy
        const team = playerId.startsWith('team1') ? 'team1' : 'team2';

        if (team === 'team1') {
          team1Economy += 1000; // Placeholder
        } else {
          team2Economy += 1000; // Placeholder
        }
      });

      snapshots.push({
        timestamp: frame.timestamp,
        team1Economy,
        team2Economy,
        goldDifference: team1Economy - team2Economy,
      });
    }

    return snapshots;
  }

  private detectTeamfights(frames: GameFrame[]): Teamfight[] {
    const teamfights: Teamfight[] = [];
    let currentTeamfight: Teamfight | null = null;

    frames.forEach(frame => {
      const combatEvents = frame.events.filter(e =>
        e.type === EventType.PLAYER_KILL ||
        e.type === EventType.PLAYER_DAMAGE ||
        e.type === EventType.PLAYER_DEATH
      );

      if (combatEvents.length >= 3) {
        // Multiple combat events - potential teamfight
        if (!currentTeamfight) {
          currentTeamfight = {
            startTime: frame.timestamp,
            endTime: frame.timestamp,
            location: { x: 0, y: 0, z: 0 }, // Calculate average position
            participants: [],
            winner: '',
            casualties: { team1: 0, team2: 0 },
          };
        }

        currentTeamfight.endTime = frame.timestamp;

        combatEvents.forEach(event => {
          if (event.playerId && !currentTeamfight!.participants.includes(event.playerId)) {
            currentTeamfight!.participants.push(event.playerId);
          }

          if (event.type === EventType.PLAYER_DEATH) {
            // Track casualties
            const team = event.data.team || 'team1';
            if (team === 'team1') {
              currentTeamfight!.casualties.team1++;
            } else {
              currentTeamfight!.casualties.team2++;
            }
          }
        });
      } else if (currentTeamfight && frame.timestamp - currentTeamfight.endTime > 5000) {
        // No combat for 5 seconds - teamfight ended
        currentTeamfight.winner = currentTeamfight.casualties.team1 < currentTeamfight.casualties.team2
          ? 'team1'
          : 'team2';

        teamfights.push(currentTeamfight);
        currentTeamfight = null;
      }
    });

    return teamfights;
  }

  private identifyKeyMoments(frames: GameFrame[]): KeyMoment[] {
    const keyMoments: KeyMoment[] = [];

    frames.forEach(frame => {
      frame.events.forEach(event => {
        if (event.importance >= 8) {
          keyMoments.push({
            timestamp: frame.timestamp,
            type: event.type,
            description: this.generateEventDescription(event),
            impact: event.importance,
            participants: event.playerId ? [event.playerId] : [],
          });
        }
      });
    });

    return keyMoments.sort((a, b) => b.impact - a.impact).slice(0, 10);
  }

  private generateEventDescription(event: GameEvent): string {
    switch (event.type) {
      case EventType.MULTIKILL:
        return `${event.data.playerName} got ${event.data.kills} kills`;
      case EventType.CLUTCH:
        return `${event.data.playerName} clutched 1v${event.data.enemies}`;
      case EventType.COMEBACK:
        return `Team staged a comeback from ${event.data.deficit} points`;
      case EventType.OBJECTIVE_CAPTURE:
        return `${event.data.team} captured ${event.data.objectiveName}`;
      default:
        return `${event.type} event occurred`;
    }
  }

  async deleteReplay(replayId: string): Promise<void> {
    const filePath = path.join(this.replayDirectory, `${replayId}.replay`);

    try {
      await fs.unlink(filePath);
      this.replays.delete(replayId);

      this.eventEmitter.emit('replay.deleted', { replayId });
      this.logger.log(`Deleted replay ${replayId}`);
    } catch (error) {
      this.logger.error(`Failed to delete replay ${replayId}`, error);
      throw new NotFoundException('Replay not found');
    }
  }

  async getPopularReplays(limit: number = 10): Promise<ReplayMetadata[]> {
    const replays = Array.from(this.replays.values());

    return replays
      .sort((a, b) => (b.viewCount * b.rating) - (a.viewCount * a.rating))
      .slice(0, limit);
  }

  async getRecentReplays(limit: number = 10): Promise<ReplayMetadata[]> {
    const replays = Array.from(this.replays.values());

    return replays
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, limit);
  }
}