// ./src/pages/friends.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';

interface Friend {
  id: number;
  friend_id: number;
  friend_username: string;
  burnout_level: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Компонент прогресс-бара для отображения уровня выгорания
interface BurnoutProgressProps {
  level: number;
}

const BurnoutProgress: React.FC<BurnoutProgressProps> = ({ level }) => {
  return (
    <div className="progress-container">
      <div 
        className="progress-bar"
        style={{ width: `${level}%` }}
      />
      <span className="progress-text">{level}%</span>
    </div>
  );
};

const FRIENDS_CACHE_KEY = 'friends_cache';

export default function Friends() {
  const router = useRouter();
  const { user, isReady, initData, webApp } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isReady || !user?.id) return;

    const loadFriends = async () => {
      try {
        setLoading(true);

        // Проверка кэша
        const cached = sessionStorage.getItem(FRIENDS_CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Проверяем что в кэше массив
          if (Array.isArray(parsedCache)) {
            setFriends(parsedCache);
          } else {
            sessionStorage.removeItem(FRIENDS_CACHE_KEY);
          }
        }

        const response = await api.getFriends(user.id, initData);
        if (response.success && response.data && Array.isArray(response.data)) {
          const formattedFriends = response.data.map(f => ({
            id: f.id,
            friend_id: f.friend.id,
            friend_username: f.friend.username || 
                            `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
            burnout_level: f.friend.burnout_level
          }));

          setFriends(formattedFriends);
          sessionStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(formattedFriends));
        } else {
          setError(response.error || 'Не удалось загрузить друзей');
        }
      } catch (err) {
        setError('Ошибка сети');
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [isReady, user, initData]);

  const handleDelete = async (friendId: number) => {
    try {
      const response = await api.deleteFriend(friendId, initData);
      if (response.success) {
        const updatedFriends = friends.filter(f => f.id !== friendId);
        setFriends(updatedFriends);
        sessionStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(updatedFriends));
      } else {
        setError(response.error || 'Failed to delete friend');
      }
    } catch (err) {
      setError('Ошибка при удалении друга');
    }
  };

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'your_bot_username';
  const referralCode = `ref_${user?.id || 'default'}`;
  const referralLink = `https://t.me/${botUsername}/HealthBreake?startapp=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Добро пожаловать на борт!')}`;

    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(shareUrl);
    } else if (webApp?.openLink) {
      webApp.openLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Моя команда</h2>
          <button 
            className="answer-btn positive"
            onClick={() => setShowModal(true)}
          >
            Добавить
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty">У вас не добавлены участники команды</div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-name">{friend.friend_username}</div>
                  <BurnoutProgress level={friend.burnout_level} />
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(friend.id)}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="custom-modal-header">
                <h3>Ссылка приглашение</h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="custom-modal-body">
                <p>Добавь участникакоманды</p>
                <div className="referral-link-container">
                  <input 
                    type="text" 
                    value={referralLink} 
                    readOnly 
                    className="custom-input"
                  />
                  <button 
                    className={`answer-btn ${copied ? 'positive' : ''}`} 
                    onClick={handleCopy}
                  >
                    {copied ? 'Скопировано!' : 'Копировать'}
                  </button>
                </div>
                <button 
                  className="answer-btn positive"
                  onClick={handleShare}
                  style={{ marginTop: '15px' }}
                >
                  Поделиться
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="menu">
        <Link href="/" passHref>
          <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>
            📊
          </button>
        </Link>
        <Link href="/friends" passHref>
          <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>
            📈
          </button>
        </Link>
        <Link href="/settings" passHref>
          <button className="menu-btn">⚙️</button>
        </Link>
        <Link href="/info" passHref>
          <button className="menu-btn">ℹ️</button>
        </Link>
      </div>
    </div>
  );
}
