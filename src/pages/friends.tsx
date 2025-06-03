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
  const { user, isReady, initData } = useTelegram(); // Добавлено получение initData
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isReady || !user?.id) return;

    const loadFriends = async () => {
      try {
        // Передаем initData в запрос
        const response = await api.getFriends(initData) as FriendsResponse;
        
        if (response.success && response.data) {
          setFriends(response.data);
        } else {
          // Обработка ошибки авторизации
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
  }, [isReady, user?.id, initData]); // Добавлена зависимость от initData

  const handleAddFriend = () => {
    // Проверка доступности Telegram WebApp
    if (window.Telegram?.WebApp) {
      const inviteText = "Присоединяйся к моей команде для отслеживания выгорания!";
      
      // Добавлен реферальный параметр с ID пользователя
      const url = `${window.location.origin}?ref=${user?.id || 'unknown'}`;
      
      // Исправлено формирование ссылки
      const inviteLink = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(inviteText)}`;
      
      window.Telegram.WebApp.openLink(inviteLink);
    } else {
      // Fallback для окружений без Telegram WebApp
      const inviteText = "Присоединяйся к моей команде для отслеживания выгорания!";
      const url = `${window.location.origin}?ref=${user?.id || 'unknown'}`;
      const fullUrl = `${url}\n\n${inviteText}`;
      alert(`Скопируйте ссылку:\n\n${fullUrl}`);
    }
  };

  const handleDeleteFriend = async (friendId: number) => {
    try {
      // Передаем initData в запрос
      const response = await api.deleteFriend(friendId, initData) as DeleteResponse;
      
      if (response.success) {
        setFriends(friends.filter(f => f.id !== friendId));
      } else {
        // Обработка ошибки авторизации
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

      <div className="add-friend-section">
        <button className="add-friend-btn" onClick={handleAddFriend}>
          Add Friend
        </button>
        <p className="add-friend-hint">
          Share the app with a friend to add them to your tracking list
        </p>
      </div>

      {/* Добавлено идентичное нижнее меню */}
      <div className="menu">
        <button className="menu-btn" onClick={() => router.push('/')}>📊</button>
        <button className="menu-btn active" onClick={() => router.push('/friends')}>📈</button>
        <button className="menu-btn">⚙️</button>
        <button className="menu-btn">ℹ️</button>
      </div>
    </div>
  );
}
