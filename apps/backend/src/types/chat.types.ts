export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  edited: boolean;
  editedAt?: Date;
  reactions: MessageReaction[];
  replyTo?: string;
  mentions: string[];
  attachments: Attachment[];
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  EMOJI = 'emoji',
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement',
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Attachment {
  type: AttachmentType;
  url: string;
  name: string;
  size: number;
}

export enum AttachmentType {
  IMAGE = 'image',
  FILE = 'file',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  members: string[];
  admins: string[];
  muted: string[];
  banned: string[];
  description: string;
  icon: string;
  settings: ChannelSettings;
  lastActivity: Date;
  pinnedMessages: string[];
  slowMode: number;
}

export enum ChannelType {
  GLOBAL = 'global',
  GUILD = 'guild',
  PARTY = 'party',
  DIRECT = 'direct',
  TRADE = 'trade',
  TOURNAMENT = 'tournament',
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
  status: OnlineStatus;
  customStatus: string;
  lastSeen: Date;
  currentChannel?: string;
  isTyping: boolean;
  typingIn?: string;
}

export enum OnlineStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline',
}