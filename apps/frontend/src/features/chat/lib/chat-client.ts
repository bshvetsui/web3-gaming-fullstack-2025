import { io, Socket } from 'socket.io-client';
import { API_ENDPOINTS } from '@/shared/lib/constants';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  channel: 'global' | 'game' | 'whisper';
  recipientId?: string;
}

/**
 * Chat client for real-time messaging
 */
export class ChatClient {
  private socket: Socket | null = null;
  private onMessageCallback?: (message: ChatMessage) => void;
  private onUserJoinCallback?: (username: string) => void;
  private onUserLeaveCallback?: (username: string) => void;

  connect(userId: string, username: string) {
    this.socket = io(API_ENDPOINTS.BASE, {
      auth: { userId, username },
    });

    this.socket.on('connect', () => {
      console.log('Chat connected');
    });

    this.socket.on('message', (message: ChatMessage) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    });

    this.socket.on('user_joined', (username: string) => {
      if (this.onUserJoinCallback) {
        this.onUserJoinCallback(username);
      }
    });

    this.socket.on('user_left', (username: string) => {
      if (this.onUserLeaveCallback) {
        this.onUserLeaveCallback(username);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Chat disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: string, channel: 'global' | 'game' | 'whisper' = 'global', recipientId?: string) {
    if (this.socket) {
      this.socket.emit('send_message', {
        message,
        channel,
        recipientId,
        timestamp: Date.now(),
      });
    }
  }

  joinChannel(channel: string) {
    if (this.socket) {
      this.socket.emit('join_channel', channel);
    }
  }

  leaveChannel(channel: string) {
    if (this.socket) {
      this.socket.emit('leave_channel', channel);
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.onMessageCallback = callback;
  }

  onUserJoin(callback: (username: string) => void) {
    this.onUserJoinCallback = callback;
  }

  onUserLeave(callback: (username: string) => void) {
    this.onUserLeaveCallback = callback;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatClient = new ChatClient();
