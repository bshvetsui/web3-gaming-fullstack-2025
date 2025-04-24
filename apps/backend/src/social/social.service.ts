import { Injectable } from '@nestjs/common';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Friendship {
  player1Id: string;
  player2Id: string;
  createdAt: Date;
}

export interface PlayerStatus {
  playerId: string;
  status: 'online' | 'offline' | 'in-game' | 'away';
  lastSeen: Date;
  currentGameId?: string;
}

@Injectable()
export class SocialService {
  private friendships: Map<string, Friendship> = new Map();
  private friendRequests: Map<string, FriendRequest> = new Map();
  private playerStatuses: Map<string, PlayerStatus> = new Map();
  private blockedPlayers: Map<string, Set<string>> = new Map(); // playerId -> Set of blocked playerIds

  /**
   * Send friend request
   */
  sendFriendRequest(senderId: string, receiverId: string): FriendRequest {
    // Check if already friends
    if (this.areFriends(senderId, receiverId)) {
      throw new Error('Already friends');
    }

    // Check if already sent
    const existingRequest = Array.from(this.friendRequests.values()).find(
      (req) =>
        req.senderId === senderId &&
        req.receiverId === receiverId &&
        req.status === 'pending'
    );

    if (existingRequest) {
      throw new Error('Friend request already sent');
    }

    // Check if blocked
    if (this.isBlocked(receiverId, senderId)) {
      throw new Error('Cannot send friend request');
    }

    const request: FriendRequest = {
      id: `req-${Date.now()}`,
      senderId,
      receiverId,
      status: 'pending',
      createdAt: new Date(),
    };

    this.friendRequests.set(request.id, request);

    return request;
  }

  /**
   * Accept friend request
   */
  acceptFriendRequest(requestId: string, playerId: string): boolean {
    const request = this.friendRequests.get(requestId);

    if (!request || request.receiverId !== playerId) {
      return false;
    }

    if (request.status !== 'pending') {
      return false;
    }

    // Create friendship
    const friendshipId = this.getFriendshipId(request.senderId, request.receiverId);
    const friendship: Friendship = {
      player1Id: request.senderId,
      player2Id: request.receiverId,
      createdAt: new Date(),
    };

    this.friendships.set(friendshipId, friendship);

    // Update request
    request.status = 'accepted';
    this.friendRequests.set(requestId, request);

    return true;
  }

  /**
   * Reject friend request
   */
  rejectFriendRequest(requestId: string, playerId: string): boolean {
    const request = this.friendRequests.get(requestId);

    if (!request || request.receiverId !== playerId) {
      return false;
    }

    if (request.status !== 'pending') {
      return false;
    }

    request.status = 'rejected';
    this.friendRequests.set(requestId, request);

    return true;
  }

  /**
   * Remove friend
   */
  removeFriend(playerId: string, friendId: string): boolean {
    const friendshipId = this.getFriendshipId(playerId, friendId);
    return this.friendships.delete(friendshipId);
  }

  /**
   * Get friend list
   */
  getFriends(playerId: string): string[] {
    const friends: string[] = [];

    this.friendships.forEach((friendship) => {
      if (friendship.player1Id === playerId) {
        friends.push(friendship.player2Id);
      } else if (friendship.player2Id === playerId) {
        friends.push(friendship.player1Id);
      }
    });

    return friends;
  }

  /**
   * Get pending friend requests
   */
  getPendingRequests(playerId: string): FriendRequest[] {
    return Array.from(this.friendRequests.values()).filter(
      (req) => req.receiverId === playerId && req.status === 'pending'
    );
  }

  /**
   * Get sent requests
   */
  getSentRequests(playerId: string): FriendRequest[] {
    return Array.from(this.friendRequests.values()).filter(
      (req) => req.senderId === playerId && req.status === 'pending'
    );
  }

  /**
   * Check if players are friends
   */
  areFriends(playerId1: string, playerId2: string): boolean {
    const friendshipId = this.getFriendshipId(playerId1, playerId2);
    return this.friendships.has(friendshipId);
  }

  /**
   * Get friendship ID (deterministic)
   */
  private getFriendshipId(playerId1: string, playerId2: string): string {
    return [playerId1, playerId2].sort().join('-');
  }

  /**
   * Update player status
   */
  updateStatus(
    playerId: string,
    status: 'online' | 'offline' | 'in-game' | 'away',
    currentGameId?: string
  ): void {
    const playerStatus: PlayerStatus = {
      playerId,
      status,
      lastSeen: new Date(),
      currentGameId,
    };

    this.playerStatuses.set(playerId, playerStatus);
  }

  /**
   * Get player status
   */
  getStatus(playerId: string): PlayerStatus | null {
    return this.playerStatuses.get(playerId) || null;
  }

  /**
   * Get online friends
   */
  getOnlineFriends(playerId: string): string[] {
    const friends = this.getFriends(playerId);

    return friends.filter((friendId) => {
      const status = this.getStatus(friendId);
      return status && (status.status === 'online' || status.status === 'in-game');
    });
  }

  /**
   * Block player
   */
  blockPlayer(playerId: string, targetId: string): void {
    const blocked = this.blockedPlayers.get(playerId) || new Set();
    blocked.add(targetId);
    this.blockedPlayers.set(playerId, blocked);

    // Remove friendship if exists
    this.removeFriend(playerId, targetId);
  }

  /**
   * Unblock player
   */
  unblockPlayer(playerId: string, targetId: string): void {
    const blocked = this.blockedPlayers.get(playerId);
    if (blocked) {
      blocked.delete(targetId);
    }
  }

  /**
   * Check if player is blocked
   */
  isBlocked(playerId: string, targetId: string): boolean {
    const blocked = this.blockedPlayers.get(playerId);
    return blocked ? blocked.has(targetId) : false;
  }

  /**
   * Get blocked players
   */
  getBlockedPlayers(playerId: string): string[] {
    const blocked = this.blockedPlayers.get(playerId);
    return blocked ? Array.from(blocked) : [];
  }

  /**
   * Get friend suggestions (mutual friends)
   */
  getFriendSuggestions(playerId: string, limit: number = 10): string[] {
    const friends = this.getFriends(playerId);
    const suggestions = new Map<string, number>(); // playerId -> mutual count

    // Find players who are friends with your friends
    friends.forEach((friendId) => {
      const friendsOfFriend = this.getFriends(friendId);

      friendsOfFriend.forEach((potentialFriend) => {
        if (
          potentialFriend !== playerId &&
          !friends.includes(potentialFriend) &&
          !this.isBlocked(playerId, potentialFriend)
        ) {
          suggestions.set(
            potentialFriend,
            (suggestions.get(potentialFriend) || 0) + 1
          );
        }
      });
    });

    // Sort by mutual count
    return Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([playerId]) => playerId);
  }
}
