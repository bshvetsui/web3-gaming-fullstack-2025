export interface PlayerSession {
  playerId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  ip: string;
  hardware: HardwareFingerprint;
  gameVersion: string;
  checksum: string;
  violations: Violation[];
  trustScore: number;
}

export interface HardwareFingerprint {
  cpuId: string;
  gpuId: string;
  motherboardId: string;
  macAddress: string;
  diskSerial: string;
  displayInfo: string;
}

export interface Violation {
  id: string;
  type: ViolationType;
  severity: ViolationSeverity;
  timestamp: Date;
  details: any;
  confidence: number;
  actionTaken: string;
}

export enum ViolationType {
  SPEED_HACK = 'speed_hack',
  WALL_HACK = 'wall_hack',
  AIM_BOT = 'aim_bot',
  ESP_HACK = 'esp_hack',
  TELEPORT = 'teleport',
  RESOURCE_MANIPULATION = 'resource_manipulation',
  PACKET_MANIPULATION = 'packet_manipulation',
  MEMORY_MODIFICATION = 'memory_modification',
  DLL_INJECTION = 'dll_injection',
  MACRO_USAGE = 'macro_usage',
  MULTI_ACCOUNT = 'multi_account',
  SUSPICIOUS_STATS = 'suspicious_stats',
  IMPOSSIBLE_ACTION = 'impossible_action',
  CLIENT_MODIFICATION = 'client_modification',
  NETWORK_LAG_SWITCH = 'network_lag_switch',
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface PlayerMetrics {
  playerId: string;
  accuracy: number;
  headshotRatio: number;
  killDeathRatio: number;
  averageReactionTime: number;
  movementSpeed: number;
  actionsPerMinute: number;
  winRate: number;
  reportCount: number;
  suspiciousPatterns: Pattern[];
}

export interface Pattern {
  type: string;
  occurrences: number;
  lastSeen: Date;
  confidence: number;
  description: string;
}

export interface BehaviorAnalysis {
  playerId: string;
  normalBehavior: NormalBehavior;
  currentBehavior: CurrentBehavior;
  deviationScore: number;
  anomalies: Anomaly[];
}

export interface NormalBehavior {
  averageAccuracy: number;
  averageKD: number;
  averageAPM: number;
  typicalPlayTimes: { start: number; end: number }[];
  preferredWeapons: string[];
  playStyle: PlayStyle;
}

export interface CurrentBehavior {
  sessionAccuracy: number;
  sessionKD: number;
  sessionAPM: number;
  unusualActions: string[];
  performanceSpike: boolean;
}

export enum PlayStyle {
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  BALANCED = 'balanced',
}

export interface Anomaly {
  type: string;
  severity: number;
  description: string;
  timestamp: Date;
  data: any;
}

export interface ReportedPlayer {
  reportId: string;
  reportedPlayerId: string;
  reporterPlayerId: string;
  reason: string;
  description: string;
  evidence: Evidence[];
  timestamp: Date;
  status: ReportStatus;
  resolution?: string;
}

export enum ReportStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE = 'false',
}

export interface Evidence {
  type: EvidenceType;
  url: string;
  timestamp: Date;
  metadata: any;
}

export enum EvidenceType {
  SCREENSHOT = 'screenshot',
  VIDEO = 'video',
  REPLAY = 'replay',
  LOG = 'log',
}

export interface BanRecord {
  banId: string;
  playerId: string;
  type: BanType;
  reason: string;
  startDate: Date;
  endDate?: Date;
  evidence: Evidence[];
  appealable: boolean;
  appealStatus?: AppealStatus;
}

export enum BanType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  HARDWARE = 'hardware',
}

export enum AppealStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
}