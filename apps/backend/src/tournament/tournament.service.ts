import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  currentPlayers: number;
  startTime: number;
  endTime: number;
  status: 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  format?: 'single-elimination' | 'double-elimination' | 'round-robin' | 'swiss';
  gameMode?: 'solo' | 'duo' | 'squad' | '5v5';
  prizeDistribution?: PrizeDistribution[];
  rules?: TournamentRules;
  sponsors?: Sponsor[];
  streamUrl?: string;
  spectators?: number;
  region?: string;
}

export interface TournamentParticipant {
  id: string;
  username: string;
  walletAddress: string;
  seed: number;
  currentRound: number;
  isEliminated: boolean;
  wins?: number;
  losses?: number;
  points?: number;
  placement?: number;
  checkedIn?: boolean;
  registeredAt?: number;
}

export interface TournamentBracket {
  round: number;
  matches: Match[];
  name?: string;
  startTime?: number;
  isComplete?: boolean;
}

export interface Match {
  id: string;
  round: number;
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  score?: [number, number];
  status: 'pending' | 'live' | 'completed' | 'disputed';
  startedAt?: number;
  completedAt?: number;
  gameId?: string;
  vods?: string[];
  stats?: MatchStats;
}

export interface MatchStats {
  duration: number;
  kills: { [playerId: string]: number };
  deaths: { [playerId: string]: number };
  assists: { [playerId: string]: number };
  damage: { [playerId: string]: number };
}

export interface PrizeDistribution {
  placement: number;
  prize: number;
  percentage: number;
}

export interface TournamentRules {
  mapPool: string[];
  banList: string[];
  timeLimit: number;
  scoreLimit: number;
  allowSpectators: boolean;
  requireCheckIn: boolean;
  checkInTime: number;
  minLevel?: number;
  maxLevel?: number;
}

export interface Sponsor {
  name: string;
  logo: string;
  contribution: number;
  website: string;
}

@Injectable()
export class TournamentService {
  private tournaments: Map<string, Tournament> = new Map();
  private leaderboards: Map<string, any[]> = new Map();

  constructor(private eventEmitter: EventEmitter2) {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleTournament: Tournament = {
      id: 'tournament-1',
      name: 'Weekly Championship',
      description: 'Compete for glory and prizes',
      entryFee: 10,
      prizePool: 500,
      maxPlayers: 16,
      currentPlayers: 8,
      startTime: Date.now() + 3600000, // 1 hour from now
      endTime: Date.now() + 7200000, // 2 hours from now
      status: 'upcoming',
      participants: [],
      brackets: [],
      format: 'single-elimination',
      gameMode: 'solo',
      prizeDistribution: [
        { placement: 1, prize: 250, percentage: 50 },
        { placement: 2, prize: 150, percentage: 30 },
        { placement: 3, prize: 100, percentage: 20 }
      ],
      rules: {
        mapPool: ['dust2', 'mirage', 'inferno'],
        banList: [],
        timeLimit: 30,
        scoreLimit: 16,
        allowSpectators: true,
        requireCheckIn: true,
        checkInTime: 900000, // 15 minutes before start
        minLevel: 10
      },
      sponsors: [],
      spectators: 0,
      region: 'NA'
    };

    this.tournaments.set(sampleTournament.id, sampleTournament);

    // Initialize leaderboards
    this.leaderboards.set('daily', []);
    this.leaderboards.set('weekly', []);
    this.leaderboards.set('alltime', []);
    this.leaderboards.set('seasonal', []);
  }

  /**
   * Get all tournaments
   */
  async getTournaments(status?: 'upcoming' | 'active' | 'completed') {
    let tournaments = Array.from(this.tournaments.values());

    if (status) {
      tournaments = tournaments.filter((t) => t.status === status);
    }

    return tournaments;
  }

  /**
   * Get tournament by ID
   */
  async getTournament(id: string): Promise<Tournament | null> {
    return this.tournaments.get(id) || null;
  }

  /**
   * Create a new tournament
   */
  async createTournament(data: {
    name: string;
    description: string;
    entryFee: number;
    prizePool: number;
    maxPlayers: number;
    startTime: number;
    endTime: number;
  }): Promise<Tournament> {
    const tournament: Tournament = {
      id: `tournament-${Date.now()}`,
      ...data,
      currentPlayers: 0,
      status: 'upcoming',
      participants: [],
      brackets: [],
    };

    this.tournaments.set(tournament.id, tournament);

    return tournament;
  }

  /**
   * Join a tournament
   */
  async joinTournament(
    tournamentId: string,
    participant: { username: string; walletAddress: string }
  ): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'upcoming') {
      throw new Error('Cannot join tournament that has already started');
    }

    if (tournament.currentPlayers >= tournament.maxPlayers) {
      throw new Error('Tournament is full');
    }

    // Check if already joined
    const alreadyJoined = tournament.participants.some(
      (p) => p.walletAddress === participant.walletAddress
    );

    if (alreadyJoined) {
      throw new Error('Already joined this tournament');
    }

    const newParticipant: TournamentParticipant = {
      id: `participant-${Date.now()}`,
      ...participant,
      seed: tournament.currentPlayers + 1,
      currentRound: 0,
      isEliminated: false,
    };

    tournament.participants.push(newParticipant);
    tournament.currentPlayers++;

    this.tournaments.set(tournamentId, tournament);
  }

  /**
   * Start a tournament
   */
  async startTournament(tournamentId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'upcoming') {
      throw new Error('Tournament already started');
    }

    // Generate brackets
    tournament.brackets = this.generateBrackets(tournament.participants);
    tournament.status = 'active';

    this.tournaments.set(tournamentId, tournament);
  }

  /**
   * Generate tournament brackets
   */
  private generateBrackets(
    participants: TournamentParticipant[]
  ): TournamentBracket[] {
    const brackets: TournamentBracket[] = [];
    const numRounds = Math.ceil(Math.log2(participants.length));

    // Generate first round matches
    const firstRoundMatches: Match[] = [];

    for (let i = 0; i < participants.length; i += 2) {
      if (i + 1 < participants.length) {
        firstRoundMatches.push({
          id: `match-${i / 2}`,
          round: 1,
          player1Id: participants[i].id,
          player2Id: participants[i + 1].id,
          status: 'pending',
        });
      }
    }

    brackets.push({
      round: 1,
      matches: firstRoundMatches,
    });

    // Generate placeholder brackets for subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      brackets.push({
        round,
        matches: [],
      });
    }

    return brackets;
  }

  /**
   * Report match result
   */
  async reportMatchResult(
    tournamentId: string,
    matchId: string,
    winnerId: string,
    score: [number, number]
  ): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Find and update match
    for (const bracket of tournament.brackets) {
      const match = bracket.matches.find((m) => m.id === matchId);

      if (match) {
        match.winnerId = winnerId;
        match.score = score;
        match.status = 'completed';
        match.completedAt = Date.now();

        // Eliminate loser
        const loserId =
          match.player1Id === winnerId ? match.player2Id : match.player1Id;
        const loser = tournament.participants.find((p) => p.id === loserId);

        if (loser) {
          loser.isEliminated = true;
        }

        break;
      }
    }

    this.tournaments.set(tournamentId, tournament);
  }

  /**
   * Check-in for tournament
   */
  async checkIn(tournamentId: string, playerId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const participant = tournament.participants.find(p => p.id === playerId);
    if (!participant) {
      throw new BadRequestException('Not registered for this tournament');
    }

    if (participant.checkedIn) {
      throw new BadRequestException('Already checked in');
    }

    const checkInDeadline = tournament.startTime - tournament.rules.checkInTime;
    if (Date.now() < checkInDeadline) {
      throw new BadRequestException('Check-in not open yet');
    }

    if (Date.now() > tournament.startTime) {
      throw new BadRequestException('Check-in closed');
    }

    participant.checkedIn = true;
    this.tournaments.set(tournamentId, tournament);

    this.eventEmitter.emit('tournament.checkin', {
      tournamentId,
      playerId,
      checkedInCount: tournament.participants.filter(p => p.checkedIn).length
    });
  }

  /**
   * Cancel tournament
   */
  async cancelTournament(tournamentId: string, reason: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      throw new BadRequestException('Cannot cancel this tournament');
    }

    tournament.status = 'cancelled';
    this.tournaments.set(tournamentId, tournament);

    // Refund entry fees
    tournament.participants.forEach(p => {
      this.eventEmitter.emit('tournament.refund', {
        tournamentId,
        playerId: p.id,
        amount: tournament.entryFee,
        reason
      });
    });

    this.eventEmitter.emit('tournament.cancelled', {
      tournamentId,
      reason,
      refundAmount: tournament.entryFee * tournament.currentPlayers
    });
  }

  /**
   * Get live tournaments count
   */
  async getLiveTournamentsCount(): Promise<number> {
    return Array.from(this.tournaments.values())
      .filter(t => t.status === 'active').length;
  }

  /**
   * Add spectator
   */
  async addSpectator(tournamentId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    tournament.spectators++;
    this.tournaments.set(tournamentId, tournament);
  }

  /**
   * Remove spectator
   */
  async removeSpectator(tournamentId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.spectators > 0) {
      tournament.spectators--;
      this.tournaments.set(tournamentId, tournament);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type: 'daily' | 'weekly' | 'alltime' | 'seasonal') {
    return this.leaderboards.get(type) || [];
  }

  /**
   * Update leaderboard entry
   */
  async updateLeaderboard(
    type: 'daily' | 'weekly' | 'alltime',
    entry: {
      playerId: string;
      username: string;
      score: number;
      wins: number;
      losses: number;
    }
  ) {
    const leaderboard = this.leaderboards.get(type) || [];

    const existingIndex = leaderboard.findIndex(
      (e) => e.playerId === entry.playerId
    );

    if (existingIndex >= 0) {
      // Update existing entry
      leaderboard[existingIndex] = {
        ...leaderboard[existingIndex],
        ...entry,
      };
    } else {
      // Add new entry
      leaderboard.push(entry);
    }

    // Sort by score
    leaderboard.sort((a, b) => b.score - a.score);

    // Add ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboards.set(type, leaderboard);
  }
}
