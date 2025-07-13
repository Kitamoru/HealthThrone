import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomMenu from '../components/BottomMenu';

interface Friend {
  id: number;
  friend_id: number;
  friend_username: string;
  burnout_level: number;
  sprite_url: string | null; // Добавлено поле для URL спрайта
}

export default function Friends() {
  const router = useRouter();
  const { user, initData, webApp } = useTelegram();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingFriends, setDeletingFriends] = useState<number[]>([]);
  const [expandedFriendId, setExpandedFriendId] = useState<number | null>(null);
  const contentRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { 
    data: friends = [], 
    isInitialLoading,
    isError,
    error: queryError
  } = useQuery<Friend[]>({
    queryKey: ['friends', userId?.toString()],
    queryFn: async () => {
      if (!userId || !initData) return [];
      
      const response = await api.getFriends(userId.toString(), initData);
      if (response.success && response.data) {
        return response.data.map(f => ({
          id: f.id,
          friend_id: f.friend.id,
          friend_username: f.friend.username || 
                          `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
          burnout_level: f.friend.burnout_level,
          // Добавлено получение URL спрайта
          sprite_url: f.friend.sprites?.image_url || null
        }));
      }
      throw new Error(response.error || 'Failed to load friends');
    },
    enabled: !!userId && !!initData,
    staleTime: 1000 * 60 * 5,
    initialData: () => {
      return queryClient.getQueryData<Friend[]>(['friends', userId?.toString()]);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const deleteFriendMutation = useMutation({
    mutationFn: (friendId: number) => {
      if (!initData) throw new Error('Init data missing');
      return api.deleteFriend(friendId, initData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['friends', userId?.toString()] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user', userId] 
      });
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
  const referralCode = `ref_${userId || 'default'}`;
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

  const toggleExpand = (friendId: number) => {
    setExpandedFriendId(prev => prev === friendId ? null : friendId);
  };

  if (isInitialLoading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="friends-header">
        <h2>Мои союзники</h2>
      </div>
      
      <div className="scrollable-content">
        {isError && (
          <div className="error">
            {queryError?.message || 'Ошибка загрузки друзей'}
          </div>
        )}
        
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty">У вас не призваны союзники</div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => {
                const isExpanded = expandedFriendId === friend.id;
                const contentHeight = contentRefs.current[friend.id]?.scrollHeight;
                
                return (
                  <div 
                    key={friend.id} 
                    className={`friend-card ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div className="friend-content">
                      <div className="friend-sprite">
                        {/* Используем sprite_url друга */}
                        <img
                          src={friend.sprite_url || "/sprite.gif"}
                          alt="Character" 
                          onError={(e) => {
                            e.currentTarget.src = "/sprite.gif";
                          }}
                        />
                      </div>
                      <div className="friend-details">
                        <div className="friend-name">{friend.friend_username}</div>
                        <div className="friend-progress-container">
                          <div 
                            className="friend-progress-bar"
                            style={{ width: `${friend.burnout_level}%` }}
                          />
                        </div>
                      </div>
                      <button 
                        className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(friend.id)}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 6L15 12L9 18" stroke="#0FEE9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Раскрывающаяся область */}
                    <div 
                      className="expandable-content"
                      style={{ 
                        height: isExpanded ? (contentHeight ? `${contentHeight}px` : 'auto') : '0'
                      }}
                    >
                      <div 
                        ref={el => { 
                          contentRefs.current[friend.id] = el; 
                        }}
                        className="expandable-content-inner"
                      >
                        {/* Здесь будет контент */}
                      </div>
                    </div>
                    
                    {/* Временно скрытая кнопка удаления */}
                    {false && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(friend.id)}
                        disabled={deletingFriends.includes(friend.id)}
                      >
                        {deletingFriends.includes(friend.id) 
                          ? 'Удаление...' 
                          : 'Удалить'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="add-friend-section">
          <button 
            className="add-friend-btn"
            onClick={() => setShowModal(true)}
          >
            Призвать союзника
          </button>
          <div className="add-friend-hint">
            Призови союзника и продолжи приключение вместе
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="custom-modal-header">
                <h3>Активировать свиток призыва</h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="custom-modal-body">
                <p>Призови союзника</p>
                <div className="referral-link-container">
                  <input 
                    type="text" 
                    value={referralLink} 
                    readOnly 
                    className="custom-input"
                  />
                  <button 
                    className={`copy-btn ${copied ? 'copied' : ''}`} 
                    onClick={handleCopy}
                  >
                    {copied ? 'Скопировано!' : 'Копировать'}
                  </button>
                </div>
                <button 
                  className="share-btn"
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

      <BottomMenu />
    </div>
  );
}
