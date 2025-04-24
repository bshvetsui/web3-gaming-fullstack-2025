import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('friend-request')
  sendFriendRequest(@Body() body: { senderId: string; receiverId: string }) {
    return this.socialService.sendFriendRequest(body.senderId, body.receiverId);
  }

  @Post('friend-request/accept')
  acceptRequest(@Body() body: { requestId: string; playerId: string }) {
    const success = this.socialService.acceptFriendRequest(
      body.requestId,
      body.playerId
    );
    return { success };
  }

  @Post('friend-request/reject')
  rejectRequest(@Body() body: { requestId: string; playerId: string }) {
    const success = this.socialService.rejectFriendRequest(
      body.requestId,
      body.playerId
    );
    return { success };
  }

  @Delete('friend')
  removeFriend(@Body() body: { playerId: string; friendId: string }) {
    const success = this.socialService.removeFriend(
      body.playerId,
      body.friendId
    );
    return { success };
  }

  @Get('friends/:playerId')
  getFriends(@Param('playerId') playerId: string) {
    return this.socialService.getFriends(playerId);
  }

  @Get('friends/online/:playerId')
  getOnlineFriends(@Param('playerId') playerId: string) {
    return this.socialService.getOnlineFriends(playerId);
  }

  @Get('requests/pending/:playerId')
  getPendingRequests(@Param('playerId') playerId: string) {
    return this.socialService.getPendingRequests(playerId);
  }

  @Get('requests/sent/:playerId')
  getSentRequests(@Param('playerId') playerId: string) {
    return this.socialService.getSentRequests(playerId);
  }

  @Post('status')
  updateStatus(
    @Body()
    body: {
      playerId: string;
      status: 'online' | 'offline' | 'in-game' | 'away';
      currentGameId?: string;
    }
  ) {
    this.socialService.updateStatus(
      body.playerId,
      body.status,
      body.currentGameId
    );
    return { success: true };
  }

  @Get('status/:playerId')
  getStatus(@Param('playerId') playerId: string) {
    return this.socialService.getStatus(playerId);
  }

  @Post('block')
  blockPlayer(@Body() body: { playerId: string; targetId: string }) {
    this.socialService.blockPlayer(body.playerId, body.targetId);
    return { success: true };
  }

  @Post('unblock')
  unblockPlayer(@Body() body: { playerId: string; targetId: string }) {
    this.socialService.unblockPlayer(body.playerId, body.targetId);
    return { success: true };
  }

  @Get('blocked/:playerId')
  getBlockedPlayers(@Param('playerId') playerId: string) {
    return this.socialService.getBlockedPlayers(playerId);
  }

  @Get('suggestions/:playerId')
  getFriendSuggestions(@Param('playerId') playerId: string) {
    return this.socialService.getFriendSuggestions(playerId, 10);
  }
}
