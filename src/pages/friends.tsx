import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Friend } from '../lib/types';

// Динамический импорт компонентов
const Loader = dynamic(() => import('../components/Loader'), { ssr: false });
const BurnoutProgress = dynamic(() => import('../components/BurnoutProgress'), { 
  ssr: false,
  loading: () => <div className="progress-container">Загрузка...</div>
});

const FRIENDS_CACHE_KEY = 'friends_cache';

const MemoizedBurnoutProgress = React.memo(BurnoutProgress);

export default function Friends() {
  const router = useRouter();
  const { user, initData, webApp } = useTelegram();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Prefetch основных страниц
  React.useEffect(() => {
    router.prefetch('/');
    router.prefetch('/shop');
    router.prefetch('/reference');
  }, [router]);

  // Загрузка друзей с кэшированием
  const { data: friendsResponse, isLoading, error } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return { success: false, data: [] };
      
      const cached = sessionStorage.getItem(FRIENDS_CACHE_KEY);
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }
      
      const response = await api.getFriends(initData);
      if (response.success && response.data && Array.isArray(response.data)) {
        const formattedFriends = response.data.map(f => ({
          id: f.id,
          friend_id: f.friend.id,
          friend_username: f.friend.username || 
                          `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
          burnout_level: f.friend.burnout_level
        }));
        
        sessionStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(formattedFriends));
        return { success: true, data: formattedFriends };
      }
      return response;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
  });

  const friends = friendsResponse?.success ? friendsResponse.data : [];

  // Мутация для удаления друга
  const deleteMutation = useMutation({
    mutationFn: (friendId: number) => api.deleteFriend(friendId, initData),
    onSuccess: (_, friendId) => {
      const updatedFriends = friends.filter(f => f.id !== friendId);
      sessionStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(updatedFriends));
      queryClient.setQueryData(['friends', user?.id], { success: true, data: updatedFriends });
    }
  });

  const handleDelete = useCallback((friendId: number) => {
    deleteMutation.mutate(friendId);
  }, [deleteMutation]);

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'your_bot_username';
  const referralCode = `ref_${user?.id || 'default'}`;
  const referralLink = `https://t.me/${botUsername}/HealthBreake?startapp=${referralCode}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const handleShare = useCallback(() => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Добро пожаловать на борт!')}`;

    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(shareUrl);
    } else if (webApp?.openLink) {
      webApp.openLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  }, [referralLink, webApp]);

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
        {error && <div className="error">{error.toString()}</div>}
        {!friendsResponse?.success && friendsResponse?.error && (
          <div className="error">{friendsResponse.error}</div>
        )}
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty">У вас не добавлены участники команды</div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-name">{friend.friend_username}</div>
                  <MemoizedBurnoutProgress level={friend.burnout_level} />
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(friend.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
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
          <button 
            className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}
            onMouseEnter={() => router.prefetch('/')}
          >
            📊
          </button>
        </Link>
        <Link href="/friends" passHref>
          <button 
            className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}
            onMouseEnter={() => router.prefetch('/friends')}
          >
            📈
          </button>
        </Link>
        <Link href="/shop" passHref>
          <button 
            className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}
            onMouseEnter={() => router.prefetch('/shop')}
          >
            🛍️
          </button>
        </Link>
        <Link href="/reference" passHref>
          <button 
            className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}
            onMouseEnter={() => router.prefetch('/reference')}
          >
            ℹ️
          </button>
        </Link>
      </div>
    </div>
  );
}
