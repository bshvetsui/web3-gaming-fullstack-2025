import { Injectable } from '@nestjs/common';

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
  status: 'upcoming' | 'active' | 'completed';
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
}

export interface TournamentParticipant {
  id: string;
  username: string;
  walletAddress: string;
  seed: number;
  currentRound: number;
  isEliminated: boolean;
}

export interface TournamentBracket {
  round: number;
  matches: Match[];
}

export interface Match {
  id: string;
  round: number;
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  score?: [number, number];
  status: 'pending' | 'active' | 'completed';
  startedAt?: number;
  completedAt?: number;
}

@Injectable()
export class TournamentService {
  private tournaments: Map<string, Tournament> = new Map();
  private leaderboards: Map<string, any[]> = new Map();

  constructor() {
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
    };

    this.tournaments.set(sampleTournament.id, sampleTournament);

    // Initialize leaderboards
    this.leaderboards.set('daily', []);
    this.leaderboards.set('weekly', []);
    this.leaderboards.set('alltime', []);
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
   * Get leaderboard
   */
  async getLeaderboard(type: 'daily' | 'weekly' | 'alltime') {
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
