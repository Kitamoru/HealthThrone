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
        const response = await api.getFriends(initData) as ApiResponse<Friend[]>;
        if (response.success) {
          setFriends(Array.isArray(response.data) ? response.data : []);
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

  // Формируем реферальную ссылку
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'your_bot_username';
  const referralCode = `ref_${user?.id}`;
  const referralLink = `https://t.me/${botUsername}?start=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    // Формируем ссылку для шаринга через Telegram
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join my burnout tracking friends!')}`;
    
    // Используем оптимальные методы Telegram WebApp для открытия ссылок
    if (webApp?.openTelegramLink) {
      // Предпочтительный метод для внутренних ссылок Telegram
      webApp.openTelegramLink(shareUrl);
    } else if (webApp?.openLink) {
      // Универсальный метод для всех ссылок
      webApp.openLink(shareUrl);
    } else {
      // Fallback для браузера
      window.open(shareUrl, '_blank');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="header">
        <h2>My Friends</h2>
        <button className="add-friends-btn" onClick={() => setShowModal(true)}>
          Add Friends
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="friends-list">
        {friends.length === 0 ? (
          <div className="empty">You don't have any friends yet</div>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id} className="friend-item">
                <span className="friend-name">{friend.friend_username}</span>
                <span className="burnout-level">{friend.burnout_level}%</span>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(friend.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Invite Friends</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Share your referral link to track friends' burnout levels:</p>
              <div className="referral-link-container">
                <input 
                  type="text" 
                  value={referralLink} 
                  readOnly 
                  className="referral-link-input"
                />
                <button className={`copy-btn ${copied ? 'copied' : ''}`} 
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <button 
                className="share-btn"
                onClick={handleShare}
              >
                Send to Friend
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="menu">
        <button className="menu-btn" onClick={() => router.push('/')}>📊</button>
        <button className="menu-btn active">📈</button>
        <button className="menu-btn">⚙️</button>
        <button className="menu-btn">ℹ️</button>
      </div>
    </div>
  );
}
