import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { api } from '../lib/api';
import { Loader } from '../components/Loader';

// Define interface for friend data
interface Friend {
  id: number;
  friend_username: string;
  burnout_level: number;
}

// Define API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FriendsResponse extends ApiResponse<Friend[]> {}

interface DeleteFriendResponse extends ApiResponse<null> {}

export default function FriendsPage() {
  const router = useRouter();
  const { user, isReady } = useTelegram();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isReady || !user?.id) return;

    const loadFriends = async () => {
      try {
        const response: FriendsResponse = await api.getFriends();
        if (response.success && response.data) {
          setFriends(response.data);
        } else {
          setError(response.error || 'Failed to load friends');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [isReady, user?.id]);

  const handleAddFriend = () => {
    if (window.Telegram?.WebApp) {
      const inviteText = "Присоединяйся к моей команде для отслеживания выгорания!";
      const inviteLink = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(inviteText)}`;
      window.Telegram.WebApp.openTelegramLink(inviteLink);
    }
  };

  const handleDeleteFriend = async (friendId: number) => {
    try {
      const response: DeleteFriendResponse = await api.deleteFriend(friendId);
      if (response.success) {
        setFriends(friends.filter(f => f.id !== friendId));
      } else {
        setError(response.error || 'Failed to delete friend');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container">
      <button className="back-btn" onClick={() => router.push('/')}>
        📊
      </button>

      <h1>My Friends</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="friends-list">
        {friends.length === 0 ? (
          <p>No friends yet. Add some friends to track their burnout levels.</p>
        ) : (
          friends.map(friend => (
            <div key={friend.id} className="friend-card">
              <div className="friend-header">
                <span className="friend-username">@{friend.friend_username}</span>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteFriend(friend.id)}
                >
                  ✕
                </button>
              </div>
              <BurnoutProgress level={friend.burnout_level} />
              <div className="burnout-level">{friend.burnout_level}%</div>
            </div>
          ))
        )}
      </div>

      <div className="add-friend-section">
        <button className="add-friend-btn" onClick={handleAddFriend}>
          Add Friend
        </button>
        <p className="add-friend-hint">
          Share the app with a friend to add them to your tracking list
        </p>
      </div>
    </div>
  );
}
