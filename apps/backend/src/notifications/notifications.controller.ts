import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { NotificationsService, NotificationType } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('player/:playerId')
  getPlayerNotifications(
    @Param('playerId') playerId: string,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true }))
    unreadOnly?: boolean,
  ) {
    return this.notificationsService.getPlayerNotifications(
      playerId,
      unreadOnly || false,
    );
  }

  @Get('player/:playerId/unread-count')
  getUnreadCount(@Param('playerId') playerId: string) {
    const count = this.notificationsService.getUnreadCount(playerId);
    return { count };
  }

  @Post('create')
  createNotification(
    @Body()
    body: {
      playerId: string;
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, any>;
      expiresInHours?: number;
    },
  ) {
    return this.notificationsService.createNotification(
      body.playerId,
      body.type,
      body.title,
      body.message,
      body.data,
      body.expiresInHours,
    );
  }

  @Post('broadcast')
  broadcastNotification(
    @Body()
    body: {
      playerIds: string[];
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, any>;
    },
  ) {
    return this.notificationsService.broadcastNotification(
      body.playerIds,
      body.type,
      body.title,
      body.message,
      body.data,
    );
  }

  @Post('read/:playerId/:notificationId')
  markAsRead(
    @Param('playerId') playerId: string,
    @Param('notificationId') notificationId: string,
  ) {
    const success = this.notificationsService.markAsRead(playerId, notificationId);
    return { success };
  }

  @Post('read-all/:playerId')
  markAllAsRead(@Param('playerId') playerId: string) {
    const count = this.notificationsService.markAllAsRead(playerId);
    return { count };
  }

  @Delete(':playerId/:notificationId')
  deleteNotification(
    @Param('playerId') playerId: string,
    @Param('notificationId') notificationId: string,
  ) {
    const success = this.notificationsService.deleteNotification(
      playerId,
      notificationId,
    );
    return { success };
  }

  @Delete('all/:playerId')
  deleteAllNotifications(@Param('playerId') playerId: string) {
    const count = this.notificationsService.deleteAllNotifications(playerId);
    return { count };
  }

  @Post('friend-request')
  notifyFriendRequest(@Body() body: { receiverId: string; senderName: string }) {
    return this.notificationsService.notifyFriendRequest(
      body.receiverId,
      body.senderName,
    );
  }

  @Post('friend-accepted')
  notifyFriendAccepted(@Body() body: { senderId: string; accepterName: string }) {
    return this.notificationsService.notifyFriendAccepted(
      body.senderId,
      body.accepterName,
    );
  }

  @Post('achievement')
  notifyAchievementUnlocked(
    @Body() body: { playerId: string; achievementName: string },
  ) {
    return this.notificationsService.notifyAchievementUnlocked(
      body.playerId,
      body.achievementName,
    );
  }

  @Post('level-up')
  notifyLevelUp(@Body() body: { playerId: string; newLevel: number }) {
    return this.notificationsService.notifyLevelUp(body.playerId, body.newLevel);
  }

  @Post('match-found')
  notifyMatchFound(@Body() body: { playerId: string; gameMode: string }) {
    return this.notificationsService.notifyMatchFound(body.playerId, body.gameMode);
  }

  @Post('tournament-start')
  notifyTournamentStart(
    @Body() body: { playerId: string; tournamentName: string },
  ) {
    return this.notificationsService.notifyTournamentStart(
      body.playerId,
      body.tournamentName,
    );
  }
}
