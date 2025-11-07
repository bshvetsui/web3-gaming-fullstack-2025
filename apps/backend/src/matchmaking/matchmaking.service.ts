import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Player {
  id: string;
  username: string;
  rating: number;
  level: number;
  wins: number;
  losses: number;
  winRate: number;
  preferredMode: string;
  region: string;
  latency: number;
  partyId?: string;
  guildId?: string;
  premiumTier: number;
}

export interface MatchmakingQueue {
  id: string;
  mode: GameMode;
  players: QueuedPlayer[];
  maxPlayers: number;
  minPlayers: number;
  averageWaitTime: number;
  estimatedWaitTime: Map<string, number>;
  priorityQueue: QueuedPlayer[];
  normalQueue: QueuedPlayer[];
}

export interface QueuedPlayer extends Player {
  queueTime: Date;
  priority: number;
  acceptableRatingRange: { min: number; max: number };
  searchExpansionRate: number;
  attemptedMatches: string[];
  declined: number;
}

export interface GameMode {
  id: string;
  name: string;
  teamSize: number;
  maxPlayers: number;
  minPlayers: number;
  ranked: boolean;
  ratingEnabled: boolean;
  requirements: {
    minLevel: number;
    minRating?: number;
    maxRating?: number;
  };
  mapPool: string[];
  timeLimit: number;
  respawns: boolean;
}

export interface Match {
  id: string;
  mode: string;
  status: 'pending' | 'ready' | 'in-progress' | 'completed' | 'cancelled';
  teams: Team[];
  map: string;
  server: GameServer;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  averageRating: number;
  ratingSpread: number;
  fairnessScore: number;
}

export interface Team {
  id: string;
  players: Player[];
  averageRating: number;
  totalRating: number;
  side: 'team1' | 'team2';
}

export interface GameServer {
  id: string;
  name: string;
  region: string;
  ip: string;
  port: number;
  currentPlayers: number;
  maxPlayers: number;
  status: 'online' | 'offline' | 'maintenance';
  latency: Map<string, number>;
  load: number;
}

export interface MatchmakingSettings {
  maxRatingDifference: number;
  expansionRate: number; // How fast to expand search range
  maxWaitTime: number;
  partyBonus: number; // Bonus for playing in party
  guildBonus: number; // Bonus for guild members
  premiumPriorityMultiplier: number;
  balanceThreshold: number; // Max allowed team rating difference
  regionLock: boolean;
  crossPlayEnabled: boolean;
}

@Injectable()
export class MatchmakingService {
  private logger = new Logger('MatchmakingService');
  private queues: Map<string, MatchmakingQueue> = new Map();
  private activeMatches: Map<string, Match> = new Map();
  private playerQueues: Map<string, string> = new Map(); // playerId -> queueId
  private servers: Map<string, GameServer> = new Map();
  private matchmakingInterval: NodeJS.Timer;

  private settings: MatchmakingSettings = {
    maxRatingDifference: 200,
    expansionRate: 50,
    maxWaitTime: 300000, // 5 minutes
    partyBonus: 50,
    guildBonus: 25,
    premiumPriorityMultiplier: 1.5,
    balanceThreshold: 100,
    regionLock: false,
    crossPlayEnabled: true,
  };

  private gameModes: GameMode[] = [
    {
      id: 'ranked-solo',
      name: 'Ranked Solo',
      teamSize: 1,
      maxPlayers: 10,
      minPlayers: 10,
      ranked: true,
      ratingEnabled: true,
      requirements: { minLevel: 20 },
      mapPool: ['arena1', 'arena2', 'arena3'],
      timeLimit: 600,
      respawns: false,
    },
    {
      id: 'ranked-duo',
      name: 'Ranked Duo',
      teamSize: 2,
      maxPlayers: 20,
      minPlayers: 20,
      ranked: true,
      ratingEnabled: true,
      requirements: { minLevel: 20 },
      mapPool: ['duo_map1', 'duo_map2'],
      timeLimit: 900,
      respawns: false,
    },
    {
      id: 'ranked-squad',
      name: 'Ranked Squad',
      teamSize: 4,
      maxPlayers: 20,
      minPlayers: 20,
      ranked: true,
      ratingEnabled: true,
      requirements: { minLevel: 25 },
      mapPool: ['squad_map1', 'squad_map2', 'squad_map3'],
      timeLimit: 1200,
      respawns: false,
    },
    {
      id: 'casual',
      name: 'Casual',
      teamSize: 5,
      maxPlayers: 10,
      minPlayers: 10,
      ranked: false,
      ratingEnabled: false,
      requirements: { minLevel: 1 },
      mapPool: ['casual_map1', 'casual_map2', 'casual_map3', 'casual_map4'],
      timeLimit: 600,
      respawns: true,
    },
    {
      id: 'arena-5v5',
      name: 'Arena 5v5',
      teamSize: 5,
      maxPlayers: 10,
      minPlayers: 10,
      ranked: true,
      ratingEnabled: true,
      requirements: { minLevel: 30, minRating: 1000 },
      mapPool: ['arena_5v5_1', 'arena_5v5_2'],
      timeLimit: 1800,
      respawns: false,
    },
  ];

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeQueues();
    this.initializeServers();
    this.startMatchmakingLoop();
  }

  private initializeQueues() {
    this.gameModes.forEach(mode => {
      const queue: MatchmakingQueue = {
        id: mode.id,
        mode,
        players: [],
        maxPlayers: mode.maxPlayers,
        minPlayers: mode.minPlayers,
        averageWaitTime: 0,
        estimatedWaitTime: new Map(),
        priorityQueue: [],
        normalQueue: [],
      };

      this.queues.set(mode.id, queue);
    });
  }

  private initializeServers() {
    const regions = ['NA', 'EU', 'ASIA', 'SA'];
    let serverId = 0;

    regions.forEach(region => {
      for (let i = 0; i < 3; i++) {
        const server: GameServer = {
          id: `server-${serverId++}`,
          name: `${region}-${i + 1}`,
          region,
          ip: `10.0.${serverId}.1`,
          port: 7777 + i,
          currentPlayers: 0,
          maxPlayers: 100,
          status: 'online',
          latency: new Map(),
          load: Math.random() * 0.5, // Random initial load
        };

        this.servers.set(server.id, server);
      }
    });
  }

  private startMatchmakingLoop() {
    this.matchmakingInterval = setInterval(() => {
      this.queues.forEach(queue => {
        this.processQueue(queue);
      });
    }, 1000); // Process every second
  }

  async joinQueue(player: Player, modeId: string): Promise<{ success: boolean; estimatedWait?: number; error?: string }> {
    const queue = this.queues.get(modeId);

    if (!queue) {
      return { success: false, error: 'Invalid game mode' };
    }

    // Check if player meets requirements
    const mode = queue.mode;
    if (player.level < mode.requirements.minLevel) {
      return { success: false, error: `Minimum level ${mode.requirements.minLevel} required` };
    }

    if (mode.requirements.minRating && player.rating < mode.requirements.minRating) {
      return { success: false, error: `Minimum rating ${mode.requirements.minRating} required` };
    }

    // Check if already in queue
    if (this.playerQueues.has(player.id)) {
      return { success: false, error: 'Already in queue' };
    }

    // Create queued player
    const queuedPlayer: QueuedPlayer = {
      ...player,
      queueTime: new Date(),
      priority: this.calculatePriority(player),
      acceptableRatingRange: {
        min: player.rating - this.settings.maxRatingDifference,
        max: player.rating + this.settings.maxRatingDifference,
      },
      searchExpansionRate: this.settings.expansionRate,
      attemptedMatches: [],
      declined: 0,
    };

    // Add to appropriate queue based on priority
    if (queuedPlayer.priority > 1) {
      queue.priorityQueue.push(queuedPlayer);
    } else {
      queue.normalQueue.push(queuedPlayer);
    }

    queue.players.push(queuedPlayer);
    this.playerQueues.set(player.id, modeId);

    // Calculate estimated wait time
    const estimatedWait = this.calculateEstimatedWaitTime(queue, queuedPlayer);
    queue.estimatedWaitTime.set(player.id, estimatedWait);

    this.eventEmitter.emit('matchmaking.joined', {
      playerId: player.id,
      mode: modeId,
      estimatedWait,
    });

    this.logger.log(`Player ${player.username} joined queue ${modeId}`);

    return { success: true, estimatedWait };
  }

  async leaveQueue(playerId: string): Promise<{ success: boolean }> {
    const queueId = this.playerQueues.get(playerId);

    if (!queueId) {
      return { success: false };
    }

    const queue = this.queues.get(queueId);
    if (queue) {
      queue.players = queue.players.filter(p => p.id !== playerId);
      queue.priorityQueue = queue.priorityQueue.filter(p => p.id !== playerId);
      queue.normalQueue = queue.normalQueue.filter(p => p.id !== playerId);
      queue.estimatedWaitTime.delete(playerId);
    }

    this.playerQueues.delete(playerId);

    this.eventEmitter.emit('matchmaking.left', { playerId, mode: queueId });

    return { success: true };
  }

  private processQueue(queue: MatchmakingQueue) {
    // Combine priority and normal queues
    const allPlayers = [...queue.priorityQueue, ...queue.normalQueue];

    if (allPlayers.length < queue.minPlayers) {
      return;
    }

    // Expand search ranges based on wait time
    allPlayers.forEach(player => {
      const waitTime = Date.now() - player.queueTime.getTime();
      const expansions = Math.floor(waitTime / 10000); // Expand every 10 seconds

      player.acceptableRatingRange.min = player.rating - (this.settings.maxRatingDifference + expansions * player.searchExpansionRate);
      player.acceptableRatingRange.max = player.rating + (this.settings.maxRatingDifference + expansions * player.searchExpansionRate);
    });

    // Try to create matches
    if (queue.mode.teamSize === 1) {
      this.createSoloMatch(queue, allPlayers);
    } else {
      this.createTeamMatch(queue, allPlayers);
    }
  }

  private createSoloMatch(queue: MatchmakingQueue, players: QueuedPlayer[]) {
    if (players.length < queue.maxPlayers) {
      return;
    }

    // Sort by rating for fair matching
    const sortedPlayers = [...players].sort((a, b) => a.rating - b.rating);

    // Find compatible players
    const matchPlayers: QueuedPlayer[] = [];
    const usedPlayers = new Set<string>();

    for (const player of sortedPlayers) {
      if (usedPlayers.has(player.id)) continue;

      const compatiblePlayers = sortedPlayers.filter(p => {
        if (p.id === player.id || usedPlayers.has(p.id)) return false;

        return p.rating >= player.acceptableRatingRange.min &&
               p.rating <= player.acceptableRatingRange.max &&
               this.arePlayersCompatible(player, p);
      });

      if (compatiblePlayers.length >= queue.maxPlayers - 1) {
        matchPlayers.push(player);
        usedPlayers.add(player.id);

        for (let i = 0; i < queue.maxPlayers - 1 && i < compatiblePlayers.length; i++) {
          matchPlayers.push(compatiblePlayers[i]);
          usedPlayers.add(compatiblePlayers[i].id);
        }

        if (matchPlayers.length === queue.maxPlayers) {
          this.createMatch(queue, matchPlayers);
          return;
        }
      }
    }
  }

  private createTeamMatch(queue: MatchmakingQueue, players: QueuedPlayer[]) {
    const teamSize = queue.mode.teamSize;
    const numTeams = Math.floor(queue.maxPlayers / teamSize);

    if (players.length < queue.maxPlayers) {
      return;
    }

    // Group players by party
    const parties = new Map<string, QueuedPlayer[]>();
    const soloPlayers: QueuedPlayer[] = [];

    players.forEach(player => {
      if (player.partyId) {
        if (!parties.has(player.partyId)) {
          parties.set(player.partyId, []);
        }
        parties.get(player.partyId)!.push(player);
      } else {
        soloPlayers.push(player);
      }
    });

    // Try to create balanced teams
    const teams: QueuedPlayer[][] = [];

    // First, place parties
    parties.forEach(party => {
      if (party.length <= teamSize) {
        teams.push(party);
      }
    });

    // Then fill with solo players
    soloPlayers.sort((a, b) => b.rating - a.rating);

    for (const player of soloPlayers) {
      // Find team with lowest average rating that has space
      let bestTeam: QueuedPlayer[] | null = null;
      let lowestRating = Infinity;

      for (const team of teams) {
        if (team.length < teamSize) {
          const avgRating = team.reduce((sum, p) => sum + p.rating, 0) / team.length;
          if (avgRating < lowestRating) {
            lowestRating = avgRating;
            bestTeam = team;
          }
        }
      }

      if (bestTeam) {
        bestTeam.push(player);
      } else if (teams.length < numTeams) {
        teams.push([player]);
      }
    }

    // Check if we have enough complete teams
    const completeTeams = teams.filter(team => team.length === teamSize);

    if (completeTeams.length === numTeams) {
      const matchPlayers = completeTeams.flat();
      const fairness = this.calculateMatchFairness(completeTeams);

      if (fairness >= 0.7) {
        this.createMatch(queue, matchPlayers);
      }
    }
  }

  private createMatch(queue: MatchmakingQueue, players: QueuedPlayer[]) {
    // Select best server
    const server = this.selectBestServer(players);

    if (!server) {
      this.logger.warn('No available server for match');
      return;
    }

    // Create teams
    const teams = this.createBalancedTeams(players, queue.mode.teamSize);

    // Create match
    const match: Match = {
      id: `match-${Date.now()}`,
      mode: queue.mode.id,
      status: 'pending',
      teams: teams.map((teamPlayers, index) => ({
        id: `team-${index}`,
        players: teamPlayers.map(qp => ({
          id: qp.id,
          username: qp.username,
          rating: qp.rating,
          level: qp.level,
          wins: qp.wins,
          losses: qp.losses,
          winRate: qp.winRate,
          preferredMode: qp.preferredMode,
          region: qp.region,
          latency: qp.latency,
          partyId: qp.partyId,
          guildId: qp.guildId,
          premiumTier: qp.premiumTier,
        })),
        averageRating: teamPlayers.reduce((sum, p) => sum + p.rating, 0) / teamPlayers.length,
        totalRating: teamPlayers.reduce((sum, p) => sum + p.rating, 0),
        side: index === 0 ? 'team1' : 'team2',
      })),
      map: this.selectRandomMap(queue.mode.mapPool),
      server,
      createdAt: new Date(),
      averageRating: players.reduce((sum, p) => sum + p.rating, 0) / players.length,
      ratingSpread: Math.max(...players.map(p => p.rating)) - Math.min(...players.map(p => p.rating)),
      fairnessScore: this.calculateMatchFairness(teams),
    };

    this.activeMatches.set(match.id, match);

    // Remove players from queue
    players.forEach(player => {
      this.playerQueues.delete(player.id);
      const index = queue.players.findIndex(p => p.id === player.id);
      if (index !== -1) {
        queue.players.splice(index, 1);
      }
    });

    queue.priorityQueue = queue.priorityQueue.filter(p => !players.some(mp => mp.id === p.id));
    queue.normalQueue = queue.normalQueue.filter(p => !players.some(mp => mp.id === p.id));

    // Update average wait time
    const totalWaitTime = players.reduce((sum, p) => sum + (Date.now() - p.queueTime.getTime()), 0);
    queue.averageWaitTime = totalWaitTime / players.length;

    // Notify players
    players.forEach(player => {
      this.eventEmitter.emit('matchmaking.match.found', {
        playerId: player.id,
        matchId: match.id,
        mode: queue.mode.id,
        map: match.map,
        server: server.name,
      });
    });

    this.logger.log(`Match created: ${match.id} with ${players.length} players`);

    // Start match confirmation phase
    this.startMatchConfirmation(match);
  }

  private startMatchConfirmation(match: Match) {
    const confirmations = new Map<string, boolean>();
    const allPlayers = match.teams.flatMap(t => t.players);

    allPlayers.forEach(player => {
      confirmations.set(player.id, false);
    });

    // Give players 30 seconds to confirm
    setTimeout(() => {
      const confirmed = Array.from(confirmations.values()).filter(c => c).length;

      if (confirmed === allPlayers.length) {
        match.status = 'ready';
        this.startMatch(match);
      } else {
        match.status = 'cancelled';

        // Punish players who didn't confirm
        allPlayers.forEach(player => {
          if (!confirmations.get(player.id)) {
            this.eventEmitter.emit('matchmaking.penalty', {
              playerId: player.id,
              reason: 'no_confirmation',
              duration: 300000, // 5 minute penalty
            });
          }
        });

        // Return confirmed players to queue
        allPlayers.forEach(player => {
          if (confirmations.get(player.id)) {
            this.joinQueue(player, match.mode);
          }
        });
      }
    }, 30000);
  }

  private startMatch(match: Match) {
    match.status = 'in-progress';
    match.startedAt = new Date();

    // Update server
    const server = this.servers.get(match.server.id);
    if (server) {
      server.currentPlayers += match.teams.reduce((sum, t) => sum + t.players.length, 0);
      server.load = server.currentPlayers / server.maxPlayers;
    }

    this.eventEmitter.emit('match.started', {
      matchId: match.id,
      teams: match.teams,
      map: match.map,
      server: match.server,
    });

    this.logger.log(`Match ${match.id} started`);
  }

  private calculatePriority(player: Player): number {
    let priority = 1;

    // Premium players get priority
    priority += player.premiumTier * this.settings.premiumPriorityMultiplier;

    // Guild members get small bonus
    if (player.guildId) {
      priority += 0.25;
    }

    // Party bonus
    if (player.partyId) {
      priority += 0.5;
    }

    return priority;
  }

  private calculateEstimatedWaitTime(queue: MatchmakingQueue, player: QueuedPlayer): number {
    // Base on average wait time
    let estimated = queue.averageWaitTime;

    // Adjust based on rating (extreme ratings wait longer)
    const avgRating = queue.players.reduce((sum, p) => sum + p.rating, 0) / queue.players.length || 1500;
    const ratingDiff = Math.abs(player.rating - avgRating);
    estimated += ratingDiff * 10; // 10ms per rating point difference

    // Adjust based on priority
    estimated = estimated / player.priority;

    // Adjust based on current queue size
    const queueRatio = queue.players.length / queue.maxPlayers;
    if (queueRatio < 0.5) {
      estimated *= 2; // Longer wait when queue is empty
    } else if (queueRatio > 1.5) {
      estimated *= 0.5; // Shorter wait when queue is full
    }

    return Math.max(5000, Math.min(estimated, this.settings.maxWaitTime));
  }

  private arePlayersCompatible(player1: QueuedPlayer, player2: QueuedPlayer): boolean {
    // Check region compatibility
    if (!this.settings.crossPlayEnabled && player1.region !== player2.region) {
      return false;
    }

    // Check if they've declined matches together recently
    if (player1.attemptedMatches.includes(player2.id) || player2.attemptedMatches.includes(player1.id)) {
      return false;
    }

    // Check latency difference
    const latencyDiff = Math.abs(player1.latency - player2.latency);
    if (latencyDiff > 100) {
      return false;
    }

    return true;
  }

  private createBalancedTeams(players: QueuedPlayer[], teamSize: number): QueuedPlayer[][] {
    if (teamSize === 1) {
      return players.map(p => [p]);
    }

    const teams: QueuedPlayer[][] = [];
    const numTeams = Math.floor(players.length / teamSize);

    // Sort players by rating
    const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);

    // Snake draft for balance
    for (let i = 0; i < numTeams; i++) {
      teams.push([]);
    }

    let teamIndex = 0;
    let direction = 1;

    for (const player of sortedPlayers) {
      teams[teamIndex].push(player);

      teamIndex += direction;
      if (teamIndex === numTeams || teamIndex === -1) {
        direction *= -1;
        teamIndex += direction;
      }
    }

    return teams;
  }

  private calculateMatchFairness(teams: QueuedPlayer[][]): number {
    const teamRatings = teams.map(team =>
      team.reduce((sum, p) => sum + p.rating, 0) / team.length
    );

    const maxRating = Math.max(...teamRatings);
    const minRating = Math.min(...teamRatings);
    const diff = maxRating - minRating;

    // Convert to 0-1 scale where 1 is perfectly fair
    return Math.max(0, 1 - (diff / this.settings.balanceThreshold));
  }

  private selectBestServer(players: QueuedPlayer[]): GameServer | null {
    const availableServers = Array.from(this.servers.values()).filter(
      s => s.status === 'online' && s.load < 0.9
    );

    if (availableServers.length === 0) {
      return null;
    }

    // Calculate average latency for each server
    const serverScores = availableServers.map(server => {
      const totalLatency = players.reduce((sum, player) => {
        // Estimate latency based on region
        let latency = 50; // Base latency

        if (player.region !== server.region) {
          latency += 100; // Cross-region penalty
        }

        return sum + latency;
      }, 0);

      const avgLatency = totalLatency / players.length;
      const loadPenalty = server.load * 100;

      return {
        server,
        score: avgLatency + loadPenalty,
      };
    });

    // Select server with lowest score
    serverScores.sort((a, b) => a.score - b.score);
    return serverScores[0].server;
  }

  private selectRandomMap(mapPool: string[]): string {
    return mapPool[Math.floor(Math.random() * mapPool.length)];
  }

  async getQueueStatus(playerId: string): Promise<any> {
    const queueId = this.playerQueues.get(playerId);

    if (!queueId) {
      return null;
    }

    const queue = this.queues.get(queueId);
    if (!queue) {
      return null;
    }

    const player = queue.players.find(p => p.id === playerId);
    if (!player) {
      return null;
    }

    const waitTime = Date.now() - player.queueTime.getTime();
    const estimatedRemaining = Math.max(0, (queue.estimatedWaitTime.get(playerId) || 0) - waitTime);

    return {
      queueId,
      mode: queue.mode.name,
      playersInQueue: queue.players.length,
      waitTime,
      estimatedRemaining,
      position: queue.players.findIndex(p => p.id === playerId) + 1,
    };
  }

  async getMatchDetails(matchId: string): Promise<Match | null> {
    return this.activeMatches.get(matchId) || null;
  }
}