import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { 
  useUserData, 
  useSpritesData, 
  useOwnedSprites,
  usePurchaseSprite,
  useEquipSprite
} from '../lib/api';
import { Sprite } from '../lib/types';
import { validateRequiredFields } from '../utils/validation';
import { queryClient } from '../lib/queryClient';
import BottomMenu from '../components/BottomMenu';

const SpriteCard = React.memo(({ 
  sprite, 
  coins, 
  isOwned, 
  isEquipped, 
  isProcessing, 
  onPurchase, 
  onEquip 
}: { 
  sprite: Sprite;
  coins: number;
  isOwned: boolean;
  isEquipped: boolean;
  isProcessing: boolean;
  onPurchase: (id: number) => void;
  onEquip: (id: number) => void;
}) => (
  <div className="sprite-card">
    <img
      src={sprite.image_url}
      alt={sprite.name}
      className="sprite-image"
      onError={(e) =>
        (e.currentTarget.src =
          'https://via.placeholder.com/150?text=No+Image')
      }
    />
    <div className="sprite-info">
      <h3>{sprite.name}</h3>
      <div className="sprite-price">
        <span className="price-text">
          {' '}
          {sprite.price > 0 ? `${sprite.price}` : 'Бесплатно'}
        </span>
        {sprite.price > 0 && (
          <img 
            src="/coins.svg" 
            className="coin-icon" 
            alt="монеты" 
          />
        )}
      </div>
      <div className="sprite-actions">
        {!isOwned ? (
          coins >= sprite.price ? (
            <button
              className={`buy-btn ${isProcessing ? 'processing' : ''}`}
              onClick={() => !isProcessing && onPurchase(sprite.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="button-loader">⏳</span>
              ) : (
                'Купить'
              )}
            </button>
          ) : (
            <button className="buy-btn disabled" disabled>
              Недоступен
            </button>
          )
        ) : (
          <button
            className={`equip-btn ${isEquipped ? 'equipped' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={() => !isProcessing && onEquip(sprite.id)}
            disabled={isProcessing || isEquipped}
          >
            {isProcessing ? (
              <span className="button-loader">⏳</span>
            ) : isEquipped ? (
              'Вызван'
            ) : (
              'Вызвать'
            )}
          </button>
        )}
      </div>
    </div>
  </div>
), 
(prevProps, nextProps) => 
  prevProps.sprite.id === nextProps.sprite.id &&
  prevProps.coins === nextProps.coins &&
  prevProps.isOwned === nextProps.isOwned &&
  prevProps.isEquipped === nextProps.isEquipped &&
  prevProps.isProcessing === nextProps.isProcessing
);

export default function Shop() {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const telegramId = Number(user?.id);
  
  const { 
    data: userResponse, 
    isLoading: userLoading, 
    error: userError 
  } = useUserData(telegramId, initData);
  
  const { 
    data: spritesResponse, 
    isLoading: spritesLoading, 
    error: spritesError 
  } = useSpritesData(initData);
  
  const { 
    data: ownedResponse, 
    isLoading: ownedLoading, 
    error: ownedError 
  } = useOwnedSprites(telegramId, initData);
  
  const purchaseMutation = usePurchaseSprite();
  const equipMutation = useEquipSprite();
  
  const [processing, setProcessing] = useState<number | null>(null);
  const [errors, setErrors] = useState({
    purchase: '',
    equip: '',
    general: ''
  });

  // Извлекаем данные с дефолтными значениями
  const coins = userResponse?.success ? userResponse.data?.coins || 0 : 0;
  const currentSprite = userResponse?.success 
    ? userResponse.data?.current_sprite_id || null 
    : null;
  
  const ownedSprites = ownedResponse?.success 
    ? ownedResponse.data || [] 
    : [];
  
  const sprites = spritesResponse?.success 
    ? spritesResponse.data || [] 
    : [];

  const isLoading = userLoading || spritesLoading || ownedLoading;
  
  // Объединяем все возможные ошибки
  const errorMessage = useMemo(() => {
    return errors.purchase || errors.equip || errors.general ||
      userError?.message || spritesError?.message || ownedError?.message ||
      (userResponse && !userResponse.success ? userResponse.error : null) ||
      (spritesResponse && !spritesResponse.success ? spritesResponse.error : null) ||
      (ownedResponse && !ownedResponse.success ? ownedResponse.error : null);
  }, [
    errors, 
    userError, 
    spritesError, 
    ownedError, 
    userResponse, 
    spritesResponse, 
    ownedResponse
  ]);

  const handlePurchase = useCallback(async (spriteId: number) => {
    if (!user?.id) {
      setErrors(prev => ({ ...prev, purchase: 'User not defined' }));
      return;
    }

    try {
      setProcessing(spriteId);
      setErrors({ purchase: '', equip: '', general: '' });
      
      const purchaseResult = await purchaseMutation.mutateAsync({
        telegramId: Number(user.id),
        spriteId,
        initData
      });
      
      if (purchaseResult.success) {
        const currentTelegramId = Number(user.id);
        await Promise.all([
          queryClient.invalidateQueries({ 
            queryKey: ['user', currentTelegramId] 
          }),
          queryClient.invalidateQueries({ 
            queryKey: ['ownedSprites', currentTelegramId] 
          })
        ]);
      }
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        purchase: err.message || 'Purchase failed' 
      }));
    } finally {
      setProcessing(null);
    }
  }, [user, initData, purchaseMutation]);

  const handleEquip = useCallback(async (spriteId: number) => {
    if (!user?.id) {
      setErrors(prev => ({ ...prev, equip: 'User not defined' }));
      return;
    }

    const validationError = validateRequiredFields(
      { user, initData },
      ['user', 'initData'],
      'Необходимые данные отсутствуют.'
    );
    
    if (validationError) {
      setErrors(prev => ({ ...prev, equip: validationError }));
      return;
    }

    try {
      setProcessing(spriteId);
      setErrors({ purchase: '', equip: '', general: '' });
      
      const equipResult = await equipMutation.mutateAsync({
        telegramId: Number(user.id),
        spriteId,
        initData
      });
      
      if (equipResult.success) {
        const currentTelegramId = Number(user.id);
        
        // Точечное обновление вместо полной инвалидации
        queryClient.setQueryData<typeof userResponse>(
          ['user', currentTelegramId], 
          (old) => {
            if (!old || !old.success || !old.data) return old;
            
            return {
              ...old,
              data: {
                ...old.data,
                current_sprite_id: spriteId
              }
            };
          }
        );
      } else {
        setErrors(prev => ({ 
          ...prev, 
          equip: equipResult.error || 'Ошибка при применении спрайта.' 
        }));
      }
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        equip: 'Проблема с сетью при попытке применить спрайт.' 
      }));
    } finally {
      setProcessing(null);
    }
  }, [user, initData, equipMutation]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="shop-header">
          <h2 className="shop-title">Лавка фамильяров</h2>
          <div className="coins-display">
            <span className="coins-text">{coins}</span>
            <img 
              src="/coins.svg" 
              className="coin-icon" 
              alt="монеты" 
            />
          </div>
        </div>

        {errorMessage && (
          <div className="error">
            {errorMessage}
          </div>
        )}

        {!user?.id ? (
          <div className="error">
            Пользователь не авторизован. Перезагрузите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных фамильяров.</div>
        ) : (
          <div className="sprites-grid">
            {sprites.map((sprite) => (
              <SpriteCard
                key={sprite.id}
                sprite={sprite}
                coins={coins}
                isOwned={ownedSprites.includes(sprite.id)}
                isEquipped={currentSprite === sprite.id}
                isProcessing={processing === sprite.id}
                onPurchase={handlePurchase}
                onEquip={handleEquip}
              />
            ))}
          </div>
        )}
      </div>

      <BottomMenu />
    </div>
  );
}
