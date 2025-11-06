import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'image' | 'emoji' | 'system' | 'announcement';
  timestamp: Date;
  edited: boolean;
  editedAt?: Date;
  reactions: MessageReaction[];
  replyTo?: string;
  mentions: string[];
  attachments: Attachment[];
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Attachment {
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'global' | 'guild' | 'party' | 'direct' | 'trade' | 'tournament';
  members: string[];
  admins: string[];
  muted: string[];
  banned: string[];
  description: string;
  icon: string;
  settings: ChannelSettings;
  lastActivity: Date;
  pinnedMessages: string[];
  slowMode: number; // seconds between messages
}

export interface ChannelSettings {
  isPublic: boolean;
  requiresInvite: boolean;
  maxMembers: number;
  allowImages: boolean;
  allowLinks: boolean;
  profanityFilter: boolean;
  autoModeration: boolean;
  minLevel: number;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  attachments: Attachment[];
}

export interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'invisible' | 'offline';
  customStatus: string;
  lastSeen: Date;
  currentChannel?: string;
  isTyping: boolean;
  typingIn?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private channels: Map<string, ChatChannel> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private userStatuses: Map<string, UserStatus> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private messageHistory: Map<string, ChatMessage[]> = new Map(); // channelId -> messages

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeDefaultChannels();
  }

  private initializeDefaultChannels() {
    const defaultChannels: ChatChannel[] = [
      {
        id: 'global',
        name: 'Global Chat',
        type: 'global',
        members: [],
        admins: [],
        muted: [],
        banned: [],
        description: 'Main global chat for all players',
        icon: '🌍',
        settings: {
          isPublic: true,
          requiresInvite: false,
          maxMembers: 10000,
          allowImages: true,
          allowLinks: false,
          profanityFilter: true,
          autoModeration: true,
          minLevel: 1,
        },
        lastActivity: new Date(),
        pinnedMessages: [],
        slowMode: 3,
      },
      {
        id: 'trade',
        name: 'Trade Chat',
        type: 'trade',
        members: [],
        admins: [],
        muted: [],
        banned: [],
        description: 'Buy, sell, and trade items',
        icon: '💰',
        settings: {
          isPublic: true,
          requiresInvite: false,
          maxMembers: 5000,
          allowImages: true,
          allowLinks: true,
          profanityFilter: true,
          autoModeration: true,
          minLevel: 10,
        },
        lastActivity: new Date(),
        pinnedMessages: [],
        slowMode: 10,
      },
      {
        id: 'tournament',
        name: 'Tournament Chat',
        type: 'tournament',
        members: [],
        admins: [],
        muted: [],
        banned: [],
        description: 'Discussion about tournaments',
        icon: '🏆',
        settings: {
          isPublic: true,
          requiresInvite: false,
          maxMembers: 1000,
          allowImages: false,
          allowLinks: false,
          profanityFilter: true,
          autoModeration: true,
          minLevel: 20,
        },
        lastActivity: new Date(),
        pinnedMessages: [],
        slowMode: 5,
      },
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
      this.messages.set(channel.id, []);
    });
  }

  afterInit(server: Server) {
    this.logger.log('Chat Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send available channels to new client
    const publicChannels = Array.from(this.channels.values()).filter(
      c => c.settings.isPublic
    );

    client.emit('channels', publicChannels);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = this.socketUsers.get(client.id);
    if (userId) {
      // Update user status
      const status = this.userStatuses.get(userId);
      if (status) {
        status.status = 'offline';
        status.lastSeen = new Date();
        status.isTyping = false;
        this.userStatuses.set(userId, status);

        // Notify others about status change
        this.server.emit('userStatusChanged', { userId, status: 'offline' });
      }

      // Clean up mappings
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);

      // Clear typing timer if exists
      const timer = this.typingTimers.get(userId);
      if (timer) {
        clearTimeout(timer);
        this.typingTimers.delete(userId);
      }
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; username: string }
  ) {
    const { userId, username } = data;

    // Map socket to user
    this.userSockets.set(userId, client.id);
    this.socketUsers.set(client.id, userId);

    // Update or create user status
    const status: UserStatus = {
      userId,
      status: 'online',
      customStatus: '',
      lastSeen: new Date(),
      isTyping: false,
    };

    this.userStatuses.set(userId, status);

    // Notify others about new user online
    client.broadcast.emit('userOnline', { userId, username });

    // Send current online users to the new client
    const onlineUsers = Array.from(this.userStatuses.values()).filter(
      s => s.status !== 'offline' && s.status !== 'invisible'
    );

    client.emit('onlineUsers', onlineUsers);

    return { success: true, userId };
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string }
  ) {
    const { channelId, userId } = data;
    const channel = this.channels.get(channelId);

    if (!channel) {
      return { error: 'Channel not found' };
    }

    // Check if user is banned
    if (channel.banned.includes(userId)) {
      return { error: 'You are banned from this channel' };
    }

    // Check if channel is full
    if (channel.members.length >= channel.settings.maxMembers) {
      return { error: 'Channel is full' };
    }

    // Add user to channel if not already member
    if (!channel.members.includes(userId)) {
      channel.members.push(userId);
      this.channels.set(channelId, channel);
    }

    // Join socket room
    client.join(channelId);

    // Update user's current channel
    const userStatus = this.userStatuses.get(userId);
    if (userStatus) {
      userStatus.currentChannel = channelId;
      this.userStatuses.set(userId, userStatus);
    }

    // Send channel history
    const history = this.messages.get(channelId) || [];
    const recentMessages = history.slice(-50); // Last 50 messages

    client.emit('channelHistory', { channelId, messages: recentMessages });

    // Notify channel members
    client.to(channelId).emit('userJoinedChannel', { channelId, userId });

    this.eventEmitter.emit('chat.channel.joined', { channelId, userId });

    return { success: true, channel };
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string }
  ) {
    const { channelId, userId } = data;
    const channel = this.channels.get(channelId);

    if (!channel) {
      return { error: 'Channel not found' };
    }

    // Remove user from channel
    channel.members = channel.members.filter(m => m !== userId);
    this.channels.set(channelId, channel);

    // Leave socket room
    client.leave(channelId);

    // Update user status
    const userStatus = this.userStatuses.get(userId);
    if (userStatus && userStatus.currentChannel === channelId) {
      userStatus.currentChannel = undefined;
      this.userStatuses.set(userId, userStatus);
    }

    // Notify channel members
    client.to(channelId).emit('userLeftChannel', { channelId, userId });

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      channelId: string;
      userId: string;
      username: string;
      content: string;
      type?: 'text' | 'image' | 'emoji';
      replyTo?: string;
      attachments?: Attachment[];
    }
  ) {
    const { channelId, userId, username, content, type = 'text', replyTo, attachments = [] } = data;
    const channel = this.channels.get(channelId);

    if (!channel) {
      return { error: 'Channel not found' };
    }

    // Check if user is muted
    if (channel.muted.includes(userId)) {
      return { error: 'You are muted in this channel' };
    }

    // Check if user is member
    if (!channel.members.includes(userId)) {
      return { error: 'You are not a member of this channel' };
    }

    // Apply profanity filter if enabled
    let filteredContent = content;
    if (channel.settings.profanityFilter) {
      filteredContent = this.filterProfanity(content);
    }

    // Extract mentions
    const mentions = this.extractMentions(content);

    // Create message
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      userId,
      username,
      content: filteredContent,
      type,
      timestamp: new Date(),
      edited: false,
      reactions: [],
      replyTo,
      mentions,
      attachments,
    };

    // Store message
    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);

    // Keep only last 1000 messages per channel
    if (channelMessages.length > 1000) {
      channelMessages.shift();
    }

    this.messages.set(channelId, channelMessages);

    // Update channel last activity
    channel.lastActivity = new Date();
    this.channels.set(channelId, channel);

    // Broadcast message to channel members
    this.server.to(channelId).emit('newMessage', message);

    // Send notifications to mentioned users
    mentions.forEach(mentionedUserId => {
      const socketId = this.userSockets.get(mentionedUserId);
      if (socketId) {
        this.server.to(socketId).emit('mentioned', {
          channelId,
          messageId: message.id,
          by: username,
        });
      }
    });

    // Stop typing indicator
    this.handleStopTyping(client, { channelId, userId });

    this.eventEmitter.emit('chat.message.sent', {
      channelId,
      userId,
      messageId: message.id,
    });

    return { success: true, messageId: message.id };
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      messageId: string;
      channelId: string;
      userId: string;
      newContent: string;
    }
  ) {
    const { messageId, channelId, userId, newContent } = data;

    const channelMessages = this.messages.get(channelId);
    if (!channelMessages) {
      return { error: 'Channel not found' };
    }

    const message = channelMessages.find(m => m.id === messageId);
    if (!message) {
      return { error: 'Message not found' };
    }

    if (message.userId !== userId) {
      return { error: 'You can only edit your own messages' };
    }

    // Apply profanity filter if needed
    const channel = this.channels.get(channelId);
    let filteredContent = newContent;
    if (channel && channel.settings.profanityFilter) {
      filteredContent = this.filterProfanity(newContent);
    }

    // Update message
    message.content = filteredContent;
    message.edited = true;
    message.editedAt = new Date();
    message.mentions = this.extractMentions(newContent);

    // Broadcast update
    this.server.to(channelId).emit('messageEdited', {
      messageId,
      channelId,
      newContent: filteredContent,
      editedAt: message.editedAt,
    });

    return { success: true };
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      messageId: string;
      channelId: string;
      userId: string;
    }
  ) {
    const { messageId, channelId, userId } = data;

    const channel = this.channels.get(channelId);
    if (!channel) {
      return { error: 'Channel not found' };
    }

    const channelMessages = this.messages.get(channelId);
    if (!channelMessages) {
      return { error: 'No messages in channel' };
    }

    const messageIndex = channelMessages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return { error: 'Message not found' };
    }

    const message = channelMessages[messageIndex];

    // Check permissions (user can delete own messages, admins can delete any)
    if (message.userId !== userId && !channel.admins.includes(userId)) {
      return { error: 'No permission to delete this message' };
    }

    // Remove message
    channelMessages.splice(messageIndex, 1);

    // Broadcast deletion
    this.server.to(channelId).emit('messageDeleted', { messageId, channelId });

    return { success: true };
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      messageId: string;
      channelId: string;
      userId: string;
      emoji: string;
    }
  ) {
    const { messageId, channelId, userId, emoji } = data;

    const channelMessages = this.messages.get(channelId);
    if (!channelMessages) {
      return { error: 'Channel not found' };
    }

    const message = channelMessages.find(m => m.id === messageId);
    if (!message) {
      return { error: 'Message not found' };
    }

    // Find or create reaction
    let reaction = message.reactions.find(r => r.emoji === emoji);
    if (!reaction) {
      reaction = {
        emoji,
        users: [userId],
        count: 1,
      };
      message.reactions.push(reaction);
    } else {
      if (!reaction.users.includes(userId)) {
        reaction.users.push(userId);
        reaction.count++;
      }
    }

    // Broadcast reaction update
    this.server.to(channelId).emit('reactionAdded', {
      messageId,
      channelId,
      emoji,
      userId,
      count: reaction.count,
    });

    return { success: true };
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      messageId: string;
      channelId: string;
      userId: string;
      emoji: string;
    }
  ) {
    const { messageId, channelId, userId, emoji } = data;

    const channelMessages = this.messages.get(channelId);
    if (!channelMessages) {
      return { error: 'Channel not found' };
    }

    const message = channelMessages.find(m => m.id === messageId);
    if (!message) {
      return { error: 'Message not found' };
    }

    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex === -1) {
      return { error: 'Reaction not found' };
    }

    const reaction = message.reactions[reactionIndex];
    const userIndex = reaction.users.indexOf(userId);

    if (userIndex !== -1) {
      reaction.users.splice(userIndex, 1);
      reaction.count--;

      if (reaction.count === 0) {
        message.reactions.splice(reactionIndex, 1);
      }

      // Broadcast reaction update
      this.server.to(channelId).emit('reactionRemoved', {
        messageId,
        channelId,
        emoji,
        userId,
        count: reaction.count,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('startTyping')
  async handleStartTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string; username: string }
  ) {
    const { channelId, userId, username } = data;

    // Update user status
    const userStatus = this.userStatuses.get(userId);
    if (userStatus) {
      userStatus.isTyping = true;
      userStatus.typingIn = channelId;
      this.userStatuses.set(userId, userStatus);
    }

    // Clear existing timer
    const existingTimer = this.typingTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set auto-stop typing after 5 seconds
    const timer = setTimeout(() => {
      this.handleStopTyping(client, { channelId, userId });
    }, 5000);

    this.typingTimers.set(userId, timer);

    // Notify channel members
    client.to(channelId).emit('userTyping', { channelId, userId, username });

    return { success: true };
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string }
  ) {
    const { channelId, userId } = data;

    // Update user status
    const userStatus = this.userStatuses.get(userId);
    if (userStatus) {
      userStatus.isTyping = false;
      userStatus.typingIn = undefined;
      this.userStatuses.set(userId, userStatus);
    }

    // Clear timer
    const timer = this.typingTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(userId);
    }

    // Notify channel members
    client.to(channelId).emit('userStoppedTyping', { channelId, userId });

    return { success: true };
  }

  @SubscribeMessage('updateStatus')
  async handleUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      userId: string;
      status: 'online' | 'away' | 'busy' | 'invisible';
      customStatus?: string;
    }
  ) {
    const { userId, status, customStatus = '' } = data;

    const userStatus = this.userStatuses.get(userId);
    if (!userStatus) {
      return { error: 'User not found' };
    }

    userStatus.status = status;
    userStatus.customStatus = customStatus;
    this.userStatuses.set(userId, userStatus);

    // Notify all users about status change
    if (status !== 'invisible') {
      this.server.emit('userStatusChanged', { userId, status, customStatus });
    }

    return { success: true };
  }

  private filterProfanity(text: string): string {
    // Simple profanity filter - in production, use a proper library
    const profanityList = ['badword1', 'badword2', 'badword3'];
    let filtered = text;

    profanityList.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });

    return filtered;
  }

  private extractMentions(text: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }
}