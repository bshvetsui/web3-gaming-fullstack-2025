import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import { GameRoom } from './rooms/GameRoom';

/**
 * Initialize Colyseus game server
 */
export function createColyseusServer(port: number = 2567) {
  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: undefined, // Will be attached to existing HTTP server
      pingInterval: 10000,
      pingMaxRetries: 3,
    }),
  });

  // Register game rooms
  gameServer
    .define('game_room', GameRoom)
    .filterBy(['gameMode']);

  // Enable monitoring (development only)
  if (process.env.NODE_ENV === 'development') {
    gameServer.listen(port);
    console.log(`Colyseus server listening on ws://localhost:${port}`);
  }

  return gameServer;
}
