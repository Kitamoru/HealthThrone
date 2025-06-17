import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { Sprite } from '../lib/types';
import { validateRequiredFields } from '../utils/validation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Shop() {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  const telegramId = Number(user?.id);

  // Запросы данных с кэшированием
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', telegramId],
    queryFn: () => api.getUserData(telegramId, initData),
    enabled: !!telegramId && !!initData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: sprites, isLoading: spritesLoading } = useQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const { data: ownedSprites, isLoading: ownedLoading } = useQuery({
    queryKey: ['ownedSprites', telegramId],
    queryFn: () => api.getOwnedSprites(telegramId, initData),
    enabled: !!telegramId && !!initData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Мутации для покупки и применения спрайтов
  const purchaseMutation = useMutation({
    mutationFn: (spriteId: number) => 
      api.purchaseSprite(telegramId, spriteId, initData),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', telegramId]);
      queryClient.invalidateQueries(['ownedSprites', telegramId]);
    },
  });

  const equipMutation = useMutation({
    mutationFn: (spriteId: number) => 
      api.equipSprite(telegramId, spriteId, initData),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', telegramId]);
    },
  });

  // Обработчики с использованием мутаций
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

    if (!telegramId) {
      setError('Пользователь не определен');
      return;
    }

    const sprite = sprites?.find((item) => item.id === spriteId);
    if (!sprite) {
      setError('Спрайт не найден');
      return;
    }

    if (ownedSprites?.includes(spriteId)) {
      setError('Вы уже приобрели этот спрайт.');
      return;
    }

    if ((userData?.data?.coins || 0) < sprite.price) {
      setError('У вас недостаточно монет для покупки.');
      return;
    }

    try {
      setProcessing(spriteId);
      const result = await purchaseMutation.mutateAsync(spriteId);
      if (!result.success) {
        setError(result.error || 'Ошибка покупки спрайта.');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Возникла проблема с сетью при покупке.');
    } finally {
      setProcessing(null);
    }
  }, [user, initData, telegramId, sprites, ownedSprites, userData, purchaseMutation]);

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

    if (!telegramId) {
      setError('Пользователь не определен');
      return;
    }

    try {
      setProcessing(spriteId);
      const result = await equipMutation.mutateAsync(spriteId);
      if (!result.success) {
        setError(result.error || 'Ошибка при применении спрайта.');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Проблема с сетью при попытке применить спрайт.');
    } finally {
      setProcessing(null);
    }
  }, [user, initData, telegramId, equipMutation]);

  // Prefetch для страниц навигации
  const prefetchPages = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['user', telegramId],
      queryFn: () => api.getUserData(telegramId, initData),
    });
  }, [telegramId, initData, queryClient]);

  const isLoading = userLoading || spritesLoading || ownedLoading;

  if (isLoading) {
    return <Loader />;
  }

  const coins = userData?.data?.coins || 0;
  const currentSprite = userData?.data?.current_sprite_id || null;
  const spriteList = sprites?.data || [];
  const ownedList = ownedSprites?.data || [];

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Магазин спрайтов</h2>
          <div className="coins-display">Монеты: {coins}</div>
        </div>

        {error && <div className="error">{error}</div>}

        {!telegramId ? (
          <div className="error">
            Пользователь не авторизован. Перезагрузите страницу.
          </div>
        ) : spriteList.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
        ) : (
          <div className="sprites-grid">
            {spriteList.map((sprite) => (
              <SpriteCard
                key={sprite.id}
                sprite={sprite}
                isOwned={ownedList.includes(sprite.id)}
                isEquipped={currentSprite === sprite.id}
                isProcessing={processing === sprite.id}
                coins={coins}
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
        <Link 
          href="/shop" 
          passHref
          onMouseEnter={prefetchPages}
        >
          <button className="menu-btn active">🛍️</button>
        </Link>
        <Link href="/reference" passHref>
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>ℹ️</button>
        </Link>
      </div>
    </div>
  );
}

// Оптимизированный компонент карточки спрайта
const SpriteCard = React.memo(({
  sprite,
  isOwned,
  isEquipped,
  isProcessing,
  coins,
  onPurchase,
  onEquip
}: {
  sprite: Sprite;
  isOwned: boolean;
  isEquipped: boolean;
  isProcessing: boolean;
  coins: number;
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
