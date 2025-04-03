// Chain configurations for multi-chain support
export const SUPPORTED_CHAINS = {
  IMMUTABLE_X: {
    id: 'immutable-x',
    name: 'Immutable X',
    chainId: 1,
    rpcUrl: 'https://api.x.immutable.com/v1',
  },
  RONIN: {
    id: 'ronin',
    name: 'Ronin',
    chainId: 2020,
    rpcUrl: 'https://api.roninchain.com/rpc',
  },
  FLOW: {
    id: 'flow',
    name: 'Flow',
    chainId: 747,
    rpcUrl: 'https://rest-mainnet.onflow.org',
  },
  SOLANA: {
    id: 'solana',
    name: 'Solana',
    chainId: 101,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },
} as const;

export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  GAME_STATE_UPDATE: 'game:state:update',
  PLAYER_JOIN: 'player:join',
  PLAYER_LEAVE: 'player:leave',
  VOICE_OFFER: 'voice:offer',
  VOICE_ANSWER: 'voice:answer',
  VOICE_ICE_CANDIDATE: 'voice:ice:candidate',
} as const;

export const API_ENDPOINTS = {
  BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  WS: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  COLYSEUS: process.env.NEXT_PUBLIC_COLYSEUS_URL || 'ws://localhost:2567',
} as const;
