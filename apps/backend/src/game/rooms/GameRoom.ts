import { Room, Client } from '@colyseus/core';
import { GameState, PlayerState } from '../schemas/GameState';

export interface JoinOptions {
  username: string;
  walletAddress: string;
  gameMode?: string;
}

/**
 * Main game room for multiplayer sessions
 */
export class GameRoom extends Room<GameState> {
  maxClients = 10;
  private gameLoopInterval?: NodeJS.Timeout;
  private readonly TICK_RATE = 1000 / 20; // 20 ticks per second

  onCreate(options: any) {
    this.setState(new GameState());

    // Set game configuration
    if (options.maxPlayers) {
      this.maxClients = options.maxPlayers;
      this.state.maxPlayers = options.maxPlayers;
    }

    if (options.gameMode) {
      this.state.gameMode = options.gameMode;
    }

    this.setupMessageHandlers();
    this.startGameLoop();

    console.log('GameRoom created:', this.roomId);
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(`Player ${client.sessionId} joined`);

    // Validate join options
    if (!options.username || !options.walletAddress) {
      throw new Error('Username and wallet address are required');
    }

    // Check if room is full
    if (this.clients.length >= this.maxClients) {
      throw new Error('Room is full');
    }

    // Add player to game state
    this.state.addPlayer(
      client.sessionId,
      options.username,
      options.walletAddress
    );

    // Broadcast player joined
    this.broadcast('player_joined', {
      sessionId: client.sessionId,
      username: options.username,
    }, { except: client });

    // Start game if enough players
    if (this.state.status === 'waiting' && this.clients.length >= 2) {
      this.startGame();
    }
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(`Player ${client.sessionId} left`);

    const player = this.state.players.get(client.sessionId);

    // Broadcast player left
    this.broadcast('player_left', {
      sessionId: client.sessionId,
      username: player?.username,
    });

    // Remove player from state
    this.state.removePlayer(client.sessionId);

    // End game if not enough players
    if (this.state.status === 'active' && this.clients.length < 2) {
      this.endGame();
    }
  }

  onDispose() {
    console.log('GameRoom disposed:', this.roomId);

    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }

  private setupMessageHandlers() {
    // Handle player movement
    this.onMessage('move', (client, data: {
      x: number;
      y: number;
      z: number;
      rotation: number;
    }) => {
      this.state.updatePlayerPosition(
        client.sessionId,
        data.x,
        data.y,
        data.z,
        data.rotation
      );
    });

    // Handle player shooting/attack
    this.onMessage('attack', (client, data: { targetId: string; damage: number }) => {
      const target = this.state.players.get(data.targetId);

      if (target && target.isAlive) {
        const newHealth = target.health - data.damage;
        this.state.updatePlayerHealth(data.targetId, newHealth);

        // If target died, give points to attacker
        if (newHealth <= 0) {
          this.state.addPlayerScore(client.sessionId, 100);

          this.broadcast('player_killed', {
            killerId: client.sessionId,
            victimId: data.targetId,
          });
        }
      }
    });

    // Handle chat messages
    this.onMessage('chat', (client, data: { message: string }) => {
      const player = this.state.players.get(client.sessionId);

      this.broadcast('chat_message', {
        username: player?.username,
        message: data.message,
        timestamp: Date.now(),
      });
    });
  }

  private startGame() {
    this.state.status = 'active';
    this.state.startTime = Date.now();

    this.broadcast('game_started', {
      timestamp: this.state.startTime,
    });

    console.log('Game started in room:', this.roomId);
  }

  private endGame() {
    this.state.status = 'ended';

    // Get winner (player with highest score)
    let winner: any = null;
    let highestScore = -1;

    this.state.players.forEach((player) => {
      if (player.score > highestScore) {
        highestScore = player.score;
        winner = {
          id: player.id,
          username: player.username,
          score: player.score,
        };
      }
    });

    this.broadcast('game_ended', {
      winner,
      duration: Date.now() - this.state.startTime,
    });

    console.log('Game ended in room:', this.roomId);

    // Disconnect all clients after 10 seconds
    setTimeout(() => {
      this.disconnect();
    }, 10000);
  }

  private startGameLoop() {
    this.gameLoopInterval = setInterval(() => {
      this.update();
    }, this.TICK_RATE);
  }

  private update() {
    // Game logic updates happen here
    // For example: physics, NPC movement, game mechanics

    if (this.state.status === 'active') {
      // Check win conditions
      const players = Array.from(this.state.players.values()) as PlayerState[];
      const alivePlayers = players.filter(player => player.isAlive);

      if (alivePlayers.length === 1) {
        // Last player standing wins
        this.endGame();
      }
    }
  }
}
