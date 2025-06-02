import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

// Интерфейс для друга
interface Friend {
  id: number;
  username: string;
  burnoutlevel: number;
}

// Интерфейс для ответа API
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Интерфейс для контакта Telegram
interface TelegramContact {
  user_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

// Упрощенное объявление интерфейса без зависимости от Telegram
interface ExtendedTelegramWebApp {
  openContactForm: (
    callback: (contact: TelegramContact) => void,
    options?: { params: { request_phone?: boolean; request_write_access?: boolean } }
  ) => void;
  // Добавим другие используемые методы, если нужно
}

export default function FriendsPage() {
  const { user, isReady, webApp } = useTelegram();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isReady) return;

    const loadFriends = async () => {
      try {
        setLoading(true);
        if (!user?.id) {
          throw new Error('User ID is missing');
        }

        const response: ApiResponse = await api.getFriends(user.id);
        if (response.success && response.data) {
          setFriends(response.data as Friend[]);
        } else {
          setError(response.error || 'Failed to load friends');
        }
      } catch (err) {
        setError('An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [isReady, user]);

  const handleAddFriend = async () => {
    if (!webApp) {
      setError('Telegram WebApp is not available');
      return;
    }

    try {
      // Приводим тип напрямую без зависимости от Telegram
      const extendedWebApp = webApp as unknown as ExtendedTelegramWebApp;
      
      if (typeof extendedWebApp.openContactForm === 'function') {
        extendedWebApp.openContactForm(
          (contact: TelegramContact) => {
            if (contact) {
              addFriendByContact(contact);
            }
          },
          {
            params: {
              request_phone: false,
              request_write_access: false
            }
          }
        );
      } else {
        setError('Your Telegram app is outdated. Please update to add friends.');
      }
    } catch (err) {
      console.error('Failed to request contact', err);
      setError('Failed to request contact');
    }
  };

  const addFriendByContact = async (contact: TelegramContact) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Формируем username из доступных данных
      let username = contact.username;
      if (!username) {
        username = contact.first_name || '';
        if (contact.last_name) {
          username += ` ${contact.last_name}`;
        }
        if (!username.trim()) {
          username = `user_${contact.user_id}`;
        }
      }

      const response: ApiResponse = await api.addFriend(
        user.id, 
        contact.user_id, 
        username
      );

      if (response.success) {
        const newFriend: Friend = {
          id: contact.user_id,
          username,
          burnoutlevel: 0,
        };
        setFriends([...friends, newFriend]);
      } else {
        setError(response.error || 'Failed to add friend');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response: ApiResponse = await api.removeFriend(user.id, friendId);

      if (response.success) {
        setFriends(friends.filter((f) => f.id !== friendId));
      } else {
        setError(response.error || 'Failed to remove friend');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <button onClick={goBack} className="back-btn">← Назад</button>
      <h2>Мои друзья</h2>
      
      {error && <div className="error">{error}</div>}

      <div className="friends-list">
        {friends.length === 0 ? (
          <p>У вас пока нет друзей</p>
        ) : (
          friends.map(friend => (
            <div key={friend.id} className="friend-item">
              <div className="friend-info">
                <span className="friend-username">@{friend.username}</span>
                <BurnoutProgress level={friend.burnoutlevel} />
              </div>
              <button 
                onClick={() => handleRemoveFriend(friend.id)} 
                className="remove-btn"
              >
                Удалить
              </button>
            </div>
          ))
        )}
      </div>

      <button onClick={handleAddFriend} className="add-friend-btn">Добавить друга</button>
    </div>
  );
}
