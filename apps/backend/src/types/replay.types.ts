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
  importance: number;
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
  score: TeamScore;
}

export interface TeamScore {
  team1: number;
  team2: number;
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
  status: ObjectiveStatus;
  controllingTeam?: string;
  captureProgress: number;
}

export enum ObjectiveStatus {
  NEUTRAL = 'neutral',
  CAPTURED = 'captured',
  CONTESTED = 'contested',
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
  type: HighlightType;
  playerId: string;
  timestamp: number;
  frameStart: number;
  frameEnd: number;
  description: string;
  importance: number;
}

export enum HighlightType {
  MULTIKILL = 'multikill',
  ACE = 'ace',
  CLUTCH = 'clutch',
  COMEBACK = 'comeback',
  PERFECT_ROUND = 'perfect_round',
  LONG_RANGE = 'long_range',
  QUICK_SCOPE = 'quick_scope',
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