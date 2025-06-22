import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket gateway for real-time game events
 * This works alongside Colyseus for additional features like voice chat signaling
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private connectedUsers = new Map<string, any>();

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);

    // Notify other clients
    this.server.emit('user_disconnected', {
      userId: client.id,
    });
  }

  /**
   * Handle user authentication
   */
  @SubscribeMessage('authenticate')
  handleAuthenticate(
    client: Socket,
    payload: { walletAddress: string; username: string }
  ) {
    this.connectedUsers.set(client.id, {
      walletAddress: payload.walletAddress,
      username: payload.username,
    });

    return {
      event: 'authenticated',
      data: { userId: client.id },
    };
  }

  /**
   * Handle matchmaking request
   */
  @SubscribeMessage('find_match')
  handleFindMatch(
    client: Socket,
    payload: { gameMode: string; preferredRegion?: string }
  ) {
    // Matchmaking logic would go here
    // For now, just acknowledge the request

    return {
      event: 'match_searching',
      data: {
        gameMode: payload.gameMode,
        estimatedWait: 30,
      },
    };
  }

  /**
   * Handle chat messages
   */
  @SubscribeMessage('send_message')
  handleChatMessage(
    client: Socket,
    payload: { message: string; channel: string; recipientId?: string }
  ) {
    const user = this.connectedUsers.get(client.id);

    if (!user) {
      return { event: 'error', data: { message: 'Not authenticated' } };
    }

    const chatMessage = {
      id: `msg-${Date.now()}-${client.id}`,
      userId: client.id,
      username: user.username,
      message: payload.message,
      timestamp: Date.now(),
      channel: payload.channel,
    };

    // Send to specific user or broadcast
    if (payload.recipientId) {
      this.server.to(payload.recipientId).emit('message', chatMessage);
    } else {
      this.server.emit('message', chatMessage);
    }

    return { event: 'message_sent', data: { success: true } };
  }

  /**
   * Broadcast event to specific room
   */
  broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, data);
  }
}
