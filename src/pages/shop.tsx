import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '@/hooks/useTelegram';
import { Loader } from '@/components/Loader';
import { 
  useUserData, 
  useSpritesData, 
  useOwnedSprites,
  usePurchaseSprite,
  useEquipSprite
} from '@/lib/api';
import { Sprite } from '@/lib/types';
import { validateRequiredFields } from '@/utils/validation';
import { queryClient } from '@/lib/queryClient';

// Компонент карточки спрайта
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
        Цена:{' '}
        {sprite.price > 0 ? `${sprite.price} монет` : 'Бесплатно'}
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
));

export default function Shop() {
  const router = useRouter();
  const { user, initData, webApp } = useTelegram();
  const telegramId = user?.id ? Number(user.id) : null;
  
  const { 
    data: userResponse, 
    isLoading: userLoading,
    isFetched: userFetched,
    error: userError 
  } = useUserData(telegramId || 0, initData);
  
  const { 
    data: spritesResponse, 
    isLoading: spritesLoading,
    isFetched: spritesFetched,
    error: spritesError 
  } = useSpritesData(initData);
  
  const { 
    data: ownedResponse, 
    isLoading: ownedLoading,
    isFetched: ownedFetched,
    error: ownedError 
  } = useOwnedSprites(telegramId || 0, initData);
  
  const purchaseMutation = usePurchaseSprite();
  const equipMutation = useEquipSprite();
  
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Определяем, все ли данные загружены
  const allFetched = userFetched && spritesFetched && ownedFetched;
  const anyError = userError || spritesError || ownedError || 
                  (userResponse && !userResponse.success) || 
                  (spritesResponse && !spritesResponse.success) || 
                  (ownedResponse && !ownedResponse.success);

  // Данные пользователя
  const coins = userResponse?.success ? userResponse.data?.coins || 0 : 0;
  const currentSprite = userResponse?.success 
    ? userResponse.data?.current_sprite_id || null 
    : null;
  
  // Данные спрайтов
  const ownedSprites = ownedResponse?.success 
    ? ownedResponse.data || [] 
    : [];
  const sprites = spritesResponse?.success 
    ? spritesResponse.data || [] 
    : [];

  const handlePurchase = useCallback(async (spriteId: number) => {
    const validationError = validateRequiredFields(
      { user, initData },
      ['user', 'initData'],
      'Необходимо наличие обоих данных'
    );
    if (validationError) {
      setError(validationError);
      return;
    }

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
      setError(null);
      
      const purchaseResult = await purchaseMutation.mutateAsync({
        telegramId: Number(user.id),
        spriteId,
        initData
      });
      
      if (purchaseResult.success) {
        await Promise.all([
          queryClient.invalidateQueries({ 
            queryKey: ['user', telegramId] 
          }),
          queryClient.invalidateQueries({ 
            queryKey: ['ownedSprites', telegramId] 
          }),
          queryClient.invalidateQueries({ 
            queryKey: ['sprites'] 
          })
        ]);
      } else {
        setError(purchaseResult.error || 'Ошибка покупки спрайта.');
      }
    } catch (err) {
      setError('Возникла проблема с сетью при покупке.');
    } finally {
      setProcessing(null);
    }
  }, [user, initData, sprites, ownedSprites, coins, purchaseMutation, telegramId]);

  const handleEquip = useCallback(async (spriteId: number) => {
    const validationError = validateRequiredFields(
      { user, initData },
      ['user', 'initData'],
      'Необходимые данные отсутствуют.'
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.id) {
      setError('Пользователь не определен');
      return;
    }

    try {
      setProcessing(spriteId);
      setError(null);
      
      const equipResult = await equipMutation.mutateAsync({
        telegramId: Number(user.id),
        spriteId,
        initData
      });
      
      if (equipResult.success) {
        await Promise.all([
          queryClient.invalidateQueries({ 
            queryKey: ['user', telegramId] 
          }),
          queryClient.invalidateQueries({ 
            queryKey: ['sprites'] 
          })
        ]);
      } else {
        setError(equipResult.error || 'Ошибка при применении спрайта.');
      }
    } catch (err) {
      setError('Проблема с сетью при попытке применить спрайт.');
    } finally {
      setProcessing(null);
    }
  }, [user, initData, equipMutation, telegramId]);

  // Если данные еще загружаются, показываем лоадер
  if (!allFetched) {
    return <Loader />;
  }

  // Если есть ошибки, показываем сообщение
  if (anyError) {
    const errorMessage = 
      userError?.message || 
      spritesError?.message || 
      ownedError?.message ||
      (userResponse && !userResponse.success ? userResponse.error : null) ||
      (spritesResponse && !spritesResponse.success ? spritesResponse.error : null) ||
      (ownedResponse && !ownedResponse.success ? ownedResponse.error : null) ||
      'Неизвестная ошибка';
    
    return (
      <div className="container">
        <div className="scrollable-content">
          <div className="error">{errorMessage}</div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован ПОСЛЕ загрузки данных
  if (!telegramId) {
    return (
      <div className="container">
        <div className="scrollable-content">
          <div className="error">
            Пользователь не авторизован. Перезагрузите страницу.
          </div>
        </div>
      </div>
    );
  }

  // Основной рендер магазина
  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Лавка спрайтов</h2>
          <div className="coins-display">Монеты: {coins}</div>
        </div>

        {error && <div className="error">{error}</div>}

        {sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
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
          <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>📊</button>
        </Link>
        <Link href="/friends" passHref>
          <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>📈</button>
        </Link>
        <Link href="/shop" passHref>
          <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>🛍️</button>
        </Link>
        <Link href="/reference" passHref>
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>ℹ️</button>
        </Link>
      </div>
    </div>
  );
}
