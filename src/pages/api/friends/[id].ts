import React, { useState, useCallback } from 'react';
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
  const queryClient = useQueryClient();
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const { 
    data: friends, 
    isLoading, 
    isError,
    error: queryError
  } = useQuery({
    queryKey: ['friends', user?.id],
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
    staleTime: 5 * 60 * 1000,
  });

  const deleteFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      if (!initData) throw new Error('Init data missing');
      setDeletingIds(prev => [...prev, friendId]);
      return api.deleteFriend(friendId, initData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
    onSettled: (_, __, friendId) => {
      setDeletingIds(prev => prev.filter(id => id !== friendId));
    }
  });

  const handleDelete = useCallback((friendId: number) => {
    if (!deletingIds.includes(friendId)) {
      deleteFriendMutation.mutate(friendId);
    }
  }, [deleteFriendMutation, deletingIds]);

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
            Добавить
          </button>
        </div>
        
        {isError && (
          <div className="error">{queryError?.message || 'Ошибка загрузки друзей'}</div>
        )}
        
        {deleteFriendMutation.isError && (
          <div className="error">Ошибка при удалении друга</div>
        )}
        
        <div className="friends-list">
          {!friends || friends.length === 0 ? (
            <div className="empty">У вас не добавлены участники команды</div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => {
                const isDeleting = deletingIds.includes(friend.id);
                return (
                  <div key={friend.id} className="friend-card">
                    <div className="friend-name">{friend.friend_username}</div>
                    <BurnoutProgress level={friend.burnout_level} />
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(friend.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                );
              })}
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
          <button 
            className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}
            onMouseEnter={() => queryClient.prefetchQuery({ 
              queryKey: ['user', user?.id],
              queryFn: () => user?.id && initData 
                ? api.getUserData(Number(user.id), initData)
                : Promise.resolve(null),
            })}
          >
            📊
          </button>
        </Link>
        <Link href="/friends" passHref>
          <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>
            📈
          </button>
        </Link>
        <Link href="/shop" passHref>
          <button 
            className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}
            onMouseEnter={() => queryClient.prefetchQuery({ 
              queryKey: ['sprites'],
              queryFn: () => api.getSprites(initData),
            })}
          >
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
