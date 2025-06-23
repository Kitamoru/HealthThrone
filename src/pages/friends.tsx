import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Friend {
  id: number;
  friend_id: number;
  friend_username: string;
  burnout_level: number;
}

interface BurnoutProgressProps {
  level: number;
}

const BurnoutProgress = React.memo(({ level }: BurnoutProgressProps) => {
  return (
    <div className="progress-container">
      <div 
        className="progress-bar"
        style={{ width: `${level}%` }}
      />
      <span className="progress-text">{level}%</span>
    </div>
  );
});

export default function Friends() {
  const router = useRouter();
  const { user, initData, webApp } = useTelegram();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingFriends, setDeletingFriends] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { 
    data: friends, 
    isLoading, 
    isError,
    error: queryError
  } = useQuery({
    queryKey: ['friends', user?.id?.toString()],
    queryFn: async () => {
      if (!user?.id || !initData) return [];
      
      const response = await api.getFriends(user.id.toString(), initData);
      if (response.success && response.data) {
        return response.data.map(f => ({
          id: f.id,
          friend_id: f.friend.id,
          friend_username: f.friend.username || 
                          `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
          burnout_level: f.friend.burnout_level
        }));
      }
      throw new Error(response.error || 'Failed to load friends');
    },
    enabled: !!user?.id && !!initData,
  });

  const deleteFriendMutation = useMutation({
    mutationFn: (friendId: number) => {
      if (!initData) throw new Error('Init data missing');
      return api.deleteFriend(friendId, initData);
    },
    onSuccess: () => {
      // Инвалидируем данные друзей и пользователя
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id?.toString()] });
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
    },
  });

  const handleDelete = (friendId: number) => {
    setDeletingFriends(prev => [...prev, friendId]);
    deleteFriendMutation.mutate(friendId, {
      onSettled: () => {
        setDeletingFriends(prev => prev.filter(id => id !== friendId));
      }
    });
  };

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'your_bot_username';
  const referralCode = `ref_${user?.id || 'default'}`;
  const referralLink = `https://t.me/${botUsername}/Moraleon?startapp=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('✨ Твоя мотивация — искра. Вместе мы — пламя!🔥\nПрисоединяйся к команде в MORALEON!⚔️')}`;
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(shareUrl);
    } else if (webApp?.openLink) {
      webApp.openLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  if (isLoading) {
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
            Призвать
          </button>
        </div>
        
        {isError && (
          <div className="error">{queryError?.message || 'Ошибка загрузки друзей'}</div>
        )}
        
        <div className="friends-list">
          {!friends || friends.length === 0 ? (
            <div className="empty">У вас не призваны участники команды</div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-name">{friend.friend_username}</div>
                  <BurnoutProgress level={friend.burnout_level} />
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(friend.id)}
                    disabled={deletingFriends.includes(friend.id)}
                  >
                    {deletingFriends.includes(friend.id) ? 'Удаление...' : 'Удалить'}
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
                <h3>Активировать свиток</h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="custom-modal-body">
                <p>Призови участника команды</p>
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
                  Призвать
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
        <Link href="/shop" passHref>
          <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>
            🛍️
          </button>
        </Link>
        <Link href="/reference" passHref>
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>
            ℹ️
          </button>
        </Link>
      </div>
    </div>
  );
}
