import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { Sprite, ShopUserProfile } from '../lib/types';

// Компонент отображающий магазин спрайтов
export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram(); // Telegram Web App Data
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [equippingId, setEquippingId] = useState<number | null>(null);

  /**
   * Автоматическое удаление ошибки спустя 3 секунды
   */
 useEffect(() => {
-   let timer;
+   let timer: NodeJS.Timeout | undefined;
    if (error) {
      timer = setTimeout(() => setError(null), 3000);
    }
    return () => {
      clearTimeout(timer);
    };
}, [error]);

  /**
   * Фетчинг данных спрайтов и информации о пользователе
   */
  useEffect(() => {
    if (!isReady || !user?.id || !initData) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загрузка профайла пользователя
        const userResponse = await api.getUserData(Number(user.id), initData);
        if (userResponse.success && userResponse.data) {
          setCoins(userResponse.data.coins);
          setCurrentSprite(userResponse.data.current_sprite_id || null);
        } else if (userResponse.error) {
          setError(userResponse.error);
        }

        // Загрузка списка доступных спрайтов
        const spritesResponse = await api.getSprites(initData);
        if (spritesResponse.success && Array.isArray(spritesResponse.data)) {
          setSprites(spritesResponse.data);
        } else if (spritesResponse.error) {
          setError(spritesResponse.error);
        }

        // Загрузка спрайтов, принадлежащих пользователю
        const ownedResponse = await api.getOwnedSprites(Number(user.id), initData);
        if (ownedResponse.success && Array.isArray(ownedResponse.data)) {
          setOwnedSprites(ownedResponse.data);
        } else if (ownedResponse.error) {
          setError(ownedResponse.error);
        }
      } catch (err) {
        console.error("Ошибка фетчинга:", err);
        setError('Возникла непредвиденная ошибка.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isReady, user, initData]);

  /**
   * Покупка спрайта
   */
  const handlePurchase = async (spriteId: number) => {
    if (!user?.id || !initData) {
      setError('Пользователь не авторизован');
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      setError('Вы уже владеете этим спрайтом!');
      return;
    }

    const sprite = sprites.find((s) => s.id === spriteId);
    if (!sprite) {
      setError('Спрайт не найден');
      return;
    }

    if (coins < sprite.price) {
      setError('Недостаточно монет для покупки');
      return;
    }

    try {
      setPurchasingId(spriteId);
      const purchaseResponse = await api.purchaseSprite(Number(user.id), spriteId, initData);

      if (purchaseResponse.success) {
        setOwnedSprites([...ownedSprites, spriteId]);
        setCoins(purchaseResponse.newCoins); // получаем новые монеты от сервера
        setError(null);
      } else {
        setError(purchaseResponse.error || 'Ошибка при покупке');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setPurchasingId(null);
    }
  };

  /**
   * Экипировка спрайта
   */
  const handleEquip = async (spriteId: number) => {
    if (!user?.id || !initData) {
      setError('Пользователь не авторизован');
      return;
    }

    try {
      setEquippingId(spriteId);
      const equipResponse = await api.equipSprite(Number(user.id), spriteId, initData);

      if (equipResponse.success) {
        setCurrentSprite(equipResponse.currentSprite); // Устанавливаем новый текущий спрайт
        setError(null);
      } else {
        setError(equipResponse.error || 'Ошибка при применении спрайта');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setEquippingId(null);
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
            Пользователь не идентифицирован. Пожалуйста, обновите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
        ) : (
          <div className="sprites-grid">
            {sprites.map((sprite) => {
              const isOwned = ownedSprites.includes(sprite.id);
              const isEquipped = currentSprite === sprite.id;
              const isPurchasing = purchasingId === sprite.id;
              const isEquipping = equippingId === sprite.id;

              return (
                <div key={sprite.id} className="sprite-card">
                  <img
                    src={sprite.image_url}
                    alt={sprite.name}
                    className="sprite-image"
                    onError={(e) =>
                      (e.currentTarget.src =
                        'https://via.placeholder.com/150?text=No+Image')}
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
                            className={`buy-btn ${isPurchasing ? 'loading' : ''}`}
                            onClick={() => handlePurchase(sprite.id)}
                            disabled={isPurchasing}
                          >
                            {isPurchasing ? 'Покупка...' : 'Купить'}
                          </button>
                        ) : (
                          <button className="buy-btn disabled" disabled>
                            Недостаточно
                          </button>
                        )
                      ) : (
                        <button
                          className={`equip-btn ${isEquipped ? 'equipped' : ''}`}
                          onClick={() => handleEquip(sprite.id)}
                          disabled={isEquipped || isEquipping}
                        >
                          {isEquipping 
                            ? 'Применение...'
                            : isEquipped 
                              ? 'Применён'
                              : 'Применить'}
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

      {/* Навигационное меню */}
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
