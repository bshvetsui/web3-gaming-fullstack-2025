import { Schema, type, MapSchema } from '@colyseus/schema';

/**
 * Player state schema for Colyseus
 */
export class PlayerState extends Schema {
  @type('string') id: string;
  @type('string') username: string;
  @type('string') walletAddress: string;
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') rotation: number = 0;
  @type('number') health: number = 100;
  @type('number') score: number = 0;
  @type('boolean') isAlive: boolean = true;

  constructor(id: string, username: string, walletAddress: string) {
    super();
    this.id = id;
    this.username = username;
    this.walletAddress = walletAddress;
  }
}

/**
 * Main game state schema
 */
export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type('string') gameMode: string = 'pvp';
  @type('string') status: string = 'waiting'; // waiting, active, ended
  @type('number') startTime: number = 0;
  @type('number') maxPlayers: number = 10;
  @type('number') currentRound: number = 0;

  /**
   * Add a player to the game
   */
  addPlayer(sessionId: string, username: string, walletAddress: string) {
    const player = new PlayerState(sessionId, username, walletAddress);

    // Spawn at random position
    player.x = Math.random() * 100 - 50;
    player.z = Math.random() * 100 - 50;

    this.players.set(sessionId, player);
    return player;
  }

  /**
   * Remove a player from the game
   */
  removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }

  /**
   * Update player position
   */
  updatePlayerPosition(
    sessionId: string,
    x: number,
    y: number,
    z: number,
    rotation: number
  ) {
    const player = this.players.get(sessionId);
    if (player) {
      player.x = x;
      player.y = y;
      player.z = z;
      player.rotation = rotation;
    }
  }

  /**
   * Update player health
   */
  updatePlayerHealth(sessionId: string, health: number) {
    const player = this.players.get(sessionId);
    if (player) {
      player.health = Math.max(0, Math.min(100, health));

      if (player.health === 0) {
        player.isAlive = false;
      }
    }
  }

  /**
   * Add score to player
   */
  addPlayerScore(sessionId: string, points: number) {
    const player = this.players.get(sessionId);
    if (player) {
      player.score += points;
    }
  }
}
