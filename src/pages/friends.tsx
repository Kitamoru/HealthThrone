import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomMenu from '../components/BottomMenu';
import { motion, AnimatePresence } from 'framer-motion';
import OctagramStatic from '../components/OctagramStatic'; 
import { useOctalysisFactors } from '../lib/api';
import { getClassDescription } from '../lib/characterHelper';

interface Friend {
  id: number;
  friend_id: number;
  friend_username: string;
  burnout_level: number;
  sprite_url: string | null;
  character_class: string | null;
}

export default function Friends() {
  const router = useRouter();
  const { user, initData, webApp } = useTelegram();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingFriends, setDeletingFriends] = useState<number[]>([]);
  const [expandedFriendId, setExpandedFriendId] = useState<number | null>(null);
  const [friendToDelete, setFriendToDelete] = useState<number | null>(null);
  const contentRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const queryClient = useQueryClient();
  const userId = user?.id;

  const handleFriendClassClick = (characterClass: string | null) => {
    const className = characterClass || 'Странник';
    const description = getClassDescription(className);
    alert(description);
  };

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
          sprite_url: f.friend.sprites?.image_url || null,
          character_class: f.friend.character_class
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
        setShowDeleteModal(false);
        setFriendToDelete(null);
      }
    });
  };

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'your_bot_username';
  const referralCode = `ref_${userId || 'default'}`;
  const referralLink = `https://t.me/${botUsername}/Moraleon?startapp=${referralCode}`;
  
  // Fallback для Android WebView, где navigator.clipboard недоступен
  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Fallback copy failed', e);
    }
    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // navigator.clipboard недоступен или выбросил ошибку — используем fallback
      fallbackCopy(referralLink);
    }
  };

  const handleShare = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('✨ Твоя мотивация — искра. Вместе мы — пламя!🔥\nПрисоединяйся ко мне в MORALEON!⚔️')}`;
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  const toggleExpand = (friendId: number) => {
    setExpandedFriendId(prev => prev === friendId ? null : friendId);
  };

  const FriendOctagram = ({ friendId }: { friendId: number }) => {
    const { data: factors, isLoading, isError } = useOctalysisFactors(friendId, initData);
    
    if (isLoading) return <div className="octagram-loader">Загрузка мотивации...</div>;
    if (isError) return <div className="octagram-error">Ошибка загрузки</div>;
    
    const octagramValues = factors?.map(factor => {
      const normalized = factor / 30;
      return Math.max(0, Math.min(1, normalized));
    }) || [-1, -1, -1, -1, -1, -1, -1, -1];
    
    return (
      <OctagramStatic values={octagramValues} />
    );
  };

  if (isInitialLoading) {
    return <Loader />;
  }

  return (
    <div className="container"> 
      <div className="scrollable-content">
        <div className="friends-header">
          <h2>Мои союзники</h2>
        </div>
        
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
                        <div 
                          className="friend-class-container"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFriendClassClick(friend.character_class);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="friend-class-badge">
                            {friend.character_class || 'Странник'}
                          </div>
                        </div>
                        
                        <div className="friend-octagram-container">
                          <FriendOctagram friendId={friend.friend_id} />
                        </div>
                        
                        <button 
                          className="delete-btn"
                          onClick={() => {
                            setFriendToDelete(friend.id);
                            setShowDeleteModal(true);
                          }}
                          disabled={deletingFriends.includes(friend.id)}
                        >
                          Изгнать союзника
                        </button>
                      </div>
                    </div>
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

        {/* Модальное окно для добавления друга */}
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

        {/* Модальное окно для подтверждения удаления */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="custom-modal-header">
                <h3>Активировать свиток изгнания</h3>
                <button 
                  className="close-btn" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFriendToDelete(null);
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="custom-modal-body">
                <p style={{ textAlign: 'left' }}>
                  Вы уверены, что хотите изгнать союзника? Он перестанет быть частью вашей команды.
                </p>
                <div className="confirmation-buttons">
                  <button 
                    className="keep-btn"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setFriendToDelete(null);
                    }}
                  >
                    Оставить
                  </button>
                  <button 
                    className="delete-btn-modal"
                    onClick={() => friendToDelete && handleDelete(friendToDelete)}
                    disabled={friendToDelete !== null && deletingFriends.includes(friendToDelete)}
                  >
                    {friendToDelete && deletingFriends.includes(friendToDelete) 
                      ? 'Изгнание...' 
                      : 'Изгнать'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomMenu />
    </div>
  );
}
