import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Для ссылок теперь используется стандартный next/link
import { usePathname } from 'next/navigation'; // Используем new Router API

import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile, Sprite } from '../lib/types';

// Вспомогательная функция для обработки запросов API
const useFetch = (url: string, options: RequestInit) => {
  const [data, setData] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let didCancel = false;

    const fetchData = async () => {
      try {
        const result = await fetch(url, options);
        if (!didCancel) {
          const json = await result.json();
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!didCancel) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError(String(err)); // Если err не является объектом Error, преобразуем его в строку
          }
        }
      } finally {
        if (!didCancel) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      didCancel = true;
    };
  }, [url, options]);

  return { loading, data, error };
};

// Типизация возвращаемых данных API
type GetUserResponse = {
  success: boolean;
  data: UserData;
  error?: string;
};

type GetSpritesResponse = {
  success: boolean;
  data: Sprite[];
  error?: string;
};

type GetOwnedSpritesResponse = {
  success: boolean;
  data: number[];
  error?: string;
};

type PurchaseResponse = {
  success: boolean;
  error?: string;
};

type EquipResponse = {
  success: boolean;
  error?: string;
};

// Интерфейсы для улучшения понимания и типизации
interface UserData extends UserProfile {
  coins: number;
  burnout_level: number;
  current_sprite_id?: number | null;
  last_attempt_date?: string;
}

type SpriteWithPrice = Omit<Sprite, 'price'> & { price: number };

export default function Shop() {
  const pathname = usePathname(); // Новое использование навигационного хука

  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<SpriteWithPrice[]>([]);
  const [coins, setCoins] = useState(0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Извлекаем id пользователя
  const userId = user?.id ?? '';

  // Получение данных о пользователях и спрайтах
  const { loading: userLoading, data: userData, error: userError } =
    useFetch(`/api/user/${userId}`, {});

  const { loading: spritesLoading, data: spritesData, error: spritesError } =
    useFetch('/api/sprites', {});

  const { loading: ownedLoading, data: ownedData, error: ownedError } =
    useFetch(`/api/owned-sprites/${userId}`, {});

  // Объединяем состояние загрузки
  const isLoading = userLoading || spritesLoading || ownedLoading;

  // Обработчики действий
  const handlePurchase = async (spriteId: number) => {
    if (!userId) return;

    const sprite = sprites.find((s) => s.id === spriteId);
    if (!sprite) return;

    if (coins < sprite.price) {
      setError('Insufficient funds');
      return;
    }

    const purchaseResult = await api.purchaseSprite(userId, spriteId, Number(initData));
    if (purchaseResult.success) {
      setOwnedSprites([...ownedSprites, spriteId]);
      setCoins(coins - sprite.price);
      setError(null);
    } else {
      setError(purchaseResult.error || 'An unknown error occurred.');
    }
  };

  const handleEquip = async (spriteId: number) => {
    if (!userId) return;

    const equipResult = await api.equipSprite(userId, spriteId, Number(initData));
    if (equipResult.success) {
      setCurrentSprite(spriteId);
      setError(null);
    } else {
      setError(equipResult.error || 'An unknown error occurred.');
    }
  };

  // Рендеринг компонента
  if (isLoading) return <Loader />;

  if (error || userError || spritesError || ownedError)
    return <div className="error">{error || userError || spritesError || ownedError}</div>;

  if (!userId) return <div className="error">User not logged in.</div>;

  if (!spritesData || spritesData.length === 0)
    return <div className="info">No sprites available</div>;

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Sprite Shop</h2>
          <div className="coins-display">Coins: {coins}</div>
          <div className="user-id">User ID: {userId}</div>
        </div>

        <div className="sprites-grid">
          {spritesData.map((sprite) => {
            const isOwned = ownedSprites.includes(sprite.id);
            const isEquipped = currentSprite === sprite.id;
            
            return (
              <div key={sprite.id} className="sprite-card">
                <img src={sprite.image_url} alt={sprite.name} className="sprite-image"/>
                <div className="sprite-info">
                  <h3>{sprite.name}</h3>
                  <div className="sprite-price">
                    Price: {sprite.price > 0 ? `${sprite.price} coins` : 'Free'}
                  </div>
                  <div className="sprite-actions">
                    {!isOwned ? (
                      coins >= sprite.price ? (
                        <button className="buy-btn" onClick={() => handlePurchase(sprite.id)}>
                          Buy
                        </button>
                      ) : (
                        <button className="buy-btn disabled" disabled>
                          Not Enough Coins
                        </button>
                      )
                    ) : (
                      <button
                        className={`equip-btn ${isEquipped ? 'disabled' : ''}`}
                        onClick={() => handleEquip(sprite. const                        disabled={isEquipped}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="menu">
        <Link href="/" passHref><button className="menu-btn">📊</button></Link>
        <Link href="/friends" passHref><button className="menu-btn">📈</button></Link>
        <Link href="/shop" passHref><button className="menu-btn active">🛍️</button></Link>
        <Link href="/info" passHref><button className="menu-btn">ℹ️</button></Link>
      </div>
    </div>
  );
}
