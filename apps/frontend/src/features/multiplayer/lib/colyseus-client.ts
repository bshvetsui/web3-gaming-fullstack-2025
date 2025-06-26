import { Client, Room } from 'colyseus.js';
import { API_ENDPOINTS } from '@/shared/lib/constants';

/**
 * Colyseus client wrapper for multiplayer game rooms
 */
export class ColyseusClient {
  private client: Client;
  private currentRoom: Room | null = null;

  constructor() {
    this.client = new Client(API_ENDPOINTS.COLYSEUS);
  }

  /**
   * Join or create a game room
   */
  async joinRoom(
    roomName: string,
    options: {
      username: string;
      walletAddress: string;
      gameMode?: string;
    }
  ): Promise<Room> {
    try {
      // Try to join existing room
      const room = await this.client.joinOrCreate(roomName, options);

      this.currentRoom = room;
      this.setupRoomHandlers(room);

      return room;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Leave current room
   */
  async leaveRoom() {
    if (this.currentRoom) {
      await this.currentRoom.leave();
      this.currentRoom = null;
    }
  }

  /**
   * Send message to room
   */
  sendMessage(type: string, data: any) {
    if (this.currentRoom) {
      this.currentRoom.send(type, data);
    }
  }

  /**
   * Setup room event handlers
   */
  private setupRoomHandlers(room: Room) {
    // Handle state changes
    room.onStateChange((state) => {
      console.log('Room state changed:', state);
    });

    // Handle messages from server
    room.onMessage('player_joined', (data) => {
      console.log('Player joined:', data);
    });

    room.onMessage('player_left', (data) => {
      console.log('Player left:', data);
    });

    room.onMessage('game_started', (data) => {
      console.log('Game started:', data);
    });

    room.onMessage('game_ended', (data) => {
      console.log('Game ended:', data);
    });

    room.onMessage('player_killed', (data) => {
      console.log('Player killed:', data);
    });

    room.onMessage('chat_message', (data) => {
      console.log('Chat message:', data);
    });

    // Handle errors
    room.onError((code, message) => {
      console.error('Room error:', code, message);
    });

    // Handle leave
    room.onLeave((code) => {
      console.log('Left room with code:', code);
    });
  }

  /**
   * Get current room
   */
  getRoom(): Room | null {
    return this.currentRoom;
  }

  /**
   * Check if connected to a room
   */
  isConnected(): boolean {
    return this.currentRoom !== null;
  }
}

// Singleton instance
export const colyseusClient = new ColyseusClient();
