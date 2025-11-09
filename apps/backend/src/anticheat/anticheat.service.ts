import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

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
  severity: 'low' | 'medium' | 'high' | 'critical';
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
  playStyle: 'aggressive' | 'defensive' | 'balanced';
}

export interface CurrentBehavior {
  sessionAccuracy: number;
  sessionKD: number;
  sessionAPM: number;
  unusualActions: string[];
  performanceSpike: boolean;
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
  status: 'pending' | 'investigating' | 'resolved' | 'false';
  resolution?: string;
}

export interface Evidence {
  type: 'screenshot' | 'video' | 'replay' | 'log';
  url: string;
  timestamp: Date;
  metadata: any;
}

export interface BanRecord {
  banId: string;
  playerId: string;
  type: 'temporary' | 'permanent' | 'hardware';
  reason: string;
  startDate: Date;
  endDate?: Date;
  evidence: Evidence[];
  appealable: boolean;
  appealStatus?: 'pending' | 'approved' | 'denied';
}

@Injectable()
export class AnticheatService {
  private logger = new Logger('AnticheatService');
  private sessions: Map<string, PlayerSession> = new Map();
  private violations: Map<string, Violation[]> = new Map();
  private playerMetrics: Map<string, PlayerMetrics> = new Map();
  private behaviorProfiles: Map<string, BehaviorAnalysis> = new Map();
  private reports: Map<string, ReportedPlayer[]> = new Map();
  private bans: Map<string, BanRecord> = new Map();
  private hardwareBans: Set<string> = new Set();
  private ipBans: Set<string> = new Set();
  private suspiciousActivities: Map<string, number> = new Map();

  private readonly thresholds = {
    maxAccuracy: 85, // Above this is suspicious
    maxHeadshotRatio: 70, // Above this is suspicious
    maxKD: 10, // Above this is suspicious
    maxAPM: 500, // Above this is suspicious
    minReactionTime: 100, // Below this is suspicious (ms)
    maxSpeed: 150, // Max movement speed units/second
    maxTeleportDistance: 1000, // Max distance for teleport detection
    trustScoreThreshold: 50, // Below this triggers review
    banThreshold: 10, // Violation score for auto-ban
  };

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeAnticheat();
  }

  private initializeAnticheat() {
    // Load banned hardware IDs
    this.hardwareBans.add('BANNED_HW_001');
    this.hardwareBans.add('BANNED_HW_002');

    // Load banned IPs
    this.ipBans.add('1.2.3.4');
    this.ipBans.add('5.6.7.8');

    // Start periodic analysis
    setInterval(() => this.analyzeAllPlayers(), 60000); // Every minute
    setInterval(() => this.performDeepAnalysis(), 300000); // Every 5 minutes

    this.logger.log('Anticheat system initialized');
  }

  async validateSession(data: {
    playerId: string;
    ip: string;
    hardware: HardwareFingerprint;
    gameVersion: string;
    clientChecksum: string;
  }): Promise<{ valid: boolean; reason?: string }> {
    const { playerId, ip, hardware, gameVersion, clientChecksum } = data;

    // Check IP ban
    if (this.ipBans.has(ip)) {
      this.logViolation(playerId, ViolationType.MULTI_ACCOUNT, 'critical', {
        reason: 'Banned IP address',
        ip,
      });
      return { valid: false, reason: 'Banned IP address' };
    }

    // Check hardware ban
    const hardwareId = this.generateHardwareId(hardware);
    if (this.hardwareBans.has(hardwareId)) {
      this.logViolation(playerId, ViolationType.MULTI_ACCOUNT, 'critical', {
        reason: 'Banned hardware',
        hardwareId,
      });
      return { valid: false, reason: 'Banned hardware' };
    }

    // Verify game version
    const latestVersion = '1.2.3'; // Should be from config
    if (gameVersion !== latestVersion) {
      return { valid: false, reason: 'Outdated game version' };
    }

    // Verify client checksum
    const expectedChecksum = this.calculateExpectedChecksum(gameVersion);
    if (clientChecksum !== expectedChecksum) {
      this.logViolation(playerId, ViolationType.CLIENT_MODIFICATION, 'high', {
        reason: 'Modified game client',
        expected: expectedChecksum,
        received: clientChecksum,
      });
      return { valid: false, reason: 'Modified game client detected' };
    }

    // Check for multi-accounting
    const existingSession = this.findSessionByHardware(hardware);
    if (existingSession && existingSession.playerId !== playerId) {
      this.logViolation(playerId, ViolationType.MULTI_ACCOUNT, 'medium', {
        reason: 'Multiple accounts on same hardware',
        otherAccount: existingSession.playerId,
      });
    }

    // Create session
    const session: PlayerSession = {
      playerId,
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
      ip,
      hardware,
      gameVersion,
      checksum: clientChecksum,
      violations: [],
      trustScore: 100,
    };

    this.sessions.set(playerId, session);

    return { valid: true };
  }

  async validatePlayerAction(data: {
    playerId: string;
    action: string;
    position: { x: number; y: number; z: number };
    timestamp: number;
    metadata: any;
  }): Promise<{ valid: boolean; violation?: Violation }> {
    const { playerId, action, position, timestamp, metadata } = data;

    const session = this.sessions.get(playerId);
    if (!session) {
      return { valid: false };
    }

    const metrics = this.playerMetrics.get(playerId) || this.createDefaultMetrics(playerId);

    // Check for speed hacking
    const lastPosition = metadata.lastPosition;
    if (lastPosition) {
      const distance = this.calculateDistance(lastPosition, position);
      const timeDelta = timestamp - (metadata.lastTimestamp || 0);
      const speed = distance / (timeDelta / 1000);

      if (speed > this.thresholds.maxSpeed) {
        const violation = this.createViolation(
          ViolationType.SPEED_HACK,
          'high',
          {
            speed,
            maxAllowed: this.thresholds.maxSpeed,
            position,
          },
          0.9
        );

        this.addViolation(playerId, violation);
        return { valid: false, violation };
      }

      // Check for teleportation
      if (distance > this.thresholds.maxTeleportDistance && timeDelta < 1000) {
        const violation = this.createViolation(
          ViolationType.TELEPORT,
          'critical',
          {
            distance,
            timeDelta,
            fromPosition: lastPosition,
            toPosition: position,
          },
          0.95
        );

        this.addViolation(playerId, violation);
        return { valid: false, violation };
      }
    }

    // Check for aim bot patterns
    if (action === 'shoot') {
      const accuracy = metadata.hits / metadata.shots;
      const headshotRatio = metadata.headshots / metadata.hits;

      if (accuracy > this.thresholds.maxAccuracy / 100) {
        metrics.suspiciousPatterns.push({
          type: 'high_accuracy',
          occurrences: 1,
          lastSeen: new Date(),
          confidence: accuracy,
          description: `Abnormally high accuracy: ${accuracy * 100}%`,
        });
      }

      if (headshotRatio > this.thresholds.maxHeadshotRatio / 100) {
        const violation = this.createViolation(
          ViolationType.AIM_BOT,
          'medium',
          {
            headshotRatio,
            threshold: this.thresholds.maxHeadshotRatio,
          },
          0.7
        );

        this.addViolation(playerId, violation);
      }

      // Check reaction time
      if (metadata.reactionTime < this.thresholds.minReactionTime) {
        const violation = this.createViolation(
          ViolationType.AIM_BOT,
          'high',
          {
            reactionTime: metadata.reactionTime,
            minHuman: this.thresholds.minReactionTime,
          },
          0.85
        );

        this.addViolation(playerId, violation);
      }
    }

    // Check for resource manipulation
    if (action === 'resource_change') {
      const changeAmount = metadata.newAmount - metadata.oldAmount;
      const maxAllowedChange = metadata.maxChange || 100;

      if (Math.abs(changeAmount) > maxAllowedChange) {
        const violation = this.createViolation(
          ViolationType.RESOURCE_MANIPULATION,
          'critical',
          {
            resource: metadata.resource,
            oldAmount: metadata.oldAmount,
            newAmount: metadata.newAmount,
            maxAllowed: maxAllowedChange,
          },
          0.95
        );

        this.addViolation(playerId, violation);
        return { valid: false, violation };
      }
    }

    // Check for impossible actions
    if (action === 'wall_shot' && metadata.throughWall) {
      const violation = this.createViolation(
        ViolationType.WALL_HACK,
        'high',
        {
          position,
          targetPosition: metadata.targetPosition,
          wallThickness: metadata.wallThickness,
        },
        0.8
      );

      this.addViolation(playerId, violation);
      return { valid: false, violation };
    }

    // Update metrics
    this.updatePlayerMetrics(playerId, action, metadata);

    return { valid: true };
  }

  async reportPlayer(data: {
    reportedPlayerId: string;
    reporterPlayerId: string;
    reason: string;
    description: string;
    evidence?: Evidence[];
  }): Promise<ReportedPlayer> {
    const report: ReportedPlayer = {
      reportId: crypto.randomUUID(),
      reportedPlayerId: data.reportedPlayerId,
      reporterPlayerId: data.reporterPlayerId,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence || [],
      timestamp: new Date(),
      status: 'pending',
    };

    const playerReports = this.reports.get(data.reportedPlayerId) || [];
    playerReports.push(report);
    this.reports.set(data.reportedPlayerId, playerReports);

    // Increase suspicion score
    const currentSuspicion = this.suspiciousActivities.get(data.reportedPlayerId) || 0;
    this.suspiciousActivities.set(data.reportedPlayerId, currentSuspicion + 1);

    // Auto-investigate if multiple reports
    if (playerReports.length >= 3) {
      this.investigatePlayer(data.reportedPlayerId);
    }

    this.eventEmitter.emit('anticheat.report.created', {
      reportId: report.reportId,
      reportedPlayer: data.reportedPlayerId,
    });

    return report;
  }

  private async investigatePlayer(playerId: string) {
    this.logger.log(`Investigating player ${playerId}`);

    const metrics = this.playerMetrics.get(playerId);
    const violations = this.violations.get(playerId) || [];
    const reports = this.reports.get(playerId) || [];
    const session = this.sessions.get(playerId);

    let suspicionScore = 0;

    // Analyze metrics
    if (metrics) {
      if (metrics.accuracy > this.thresholds.maxAccuracy) {
        suspicionScore += 3;
      }
      if (metrics.headshotRatio > this.thresholds.maxHeadshotRatio) {
        suspicionScore += 3;
      }
      if (metrics.killDeathRatio > this.thresholds.maxKD) {
        suspicionScore += 2;
      }
      if (metrics.averageReactionTime < this.thresholds.minReactionTime) {
        suspicionScore += 4;
      }
    }

    // Count violations
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'low':
          suspicionScore += 1;
          break;
        case 'medium':
          suspicionScore += 2;
          break;
        case 'high':
          suspicionScore += 4;
          break;
        case 'critical':
          suspicionScore += 8;
          break;
      }
    });

    // Count reports
    suspicionScore += reports.filter(r => r.status === 'pending').length;

    // Take action based on score
    if (suspicionScore >= this.thresholds.banThreshold) {
      this.banPlayer(playerId, 'Automatic ban: Multiple violations detected', 'temporary');
    } else if (suspicionScore >= 5) {
      this.flagForManualReview(playerId);
    }

    // Update trust score
    if (session) {
      session.trustScore = Math.max(0, 100 - suspicionScore * 10);
    }

    this.eventEmitter.emit('anticheat.investigation.complete', {
      playerId,
      suspicionScore,
      action: suspicionScore >= this.thresholds.banThreshold ? 'banned' : 'flagged',
    });
  }

  private async banPlayer(
    playerId: string,
    reason: string,
    type: 'temporary' | 'permanent' | 'hardware'
  ) {
    const session = this.sessions.get(playerId);
    const violations = this.violations.get(playerId) || [];

    const ban: BanRecord = {
      banId: crypto.randomUUID(),
      playerId,
      type,
      reason,
      startDate: new Date(),
      endDate: type === 'temporary' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      evidence: violations.map(v => ({
        type: 'log' as const,
        url: '',
        timestamp: v.timestamp,
        metadata: v.details,
      })),
      appealable: type !== 'permanent',
    };

    this.bans.set(playerId, ban);

    // Add hardware ban if needed
    if (type === 'hardware' && session) {
      const hardwareId = this.generateHardwareId(session.hardware);
      this.hardwareBans.add(hardwareId);
    }

    // Disconnect player
    this.eventEmitter.emit('anticheat.player.banned', {
      playerId,
      banId: ban.banId,
      type,
      reason,
    });

    this.logger.warn(`Player ${playerId} banned: ${reason}`);
  }

  private flagForManualReview(playerId: string) {
    this.eventEmitter.emit('anticheat.manual.review', {
      playerId,
      violations: this.violations.get(playerId),
      reports: this.reports.get(playerId),
      metrics: this.playerMetrics.get(playerId),
    });

    this.logger.log(`Player ${playerId} flagged for manual review`);
  }

  private analyzeAllPlayers() {
    this.sessions.forEach((session, playerId) => {
      const metrics = this.playerMetrics.get(playerId);
      if (metrics) {
        this.analyzeBehavior(playerId, metrics);
      }
    });
  }

  private performDeepAnalysis() {
    // Perform statistical analysis across all players
    const allMetrics = Array.from(this.playerMetrics.values());

    if (allMetrics.length < 10) return;

    const avgAccuracy = allMetrics.reduce((sum, m) => sum + m.accuracy, 0) / allMetrics.length;
    const stdDevAccuracy = this.calculateStandardDeviation(allMetrics.map(m => m.accuracy));

    // Flag outliers
    allMetrics.forEach(metrics => {
      const zScore = Math.abs((metrics.accuracy - avgAccuracy) / stdDevAccuracy);

      if (zScore > 3) {
        // Player is 3+ standard deviations from mean
        this.suspiciousActivities.set(
          metrics.playerId,
          (this.suspiciousActivities.get(metrics.playerId) || 0) + 1
        );

        metrics.suspiciousPatterns.push({
          type: 'statistical_outlier',
          occurrences: 1,
          lastSeen: new Date(),
          confidence: zScore / 4, // Normalize to 0-1
          description: `Player is ${zScore.toFixed(1)} standard deviations from average`,
        });
      }
    });
  }

  private analyzeBehavior(playerId: string, metrics: PlayerMetrics) {
    let analysis = this.behaviorProfiles.get(playerId);

    if (!analysis) {
      // Create baseline
      analysis = {
        playerId,
        normalBehavior: {
          averageAccuracy: metrics.accuracy,
          averageKD: metrics.killDeathRatio,
          averageAPM: metrics.actionsPerMinute,
          typicalPlayTimes: [],
          preferredWeapons: [],
          playStyle: 'balanced',
        },
        currentBehavior: {
          sessionAccuracy: metrics.accuracy,
          sessionKD: metrics.killDeathRatio,
          sessionAPM: metrics.actionsPerMinute,
          unusualActions: [],
          performanceSpike: false,
        },
        deviationScore: 0,
        anomalies: [],
      };

      this.behaviorProfiles.set(playerId, analysis);
    } else {
      // Compare current to baseline
      const accDiff = Math.abs(metrics.accuracy - analysis.normalBehavior.averageAccuracy);
      const kdDiff = Math.abs(metrics.killDeathRatio - analysis.normalBehavior.averageKD);
      const apmDiff = Math.abs(metrics.actionsPerMinute - analysis.normalBehavior.averageAPM);

      // Check for sudden improvement
      if (metrics.accuracy > analysis.normalBehavior.averageAccuracy * 1.5) {
        analysis.anomalies.push({
          type: 'performance_spike',
          severity: 7,
          description: 'Sudden accuracy improvement',
          timestamp: new Date(),
          data: { oldAccuracy: analysis.normalBehavior.averageAccuracy, newAccuracy: metrics.accuracy },
        });
        analysis.currentBehavior.performanceSpike = true;
      }

      // Update deviation score
      analysis.deviationScore = (accDiff * 0.4 + kdDiff * 0.3 + apmDiff * 0.3) * 10;

      // Update baseline with weighted average
      analysis.normalBehavior.averageAccuracy = analysis.normalBehavior.averageAccuracy * 0.9 + metrics.accuracy * 0.1;
      analysis.normalBehavior.averageKD = analysis.normalBehavior.averageKD * 0.9 + metrics.killDeathRatio * 0.1;
      analysis.normalBehavior.averageAPM = analysis.normalBehavior.averageAPM * 0.9 + metrics.actionsPerMinute * 0.1;
    }
  }

  private createViolation(
    type: ViolationType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any,
    confidence: number
  ): Violation {
    return {
      id: crypto.randomUUID(),
      type,
      severity,
      timestamp: new Date(),
      details,
      confidence,
      actionTaken: this.determineAction(severity),
    };
  }

  private determineAction(severity: string): string {
    switch (severity) {
      case 'low':
        return 'logged';
      case 'medium':
        return 'warned';
      case 'high':
        return 'kicked';
      case 'critical':
        return 'banned';
      default:
        return 'none';
    }
  }

  private addViolation(playerId: string, violation: Violation) {
    const violations = this.violations.get(playerId) || [];
    violations.push(violation);
    this.violations.set(playerId, violations);

    const session = this.sessions.get(playerId);
    if (session) {
      session.violations.push(violation);
      const penalty =
        violation.severity === 'critical'
          ? 50
          : violation.severity === 'high'
            ? 20
            : violation.severity === 'medium'
              ? 10
              : 5;

      session.trustScore = Math.max(0, session.trustScore - penalty);
    }

    this.eventEmitter.emit('anticheat.violation.detected', {
      playerId,
      violation,
    });
  }

  private logViolation(
    playerId: string,
    type: ViolationType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ) {
    const violation = this.createViolation(type, severity, details, 1.0);
    this.addViolation(playerId, violation);
  }

  private updatePlayerMetrics(playerId: string, action: string, metadata: any) {
    let metrics = this.playerMetrics.get(playerId);

    if (!metrics) {
      metrics = this.createDefaultMetrics(playerId);
      this.playerMetrics.set(playerId, metrics);
    }

    // Update based on action
    if (action === 'shoot') {
      const accuracy = metadata.hits / metadata.shots;
      metrics.accuracy = metrics.accuracy * 0.9 + accuracy * 0.1; // Weighted average
      metrics.headshotRatio = metrics.headshotRatio * 0.9 + (metadata.headshots / metadata.hits) * 0.1;
    }

    if (action === 'kill') {
      metrics.killDeathRatio = metadata.kills / Math.max(1, metadata.deaths);
    }

    if (action === 'input') {
      metrics.actionsPerMinute = metadata.apm;
      metrics.averageReactionTime = metrics.averageReactionTime * 0.9 + metadata.reactionTime * 0.1;
    }

    if (action === 'move') {
      metrics.movementSpeed = metadata.speed;
    }
  }

  private createDefaultMetrics(playerId: string): PlayerMetrics {
    return {
      playerId,
      accuracy: 0,
      headshotRatio: 0,
      killDeathRatio: 0,
      averageReactionTime: 200,
      movementSpeed: 0,
      actionsPerMinute: 0,
      winRate: 0,
      reportCount: 0,
      suspiciousPatterns: [],
    };
  }

  private generateHardwareId(hardware: HardwareFingerprint): string {
    const data = `${hardware.cpuId}:${hardware.gpuId}:${hardware.motherboardId}:${hardware.macAddress}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private calculateExpectedChecksum(version: string): string {
    // In production, this would be a real checksum
    return crypto.createHash('md5').update(`game-client-${version}`).digest('hex');
  }

  private calculateDistance(pos1: any, pos2: any): number {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) +
      Math.pow(pos2.y - pos1.y, 2) +
      Math.pow(pos2.z - pos1.z, 2)
    );
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private findSessionByHardware(hardware: HardwareFingerprint): PlayerSession | undefined {
    const hardwareId = this.generateHardwareId(hardware);

    for (const session of this.sessions.values()) {
      if (this.generateHardwareId(session.hardware) === hardwareId) {
        return session;
      }
    }

    return undefined;
  }

  async getPlayerTrustScore(playerId: string): Promise<number> {
    const session = this.sessions.get(playerId);
    return session ? session.trustScore : 100;
  }

  async getPlayerViolations(playerId: string): Promise<Violation[]> {
    return this.violations.get(playerId) || [];
  }

  async appealBan(playerId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const ban = this.bans.get(playerId);

    if (!ban) {
      return { success: false, message: 'No ban record found' };
    }

    if (!ban.appealable) {
      return { success: false, message: 'This ban cannot be appealed' };
    }

    if (ban.appealStatus === 'pending') {
      return { success: false, message: 'Appeal already pending' };
    }

    ban.appealStatus = 'pending';

    this.eventEmitter.emit('anticheat.appeal.submitted', {
      playerId,
      banId: ban.banId,
      reason,
    });

    return { success: true, message: 'Appeal submitted for review' };
  }
}
