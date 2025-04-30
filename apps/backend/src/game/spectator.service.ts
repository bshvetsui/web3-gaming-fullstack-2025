import { Injectable } from '@nestjs/common';

export interface Spectator {
  id: string;
  playerId: string;
  playerName: string;
  joinedAt: Date;
}

export interface SpectatorSession {
  gameId: string;
  spectators: Spectator[];
  maxSpectators: number;
  allowSpectators: boolean;
}

@Injectable()
export class SpectatorService {
  private spectatorSessions: Map<string, SpectatorSession> = new Map();

  /**
   * Create spectator session for game
   */
  createSession(
    gameId: string,
    maxSpectators: number = 10,
    allowSpectators: boolean = true,
  ): SpectatorSession {
    const session: SpectatorSession = {
      gameId,
      spectators: [],
      maxSpectators,
      allowSpectators,
    };

    this.spectatorSessions.set(gameId, session);
    return session;
  }

  /**
   * Get spectator session
   */
  getSession(gameId: string): SpectatorSession | null {
    return this.spectatorSessions.get(gameId) || null;
  }

  /**
   * Join as spectator
   */
  joinAsSpectator(
    gameId: string,
    playerId: string,
    playerName: string,
  ): Spectator | null {
    const session = this.spectatorSessions.get(gameId);

    if (!session) {
      throw new Error('Game not found');
    }

    if (!session.allowSpectators) {
      throw new Error('Spectators not allowed for this game');
    }

    if (session.spectators.length >= session.maxSpectators) {
      throw new Error('Maximum spectators reached');
    }

    // Check if already spectating
    const existing = session.spectators.find((s) => s.playerId === playerId);
    if (existing) {
      return existing;
    }

    const spectator: Spectator = {
      id: `spec-${Date.now()}-${playerId}`,
      playerId,
      playerName,
      joinedAt: new Date(),
    };

    session.spectators.push(spectator);
    this.spectatorSessions.set(gameId, session);

    return spectator;
  }

  /**
   * Leave spectator mode
   */
  leaveSpectator(gameId: string, playerId: string): boolean {
    const session = this.spectatorSessions.get(gameId);

    if (!session) {
      return false;
    }

    const index = session.spectators.findIndex((s) => s.playerId === playerId);

    if (index === -1) {
      return false;
    }

    session.spectators.splice(index, 1);
    this.spectatorSessions.set(gameId, session);

    return true;
  }

  /**
   * Get spectators for game
   */
  getSpectators(gameId: string): Spectator[] {
    const session = this.spectatorSessions.get(gameId);
    return session ? session.spectators : [];
  }

  /**
   * Get spectator count
   */
  getSpectatorCount(gameId: string): number {
    const session = this.spectatorSessions.get(gameId);
    return session ? session.spectators.length : 0;
  }

  /**
   * Set spectator settings
   */
  setSpectatorSettings(
    gameId: string,
    settings: { maxSpectators?: number; allowSpectators?: boolean },
  ): void {
    const session = this.spectatorSessions.get(gameId);

    if (!session) {
      throw new Error('Game not found');
    }

    if (settings.maxSpectators !== undefined) {
      session.maxSpectators = settings.maxSpectators;
    }

    if (settings.allowSpectators !== undefined) {
      session.allowSpectators = settings.allowSpectators;

      // Kick all spectators if disabled
      if (!settings.allowSpectators) {
        session.spectators = [];
      }
    }

    this.spectatorSessions.set(gameId, session);
  }

  /**
   * Close spectator session
   */
  closeSession(gameId: string): boolean {
    return this.spectatorSessions.delete(gameId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SpectatorSession[] {
    return Array.from(this.spectatorSessions.values());
  }

  /**
   * Kick spectator
   */
  kickSpectator(gameId: string, spectatorId: string): boolean {
    const session = this.spectatorSessions.get(gameId);

    if (!session) {
      return false;
    }

    const index = session.spectators.findIndex((s) => s.id === spectatorId);

    if (index === -1) {
      return false;
    }

    session.spectators.splice(index, 1);
    this.spectatorSessions.set(gameId, session);

    return true;
  }

  /**
   * Check if player is spectating
   */
  isSpectating(gameId: string, playerId: string): boolean {
    const session = this.spectatorSessions.get(gameId);

    if (!session) {
      return false;
    }

    return session.spectators.some((s) => s.playerId === playerId);
  }
}
