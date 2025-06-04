import React, { useState, useEffect } from 'react';
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
    const response = await api.getFriends(user.id, initData) as ApiResponse<any[]>;
    
    if (response.success && response.data) {
      // Преобразуем данные в нужный формат
      const formattedFriends = response.data.map(f => ({
        id: f.id, // ID записи в friends
        friend_id: f.friend.id, // ID пользователя-друга
        friend_username: f.friend.username || 
                        `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
        burnout_level: f.friend.burnout_level
      }));
      
      setFriends(formattedFriends);
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
      const response = await api.deleteFriend(friendId, initData) as ApiResponse;
      if (response.success) {
        setFriends(friends.filter(f => f.id !== friendId));
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
      {/* Основной контент с возможностью прокрутки */}
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
        
        {/* Модальное окно в стиле приложения */}
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
      
      {/* Закрепленное меню внизу страницы */}
      <div className="menu">
        <button className="menu-btn" onClick={() => router.push('/')}>📊</button>
        <button className="menu-btn active">📈</button>
        <button className="menu-btn" onClick={() => router.push('/settings')}>⚙️</button>
        <button className="menu-btn" onClick={() => router.push('/info')}>ℹ️</button>
      </div>
    </div>
  );
}
