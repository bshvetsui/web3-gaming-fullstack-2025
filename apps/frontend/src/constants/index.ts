// Application Constants

export const APP_NAME = 'Web3 Gaming Platform';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Next-generation blockchain gaming platform';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
export const API_TIMEOUT = 30000; // 30 seconds

// Blockchain Configuration
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
} as const;

export const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS.POLYGON;

export const CHAIN_NAMES: Record<number, string> = {
  [SUPPORTED_CHAINS.ETHEREUM]: 'Ethereum',
  [SUPPORTED_CHAINS.POLYGON]: 'Polygon',
  [SUPPORTED_CHAINS.ARBITRUM]: 'Arbitrum',
  [SUPPORTED_CHAINS.OPTIMISM]: 'Optimism',
  [SUPPORTED_CHAINS.BASE]: 'Base',
};

export const CHAIN_EXPLORERS: Record<number, string> = {
  [SUPPORTED_CHAINS.ETHEREUM]: 'https://etherscan.io',
  [SUPPORTED_CHAINS.POLYGON]: 'https://polygonscan.com',
  [SUPPORTED_CHAINS.ARBITRUM]: 'https://arbiscan.io',
  [SUPPORTED_CHAINS.OPTIMISM]: 'https://optimistic.etherscan.io',
  [SUPPORTED_CHAINS.BASE]: 'https://basescan.org',
};

// Token Configuration
export const TOKEN_DECIMALS = 18;
export const TOKEN_SYMBOL = 'GAME';
export const STAKING_TOKEN_SYMBOL = 'sGAME';

// Game Configuration
export const GAME_MODES = {
  SOLO: 'solo',
  DUO: 'duo',
  SQUAD: 'squad',
  TEAM_5V5: '5v5',
  BATTLE_ROYALE: 'battle-royale',
  DEATHMATCH: 'deathmatch',
  CAPTURE_THE_FLAG: 'ctf',
  TOURNAMENT: 'tournament',
} as const;

export const MATCH_STATUS = {
  WAITING: 'waiting',
  STARTING: 'starting',
  IN_PROGRESS: 'in-progress',
  ENDING: 'ending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache Configuration
export const CACHE_DURATION = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  WALLET_ADDRESS: 'wallet_address',
  SELECTED_CHAIN: 'selected_chain',
  THEME: 'theme',
  LANGUAGE: 'language',
  SOUND_ENABLED: 'sound_enabled',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  AUTHENTICATED: 'authenticated',
  MATCH_FOUND: 'match_found',
  MATCH_STARTED: 'match_started',
  MATCH_ENDED: 'match_ended',
  GAME_UPDATE: 'game_update',
  CHAT_MESSAGE: 'chat_message',
  NOTIFICATION: 'notification',
  FRIEND_REQUEST: 'friend_request',
  GUILD_INVITE: 'guild_invite',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  WRONG_NETWORK: 'Please switch to a supported network',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_FAILED: 'Transaction failed',
  API_ERROR: 'API request failed',
  NETWORK_ERROR: 'Network error',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SENT: 'Transaction sent',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  PROFILE_UPDATED: 'Profile updated successfully',
  GAME_JOINED: 'Successfully joined the game',
  GUILD_CREATED: 'Guild created successfully',
  FRIEND_ADDED: 'Friend added successfully',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  MARKETPLACE: '/marketplace',
  PLAY: '/play',
  TOURNAMENTS: '/tournaments',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  GUILD: '/guild',
  STAKING: '/staking',
  GOVERNANCE: '/governance',
  SETTINGS: '/settings',
  HELP: '/help',
} as const;

// Social Links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/web3gaming',
  DISCORD: 'https://discord.gg/web3gaming',
  TELEGRAM: 'https://t.me/web3gaming',
  GITHUB: 'https://github.com/web3gaming',
  MEDIUM: 'https://medium.com/@web3gaming',
} as const;

// Feature Flags
export const FEATURES = {
  TOURNAMENT_ENABLED: true,
  STAKING_ENABLED: true,
  GOVERNANCE_ENABLED: true,
  MARKETPLACE_ENABLED: true,
  GUILDS_ENABLED: true,
  CHAT_ENABLED: true,
  VOICE_CHAT_ENABLED: false,
  REPLAY_ENABLED: true,
  SPECTATOR_MODE_ENABLED: true,
} as const;