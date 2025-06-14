import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile, Sprite } from '../lib/types';
import { validateRequiredFields } from '../utils/validation';

export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Shop] Component mounted');
    return () => console.log('[Shop] Component unmounted');
  }, []);

  useEffect(() => {
    if (!isReady || !user?.id || !initData) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Запускаем запросы параллельно с отслеживанием результата
        const results = await Promise.allSettled([
          api.getUserData(Number(user.id), initData),
          api.getSprites(initData),
          api.getOwnedSprites(Number(user.id), initData)
        ]);

        results.forEach(({ status, value }) => {
          if (status === 'rejected') {
            setError(value.message);
            return;
          }
          
          if (value.success) {
            if (value.url === '/api/data') {
              setCoins(value.data.coins || 0);
              setCurrentSprite(value.data.current_sprite_id || null);
            } else if (value.url === '/api/shop/sprites') {
              setSprites(Array.isArray(value.data) ? value.data : []);
            } else if (value.url === '/api/shop/owned') {
              setOwnedSprites(Array.isArray(value.data) ? value.data : []);
            }
          } else {
            setError(value.error || 'Ошибка загрузки данных.');
          }
        });
      } catch (err) {
        setError('Обнаружилась непредвиденная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isReady, user, initData]);

  const handlePurchase = async (spriteId: number) => {
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
      const purchaseResult = await api.purchaseSprite(Number(user.id), spriteId, initData!);
      if (purchaseResult.success) {
        setOwnedSprites((prev) => [...prev, spriteId]);
        setCoins((prev) => prev - sprite.price);
        setError(null);
      } else {
        setError(purchaseResult.error || 'Ошибка покупки спрайта.');
      }
    } catch (err) {
      setError('Возникла проблема с сетью при покупке.');
    }
  };

  const handleEquip = async (spriteId: number) => {
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
      const equipResult = await api.equipSprite(Number(user.id), spriteId, initData!);
      if (equipResult.success) {
        setCurrentSprite(spriteId);
        setError(null);
      } else {
        setError(equipResult.error || 'Ошибка при применении спрайта.');
      }
    } catch (err) {
      setError('Проблема с сетью при попытке применить спрайт.');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Магазин спрайтов</h2>
          <div className="coins-display">Монеты: {coins}</div>
        </div>

        {error && <div className="error">{error}</div>}

        {!user?.id ? (
          <div className="error">
            Пользователь не авторизован. Перезагрузите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
        ) : (
          <div className="sprites-grid">
            {sprites.map((sprite) => {
              const isOwned = ownedSprites.includes(sprite.id);
              const isEquipped = currentSprite === sprite.id;

              return (
                <div key={sprite.id} className="sprite-card">
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
                            className="buy-btn"
                            onClick={() => handlePurchase(sprite.id)}
                          >
                            Купить
                          </button>
                        ) : (
                          <button className="buy-btn disabled" disabled>
                            Недостаточно
                          </button>
                        )
                      ) : (
                        <button
                          className="equip-btn"
                          onClick={() => handleEquip(sprite.id)}
                          disabled={isEquipped}
                        >
                          {isEquipped ? 'Применён' : 'Применить'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
        <Link href="/info" passHref>
          <button className="menu-btn">ℹ️</button>
        </Link>
      </div>
    </div>
  );
}
