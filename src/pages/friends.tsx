import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { api } from '../lib/api';
import { Loader } from '../components/Loader';

interface Friend {
  id: number;
  friend_username: string;
  burnout_level: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type FriendsResponse = ApiResponse<Friend[]>;
type DeleteResponse = ApiResponse<null>;

export default function FriendsPage() {
  const router = useRouter();
  const { user, isReady, initData, startParam } = useTelegram(); // <-- Добавлен startParam
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLink, setModalLink] = useState('');

  useEffect(() => {
    if (!isReady || !user?.id) return;

    const loadFriends = async () => {
      try {
        const response = await api.getFriends(initData) as FriendsResponse;
        
        if (response.success && response.data) {
          setFriends(response.data);
        } else {
          if (response.error?.includes("Unauthorized")) {
            setError("Пожалуйста, авторизуйтесь через Telegram");
          } else {
            setError(response.error || 'Failed to load friends');
          }
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [isReady, user?.id, initData]);
  
  const handleAddFriend = () => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      console.error('Telegram bot username is not configured');
      return;
    }
    
    // Используем startParam если есть, иначе создаем по user.id
    const referralCode = startParam || `ref_${user?.id}`;
    const deepLink = `https://t.me/${botUsername}?startapp=${referralCode}`;
    
    setModalLink(deepLink);
    setIsModalOpen(true);
  };

  const handleDeleteFriend = async (friendId: number) => {
    try {
      const response = await api.deleteFriend(friendId, initData) as DeleteResponse;
      
      if (response.success) {
        setFriends(friends.filter(f => f.id !== friendId));
      } else {
        if (response.error?.includes("Unauthorized")) {
          setError("Пожалуйста, авторизуйтесь через Telegram");
        } else {
          setError(response.error || 'Failed to delete friend');
        }
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

      {error && (
        <div className={`error-message ${error.includes("Unauthorized") ? "auth-error" : ""}`}>
          {error}
        </div>
      )}

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

      <button className="add-friend-btn" onClick={handleAddFriend}>
        Add Friend
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Ваша ссылка</h2>
            <p className="referral-link">{modalLink}</p>
            <div className="modal-buttons">
              <button 
                className="copy-btn" 
                onClick={() => {
                  navigator.clipboard.writeText(modalLink);
                  alert('Ссылка скопирована!');
                }}
              >
                Копировать
              </button>
              <button 
                className="share-btn"
                onClick={() => {
                  const shareText = "Присоединяйся к моей команде для отслеживания выгорания!";
                  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(modalLink)}&text=${encodeURIComponent(shareText)}`;
                  window.Telegram?.WebApp?.openLink(telegramShareUrl);
                }}
              >
                Поделиться
              </button>
              <button 
                className="close-btn" 
                onClick={() => setIsModalOpen(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
