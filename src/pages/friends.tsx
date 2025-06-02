import React, { useState, useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram.ts';
import { api } from '../../lib/api';
import { useRouter } from 'next/router';
import { Loader } from '../../components/Loader';
import { BurnoutProgress } from '../../components/BurnoutProgress';
import { UserProfile } from '../../lib/supabase';

export default function FriendsPage() {
  const { user: telegramUser, isReady } = useTelegram();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isReady || !telegramUser?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Загружаем профиль пользователя
        const profileResponse = await api.getUserData(telegramUser.id);
        if (profileResponse.success && profileResponse.data) {
          setUserProfile(profileResponse.data);
        }

        // Загружаем список друзей
        if (profileResponse.success && profileResponse.data) {
          const friendsResponse = await api.getFriends(profileResponse.data.id);
          if (friendsResponse.success && friendsResponse.data) {
            setFriends(friendsResponse.data);
          }
        }

        setLoading(false);
      } catch (err) {
        setError('Ошибка загрузки данных');
        setLoading(false);
      }
    };

    loadData();
  }, [isReady, telegramUser]);

  // Обработка инвайт-кода из URL
  useEffect(() => {
    if (router.isReady) {
      const { invite } = router.query;
      if (invite && typeof invite === 'string') {
        setInviteCode(invite);
        // Очищаем параметр из URL
        router.replace('/friends', undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query]);

  const handleGenerateInvite = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.generateInviteLink(userProfile.id);
      
      if (response.success && response.data?.link) {
        setInviteLink(response.data.link);
      } else {
        setError(response.error || 'Ошибка генерации ссылки');
      }
    } catch (err) {
      setError('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!userProfile || !inviteCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.acceptInvite(userProfile.id, inviteCode);
      
      if (response.success) {
        // Обновляем список друзей
        const friendsResponse = await api.getFriends(userProfile.id);
        if (friendsResponse.success && friendsResponse.data) {
          setFriends(friendsResponse.data);
        }
        setInviteCode('');
        
        // Показываем уведомление
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Друг успешно добавлен!');
        } else {
          alert('Друг успешно добавлен!');
        }
      } else {
        setError(response.error || 'Ошибка принятия приглашения');
      }
    } catch (err) {
      setError('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleShareInvite = () => {
    if (!inviteLink) return;
    
    // Используем нативный метод Telegram для шаринга
    if (window.Telegram?.WebApp?.shareUrl) {
      window.Telegram.WebApp.shareUrl(inviteLink);
    } 
    // Fallback для браузера
    else if (navigator.share) {
      navigator.share({ url: inviteLink });
    } 
    // Копирование в буфер
    else {
      navigator.clipboard.writeText(inviteLink);
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Ссылка скопирована в буфер!');
      } else {
        alert('Ссылка скопирована в буфер!');
      }
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <h2>Мои друзья</h2>
      
      {error && <div className="error">{error}</div>}
      
      {/* Блок генерации инвайта */}
      <div className="section">
        <button 
          onClick={handleGenerateInvite}
          className="btn primary"
          disabled={!userProfile}
        >
          Создать приглашение
        </button>
        
        {inviteLink && (
          <div className="invite-box">
            <input 
              type="text" 
              value={inviteLink} 
              readOnly 
              className="invite-input"
            />
            <button 
              onClick={handleShareInvite}
              className="btn secondary"
            >
              Поделиться
            </button>
          </div>
        )}
      </div>
      
      {/* Блок принятия инвайта */}
      <div className="section">
        <h3>Принять приглашение</h3>
        <div className="input-group">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Введите код приглашения"
            className="input"
          />
          <button 
            onClick={handleAcceptInvite}
            className="btn primary"
            disabled={!inviteCode}
          >
            Принять
          </button>
        </div>
      </div>
      
      {/* Список друзей */}
      <div className="section">
        <h3>Ваши друзья ({friends.length})</h3>
        
        {friends.length === 0 ? (
          <p className="empty">У вас пока нет друзей</p>
        ) : (
          <div className="friends-list">
            {friends.map(friend => (
              <div key={friend.id} className="friend-card">
                <div className="friend-info">
                  <div className="friend-name">
                    {friend.friend_username}
                  </div>
                </div>
                <BurnoutProgress level={friend.friend_burnout_level} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .section {
          margin-bottom: 25px;
          padding: 20px;
          background: var(--tg-theme-bg-color, #ffffff);
          border-radius: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .invite-box {
          display: flex;
          margin-top: 15px;
        }
        
        .invite-input {
          flex: 1;
          padding: 12px 15px;
          border: 1px solid var(--tg-theme-hint-color, #cccccc);
          border-radius: 10px 0 0 10px;
          font-size: 14px;
          background: var(--tg-theme-secondary-bg-color, #f0f0f0);
          color: var(--tg-theme-text-color,
