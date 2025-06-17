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
} from '../lib/apiHooks';
import { queryClient } from '../lib/queryClient';

interface Sprite {
  id: number;
  name: string;
  image_url: string;
  price: number;
}

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
      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image')}
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
              {isProcessing ? '⏳' : 'Купить'}
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
            {isProcessing ? '⏳' : isEquipped ? 'Применён' : 'Применить'}
          </button>
        )}
      </div>
    </div>
  </div>
));

export default function Shop() {
  const router = useRouter();
  const { user } = useTelegram();
  const telegramId = Number(user?.id);
  
  const { 
    data: userResponse, 
    isLoading: userLoading, 
    error: userError 
  } = useUserData(telegramId);
  
  const { 
    data: spritesResponse, 
    isLoading: spritesLoading, 
    error: spritesError 
  } = useSpritesData();
  
  const { 
    data: ownedResponse, 
    isLoading: ownedLoading, 
    error: ownedError 
  } = useOwnedSprites(telegramId);
  
  const purchaseMutation = usePurchaseSprite();
  const equipMutation = useEquipSprite();
  
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const errorMessage = error || userError?.message || 
    spritesError?.message || ownedError?.message;

  const handlePurchase = useCallback(async (spriteId: number) => {
    if (!user?.id) {
      setError('Пользователь не определен');
      return;
    }

    const sprite = sprites.find((item) => item.id === spriteId);
    if (!sprite) {
      setError('Спрайт не найден');
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      setError('Вы уже приобрели этот спрайт.');
      return;
    }

    if (coins < sprite.price) {
      setError('У вас недостаточно монет для покупки.');
      return;
    }

    try {
      setProcessing(spriteId);
      await purchaseMutation.mutateAsync({
        telegramId: Number(user.id),
        spriteId
      });
      
      queryClient.invalidateQueries({ queryKey: ['ownedSprites', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['user', telegramId] });
      setError(null);
    } catch (err) {
      setError('Возникла проблема при покупке');
    } finally {
      setProcessing(null);
    }
  }, [user, sprites, ownedSprites, coins, purchaseMutation]);

  const handleEquip = useCallback(async (spriteId: number) => {
    if (!user?.id) {
      setError('Пользователь не определен');
      return;
    }

    try {
      setProcessing(spriteId);
      await equipMutation.mutateAsync({
        telegramId: Number(user.id),
        spriteId
      });
      
      queryClient.invalidateQueries({ queryKey: ['user', telegramId] });
      setError(null);
    } catch (err) {
      setError('Проблема при применении спрайта');
    } finally {
      setProcessing(null);
    }
  }, [user, equipMutation]);

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

        {errorMessage && <div className="error">{errorMessage}</div>}

        {!user?.id ? (
          <div className="error">
            Пользователь не авторизован
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов</div>
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

      <div className="menu">
        <Link href="/" passHref>
          <button className="menu-btn">📊</button>
        </Link>
        <Link href="/friends" passHref>
          <button className="menu-btn">📈</button>
        </Link>
        <Link href="/shop" passHref>
          <button className="menu-btn active">🛍️</button>
        </Link>
        <Link href="/reference" passHref>
          <button className="menu-btn">ℹ️</button>
        </Link>
      </div>
    </div>
  );
}
