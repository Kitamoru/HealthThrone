import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile, Sprite } from '../lib/types';

// Валидатор входных данных
const validateInput = ({ userId, spriteId }) => {
  if (!Number.isInteger(userId) || Number.isNaN(userId)) throw new Error("Неверный ID пользователя");
  if (!Number.isInteger(spriteId) || Number.isNaN(spriteId)) throw new Error("Неверный ID спрайта");
};

// Кэширование полученных данных
let cachedUserData = {};
let cachedSprites = [];
let cachedOwnedSprites = [];

export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<Sprite[]>(cachedSprites);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(cachedUserData.coins ?? 0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(
    cachedUserData.current_sprite_id ?? null
  );
  const [ownedSprites, setOwnedSprites] = useState<number[]>(cachedOwnedSprites);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Shop] Component mounted");
    return () => console.log("[Shop] Component unmounted");
  }, []);

  const updateCoins = async () => {
    if (!user?.id) return;

    const response = await api.getUserData(Number(user.id), initData);

    if (response.success && response.data) {
      setCoins(response.data.coins || 0);
    } else {
      setError(response.error || 'Не удалось обновить баланс');
    }
  };

  useEffect(() => {
    if (!isReady || !user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userResponse, spritesResponse, ownedResponse] = await Promise.all([
          api.getUserData(Number(user.id), initData),
          api.getSprites(initData),
          api.getOwnedSprites(Number(user.id), initData)
        ]);

        // Проверка успешности каждого отдельного запроса
        if (userResponse.success && userResponse.data) {
          cachedUserData = userResponse.data;
          setCoins(userResponse.data.coins || 0);
          setCurrentSprite(userResponse.data.current_sprite_id || null);
        } else if (userResponse.error) {
          setError(userResponse.error);
        }

        if (spritesResponse.success && Array.isArray(spritesResponse.data)) {
          cachedSprites = spritesResponse.data;
          setSprites(spritesResponse.data);
        } else if (spritesResponse.error) {
          setError(spritesResponse.error);
        }

        if (ownedResponse.success && Array.isArray(ownedResponse.data)) {
          cachedOwnedSprites = ownedResponse.data;
          setOwnedSprites(ownedResponse.data);
        } else if (ownedResponse.error) {
          setError(ownedResponse.error);
        }
      } catch (err) {
        setError(err.message || 'Непредвиденная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isReady, user, initData]);

  const handlePurchase = async (spriteId: number) => {
    if (!user?.id) {
      setError('Пользователь не определён');
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      setError('Уже куплено');
      return;
    }

    const sprite = sprites.find((s) => s.id === spriteId);
    if (!sprite) {
      setError('Спрайт не найден');
      return;
    }

    if (coins < sprite.price) {
      setError('Недостаточно монет');
      return;
    }

    try {
      validateInput({ userId: Number(user.id), spriteId });
      const response = await api.purchaseSprite(Number(user.id), spriteId, initData);

      if (response.success) {
        setOwnedSprites((prev) => [...prev, spriteId]);
        setCoins((prev) => prev - sprite.price);
        setError(null);
      } else {
        setError(response.error || 'Ошибка покупки');
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка сети');
    }
  };

  const handleEquip = async (spriteId: number) => {
    if (!user?.id) {
      setError('Пользователь не определён');
      return;
    }

    try {
      validateInput({ userId: Number(user.id), spriteId });
      const response = await api.equipSprite(Number(user.id), spriteId, initData);

      if (response.success) {
        setCurrentSprite(spriteId);
        setError(null);
      } else {
        setError(response.error || 'Ошибка применения');
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка сети');
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
            Пользователь не идентифицирован. Обновите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов</div>
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
                            className="buy-btn"
                            onClick={() => handlePurchase(sprite.id)}>
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
                          disabled={isEquipped}>
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
