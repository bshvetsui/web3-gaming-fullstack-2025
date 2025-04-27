'use client';

import { useState, useEffect } from 'react';
import styles from './FriendsList.module.css';

interface Friend {
  playerId: string;
  playerName: string;
  status: 'online' | 'offline' | 'in-game' | 'away';
  currentGameId?: string;
  lastSeen: Date;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  status: 'pending';
  createdAt: Date;
}

type Tab = 'friends' | 'requests' | 'blocked' | 'suggestions';

export const FriendsList = () => {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Friend[]>([]);
  const [blockedPlayers, setBlockedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    try {
      // Mock data
      const mockFriends: Friend[] = [
        {
          playerId: 'friend1',
          playerName: 'DragonSlayer',
          status: 'online',
          lastSeen: new Date(),
        },
        {
          playerId: 'friend2',
          playerName: 'ShadowMage',
          status: 'in-game',
          currentGameId: 'game123',
          lastSeen: new Date(),
        },
        {
          playerId: 'friend3',
          playerName: 'IronKnight',
          status: 'away',
          lastSeen: new Date(),
        },
        {
          playerId: 'friend4',
          playerName: 'StormArcher',
          status: 'offline',
          lastSeen: new Date(Date.now() - 3600000),
        },
      ];

      const mockRequests: FriendRequest[] = [
        {
          id: 'req1',
          senderId: 'player5',
          senderName: 'FlameWizard',
          receiverId: 'currentPlayer',
          status: 'pending',
          createdAt: new Date(),
        },
      ];

      const mockSuggestions: Friend[] = [
        {
          playerId: 'suggest1',
          playerName: 'ThunderMage',
          status: 'online',
          lastSeen: new Date(),
        },
        {
          playerId: 'suggest2',
          playerName: 'FrostArcher',
          status: 'offline',
          lastSeen: new Date(),
        },
      ];

      setFriends(mockFriends);
      setPendingRequests(mockRequests);
      setSuggestions(mockSuggestions);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch friends data:', error);
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    // TODO: Implement accept request
    console.log('Accept request:', requestId);
  };

  const rejectRequest = async (requestId: string) => {
    // TODO: Implement reject request
    console.log('Reject request:', requestId);
  };

  const sendFriendRequest = async (playerId: string) => {
    // TODO: Implement send friend request
    console.log('Send friend request:', playerId);
  };

  const removeFriend = async (playerId: string) => {
    // TODO: Implement remove friend
    console.log('Remove friend:', playerId);
  };

  const blockPlayer = async (playerId: string) => {
    // TODO: Implement block player
    console.log('Block player:', playerId);
  };

  const joinGame = async (gameId: string) => {
    // TODO: Implement join game
    console.log('Join game:', gameId);
  };

  const getStatusIcon = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'in-game':
        return '🎮';
      case 'away':
        return '🟡';
      case 'offline':
        return '⚫';
    }
  };

  const getStatusText = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'in-game':
        return 'In Game';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading Friends...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Friends</h2>
        <div className={styles.stats}>
          <span>{friends.filter((f) => f.status === 'online' || f.status === 'in-game').length} online</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'friends' ? styles.active : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({pendingRequests.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'suggestions' ? styles.active : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'blocked' ? styles.active : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          Blocked ({blockedPlayers.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'friends' && (
          <div className={styles.friendsList}>
            {friends.length === 0 ? (
              <div className={styles.empty}>No friends yet</div>
            ) : (
              friends
                .sort((a, b) => {
                  // Sort by status: online > in-game > away > offline
                  const statusOrder = { online: 0, 'in-game': 1, away: 2, offline: 3 };
                  return statusOrder[a.status] - statusOrder[b.status];
                })
                .map((friend) => (
                  <div key={friend.playerId} className={styles.friendCard}>
                    <div className={styles.friendInfo}>
                      <div className={styles.avatar}>👤</div>
                      <div className={styles.details}>
                        <span className={styles.name}>{friend.playerName}</span>
                        <span className={styles.status}>
                          {getStatusIcon(friend.status)} {getStatusText(friend.status)}
                        </span>
                        {friend.status === 'offline' && (
                          <span className={styles.lastSeen}>
                            Last seen: {new Date(friend.lastSeen).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      {friend.status === 'in-game' && friend.currentGameId && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => joinGame(friend.currentGameId!)}
                        >
                          Join Game
                        </button>
                      )}
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => removeFriend(friend.playerId)}
                      >
                        Remove
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => blockPlayer(friend.playerId)}
                      >
                        Block
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className={styles.requestsList}>
            {pendingRequests.length === 0 ? (
              <div className={styles.empty}>No pending requests</div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className={styles.requestCard}>
                  <div className={styles.requestInfo}>
                    <div className={styles.avatar}>👤</div>
                    <div className={styles.details}>
                      <span className={styles.name}>{request.senderName}</span>
                      <span className={styles.time}>
                        {new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => acceptRequest(request.id)}
                    >
                      Accept
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => rejectRequest(request.id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className={styles.suggestionsList}>
            {suggestions.length === 0 ? (
              <div className={styles.empty}>No suggestions available</div>
            ) : (
              suggestions.map((suggestion) => (
                <div key={suggestion.playerId} className={styles.suggestionCard}>
                  <div className={styles.friendInfo}>
                    <div className={styles.avatar}>👤</div>
                    <div className={styles.details}>
                      <span className={styles.name}>{suggestion.playerName}</span>
                      <span className={styles.mutualInfo}>2 mutual friends</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => sendFriendRequest(suggestion.playerId)}
                    >
                      Add Friend
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className={styles.blockedList}>
            {blockedPlayers.length === 0 ? (
              <div className={styles.empty}>No blocked players</div>
            ) : (
              blockedPlayers.map((playerId) => (
                <div key={playerId} className={styles.blockedCard}>
                  <div className={styles.friendInfo}>
                    <div className={styles.avatar}>👤</div>
                    <div className={styles.details}>
                      <span className={styles.name}>Player {playerId}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn}>Unblock</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
