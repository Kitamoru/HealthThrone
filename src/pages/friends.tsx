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

// Убираем generic, делаем единый интерфейс
interface ApiResponse {
  success: boolean;
  data?: any; // Универсальный тип
  error?: string;
}

// Интерфейс для контакта Telegram
interface TelegramContact {
  userid: number;
  username?: string;
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

        // Убираем generic из типа ответа
        const response: ApiResponse = await api.getFriends(user.id);
        if (response.success && response.data) {
          // Приводим тип данных к Friend[]
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
      // Используем корректный метод из Telegram WebApp
      webApp.openContactForm((contact: TelegramContact) => {
        if (contact) {
          addFriendByContact(contact);
        }
      });
    } catch (err) {
      console.error('Failed to request contact', err);
      setError('Failed to request contact');
    }
  };

  const addFriendByContact = async (contact: TelegramContact) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response: ApiResponse = await api.addFriend(
        user.id, 
        contact.userid, 
        contact.username || `user_${contact.userid}`
      );

      if (response.success) {
        const newFriend: Friend = {
          id: contact.userid,
          username: contact.username || `user_${contact.userid}`,
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
