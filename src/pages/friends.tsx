import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { useRouter } from 'next/router';
import { Friend } from '../lib/supabase';

export default function Friends() {
  const { user, isReady, webApp } = useTelegram();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !user?.id) return;

    const loadFriends = async () => {
      try {
        const response = await api.getFriends(user.id);
        if (response.success) {
          setFriends(response.data || []);
        } else {
          setError(response.error || 'Ошибка загрузки команды');
        }
      } catch (err) {
        setError('Ошибка сети');
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [isReady, user]);

  const handleAddFriend = () => {
    if (!webApp) return;

    if (window.Telegram?.WebApp?.showContactPicker) {
      try {
        webApp.showContactPicker(
          { title: 'Выбери участника команды' },
          (contact) => {
            if (!contact.user_id) {
              webApp.showAlert('У контакта нет Telegram ID');
              return;
            }
            if (!contact.username) {
              webApp.showAlert('У контакта должен быть username');
              return;
            }
            api.addFriend(user.id, contact.user_id, contact.username)
              .then(() => {
                setFriends(prev => [...prev, {
                  id: Date.now(), // Временный ID
                  user_id: user.id,
                  friend_telegram_id: contact.user_id,
                  friend_username: contact.username,
                  friend_burnout_level: 0
                }]);
              });
          }
        );
      } catch (err) {
        webApp.showAlert('Ошибка выбора контакта');
      }
    } else {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=Присоединяйся!`;
      webApp.openLink(shareUrl);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    if (!webApp || !user?.id) return;

    const confirmed = await new Promise<boolean>(resolve => {
      webApp.showConfirm('Удалить участника команды?', resolve);
    });

    if (!confirmed) return;

    try {
      const response = await api.removeFriend(user.id, friendId);
      if (response.success) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
      } else {
        webApp.showAlert('Ошибка: ' + response.error);
      }
    } catch (err) {
      webApp.showAlert('Ошибка сети');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <h2>Моя команда</h2>

      {error && <div className="error">{error}</div>}

      <button 
        className="add-friend-btn"
        onClick={handleAddFriend}
      >
        Добавить участника команды
      </button>

      <div className="friends-list">
        {friends.length === 0 ? (
          <p>У вас пока участников команды</p>
        ) : (
          friends.map(friend => (
            <div key={friend.id} className="friend-card">
              <div className="friend-info">
                <span className="username">@{friend.friend_username}</span>
                <BurnoutProgress level={friend.friend_burnout_level || 0} />
              </div>
              <button 
                className="remove-btn"
                onClick={() => handleRemoveFriend(friend.id)}
              >
                Удалить
              </button>
            </div>
          ))
        )}
      </div>

      <div className="menu">
        <button 
          className="menu-btn active"
          onClick={() => router.push('/')}
        >
          📊
        </button>
        <button className="menu-btn">📈</button>
      </div>
    </div>
  );
}
