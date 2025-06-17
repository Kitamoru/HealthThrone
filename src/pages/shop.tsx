import React, { useState, useCallback } from 'react';
import Link from 'next/link';
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
import { validateRequiredFields } from '../utils/validation';

interface SpriteCardProps {
  sprite: any;
  isOwned: boolean;
  isEquipped: boolean;
  coins: number;
  processing: number | null;
  onPurchase: (spriteId: number) => void;
  onEquip: (spriteId: number) => void;
}

const SpriteCard = React.memo(({ 
  sprite, 
  isOwned, 
  isEquipped, 
  coins, 
  processing,
  onPurchase,
  onEquip
}: SpriteCardProps) => {
  const isProcessing = processing === sprite.id;

  return (
    <div className="sprite-card">
      <img
        src={sprite.image_url}
        alt={sprite.name}
        className="sprite-image"
        onError={(e) =>
          (e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image')
        }
      />
      <div className="sprite-info">
        <h3>{sprite.name}</h3>
        <div className="sprite-price">
          Цена: {sprite.price > 0 ? `${sprite.price} монет` : 'Бесплатно'}
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
                Недостаточно
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
                'Применён'
              ) : (
                'Применить'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

SpriteCard.displayName = 'SpriteCard';

export default function Shop() {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const [processing, setProcessing] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const telegramId = user?.id ? Number(user.id) : 0;
  
  const { 
    data: userData, 
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

  const coins = userData?.data?.coins || 0;
  const currentSprite = userData?.data?.current_sprite_id || null;
  const ownedSprites = ownedResponse?.data || [];
  const sprites = spritesResponse?.data || [];

  const isLoading = userLoading || spritesLoading || ownedLoading;
  const anyError = validationError || 
                  userError || 
                  spritesError || 
                  ownedError || 
                  purchaseMutation.error || 
                  equipMutation.error;

  const handlePurchase = useCallback(async (spriteId: number) => {
    const validationError = validateRequiredFields(
      { user, initData },
      ['user', 'initData'],
      'Необходимо наличие обоих данных'
    );
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    if (!user?.id) {
      setValidationError('Пользователь не определен');
      return;
    }

    const sprite = sprites.find((item: any) => item.id === spriteId);
    if (!sprite) {
      setValidationError('Спрайт не найден');
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      setValidationError('Вы уже приобрели этот спрайт.');
      return;
    }

    if (coins < sprite.price) {
      setValidationError('У вас недостаточно монет для покупки.');
      return;
    }

    try {
      setValidationError(null);
      purchaseMutation.reset();
      equipMutation.reset();
      
      setProcessing(spriteId);
      await purchaseMutation.mutateAsync({ 
        telegramId: Number(user.id), 
        spriteId, 
        initData 
      });
    } catch (err) {
      // Ошибка обрабатывается автоматически через mutation.error
    } finally {
      setProcessing(null);
    }
  }, [user, initData, sprites, ownedSprites, coins, purchaseMutation, equipMutation]);

  const handleEquip = useCallback(async (spriteId: number) => {
    const validationError = validateRequiredFields(
      { user, initData },
      ['user', 'initData'],
      'Необходимые данные отсутствуют.'
    );
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    if (!user?.id) {
      setValidationError('Пользователь не определен');
      return;
    }

    try {
      setValidationError(null);
      purchaseMutation.reset();
      equipMutation.reset();
      
      setProcessing(spriteId);
      await equipMutation.mutateAsync({ 
        telegramId: Number(user.id), 
        spriteId, 
        initData 
      });
    } catch (err) {
      // Ошибка обрабатывается автоматически через mutation.error
    } finally {
      setProcessing(null);
    }
  }, [user, initData, purchaseMutation, equipMutation]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Магазин спрайтов</h2>
          <div className="coins-display">Монеты: {coins}</div>
        </div>

        {anyError && <div className="error">{anyError}</div>}

        {!user?.id ? (
          <div className="error">
            Пользователь не авторизован. Перезагрузите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
        ) : (
          <div className="sprites-grid">
            {sprites.map((sprite: any) => {
              const isOwned = ownedSprites.includes(sprite.id);
              const isEquipped = currentSprite === sprite.id;

              return (
                <SpriteCard
                  key={sprite.id}
                  sprite={sprite}
                  isOwned={isOwned}
                  isEquipped={isEquipped}
                  coins={coins}
                  processing={processing}
                  onPurchase={handlePurchase}
                  onEquip={handleEquip}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="menu">
        <Link href="/" passHref prefetch>
          <button className="menu-btn">📊</button>
        </Link>
        <Link href="/friends" passHref prefetch>
          <button className="menu-btn">📈</button>
        </Link>
        <Link href="/shop" passHref prefetch>
          <button className="menu-btn active">🛍️</button>
        </Link>
        <Link href="/reference" passHref prefetch>
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>ℹ️</button>
        </Link>
      </div>
    </div>
  );
}
