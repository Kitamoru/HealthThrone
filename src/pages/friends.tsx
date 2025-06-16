import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api, useFriendsData } from '../lib/api';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// Динамический импорт компонентов
const BurnoutProgress = dynamic(() => 
  import('../components/BurnoutProgress').then(mod => mod.BurnoutProgress),
  { ssr: false }
);

const FRIENDS_QUERY_KEY = 'friends';

export default function Friends() {
  const router = useRouter();
  const { user, initData, webApp } = useTelegram();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Используем хук useFriendsData из api.ts
  const { data: friends = [], isLoading, error } = useFriendsData(
    user?.id?.toString() || '', 
    initData
  );

  // Мутация для удаления друга
  const deleteMutation = useMutation({
    mutationFn: (friendId: number) => 
      api.deleteFriend(friendId, initData),
    onSuccess: () => {
      queryClient.invalidateQueries([FRIENDS_QUERY_KEY, user?.id?.toString()]);
    }
  });

  const handleDelete = (friendId: number) => {
    deleteMutation.mutate(friendId);
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
        {error && <div className="error">{(error as Error).message}</div>}
        {deleteMutation.isError && (
          <div className="error">{(deleteMutation.error as Error).message}</div>
        )}
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
                    disabled={deleteMutation.isLoading}
                  >
                    {deleteMutation.isLoading ? 'Удаление...' : 'Удалить'}
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
                <p>Добавь участника команды</p>
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
        <Link href="/" passHref prefetch>
          <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>
            📊
          </button>
        </Link>
        <Link href="/friends" passHref prefetch>
          <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>
            📈
          </button>
        </Link>
        <Link href="/shop" passHref prefetch>
          <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>
            🛍️
          </button>
        </Link>
        <Link href="/reference" passHref prefetch>
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>ℹ️</button>
        </Link>
      </div>
    </div>
  );
}
