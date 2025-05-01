import { Injectable } from '@nestjs/common';

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'guild_invite'
  | 'tournament_start'
  | 'match_found'
  | 'achievement_unlocked'
  | 'quest_completed'
  | 'level_up'
  | 'item_sold'
  | 'system';

export interface Notification {
  id: string;
  playerId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

@Injectable()
export class NotificationsService {
  private notifications: Map<string, Notification[]> = new Map();

  /**
   * Create notification
   */
  createNotification(
    playerId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    expiresInHours?: number,
  ): Notification {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      playerId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
      expiresAt: expiresInHours
        ? new Date(Date.now() + expiresInHours * 3600000)
        : undefined,
    };

    const playerNotifications = this.notifications.get(playerId) || [];
    playerNotifications.push(notification);
    this.notifications.set(playerId, playerNotifications);

    // Clean up expired notifications
    this.cleanupExpiredNotifications(playerId);

    return notification;
  }

  /**
   * Get player notifications
   */
  getPlayerNotifications(
    playerId: string,
    unreadOnly: boolean = false,
  ): Notification[] {
    const playerNotifications = this.notifications.get(playerId) || [];

    this.cleanupExpiredNotifications(playerId);

    if (unreadOnly) {
      return playerNotifications.filter((n) => !n.read);
    }

    return playerNotifications;
  }

  /**
   * Mark notification as read
   */
  markAsRead(playerId: string, notificationId: string): boolean {
    const playerNotifications = this.notifications.get(playerId);

    if (!playerNotifications) {
      return false;
    }

    const notification = playerNotifications.find((n) => n.id === notificationId);

    if (!notification) {
      return false;
    }

    notification.read = true;
    this.notifications.set(playerId, playerNotifications);

    return true;
  }

  /**
   * Mark all as read
   */
  markAllAsRead(playerId: string): number {
    const playerNotifications = this.notifications.get(playerId);

    if (!playerNotifications) {
      return 0;
    }

    let count = 0;
    playerNotifications.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
        count++;
      }
    });

    this.notifications.set(playerId, playerNotifications);

    return count;
  }

  /**
   * Delete notification
   */
  deleteNotification(playerId: string, notificationId: string): boolean {
    const playerNotifications = this.notifications.get(playerId);

    if (!playerNotifications) {
      return false;
    }

    const index = playerNotifications.findIndex((n) => n.id === notificationId);

    if (index === -1) {
      return false;
    }

    playerNotifications.splice(index, 1);
    this.notifications.set(playerId, playerNotifications);

    return true;
  }

  /**
   * Delete all notifications
   */
  deleteAllNotifications(playerId: string): number {
    const playerNotifications = this.notifications.get(playerId);

    if (!playerNotifications) {
      return 0;
    }

    const count = playerNotifications.length;
    this.notifications.set(playerId, []);

    return count;
  }

  /**
   * Get unread count
   */
  getUnreadCount(playerId: string): number {
    const playerNotifications = this.notifications.get(playerId) || [];
    return playerNotifications.filter((n) => !n.read).length;
  }

  /**
   * Clean up expired notifications
   */
  private cleanupExpiredNotifications(playerId: string): void {
    const playerNotifications = this.notifications.get(playerId);

    if (!playerNotifications) {
      return;
    }

    const now = new Date();
    const filtered = playerNotifications.filter(
      (n) => !n.expiresAt || n.expiresAt > now,
    );

    this.notifications.set(playerId, filtered);
  }

  /**
   * Broadcast notification to multiple players
   */
  broadcastNotification(
    playerIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Notification[] {
    return playerIds.map((playerId) =>
      this.createNotification(playerId, type, title, message, data),
    );
  }

  /**
   * Send friend request notification
   */
  notifyFriendRequest(receiverId: string, senderName: string): Notification {
    return this.createNotification(
      receiverId,
      'friend_request',
      'New Friend Request',
      `${senderName} sent you a friend request`,
      { senderName },
      24,
    );
  }

  /**
   * Send friend accepted notification
   */
  notifyFriendAccepted(senderId: string, accepterName: string): Notification {
    return this.createNotification(
      senderId,
      'friend_accepted',
      'Friend Request Accepted',
      `${accepterName} accepted your friend request`,
      { accepterName },
      24,
    );
  }

  /**
   * Send achievement unlocked notification
   */
  notifyAchievementUnlocked(
    playerId: string,
    achievementName: string,
  ): Notification {
    return this.createNotification(
      playerId,
      'achievement_unlocked',
      'Achievement Unlocked!',
      `You unlocked: ${achievementName}`,
      { achievementName },
    );
  }

  /**
   * Send level up notification
   */
  notifyLevelUp(playerId: string, newLevel: number): Notification {
    return this.createNotification(
      playerId,
      'level_up',
      'Level Up!',
      `Congratulations! You reached level ${newLevel}`,
      { newLevel },
    );
  }

  /**
   * Send match found notification
   */
  notifyMatchFound(playerId: string, gameMode: string): Notification {
    return this.createNotification(
      playerId,
      'match_found',
      'Match Found!',
      `A ${gameMode} match is ready`,
      { gameMode },
      1,
    );
  }

  /**
   * Send tournament start notification
   */
  notifyTournamentStart(
    playerId: string,
    tournamentName: string,
  ): Notification {
    return this.createNotification(
      playerId,
      'tournament_start',
      'Tournament Starting',
      `${tournamentName} is about to begin!`,
      { tournamentName },
      2,
    );
  }
}
