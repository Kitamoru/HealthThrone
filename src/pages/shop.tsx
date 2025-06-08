import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api, Sprite } from '../lib/api';

interface UserData {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  coins: number;
  burnout_level: number;
  current_sprite_id?: number | null;
  last_attempt_date?: string;
}

type SpriteWithPrice = Omit<Sprite, 'price'> & { price: number };

export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<SpriteWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Функция для обновления баланса монет
  const updateCoins = async () => {
    if (!user?.id) return;
    
    const response = await api.getUserData(user.id, initData);
    if (response.success && response.data) {
      const userData = response.data as UserData;
      setCoins(userData.coins || 0);
    }
  };

  const numericTelegramId = parseInt(user?.id || '0', 10);

  useEffect(() => {
    if (!isReady || !user?.id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загрузка данных пользователя
        const userResponse = await api.getUserData(numericTelegramId.toString(), initData);
        if (!userResponse.success || !userResponse.data) {
          setError(userResponse.error || 'Не удалось загрузить данные пользователя');
          setLoading(false);
          return;
        }

        const userData = userResponse.data as UserData;
        setCoins(userData.coins || 0);
        setCurrentSprite(userData.current_sprite_id || null);
        
        // Параллельная загрузка спрайтов и купленных спрайтов
        const [spritesResponse, ownedResponse] = await Promise.all([
          api.getSprites(initData),
          api.getOwnedSprites(user.id, initData)
        ]);

        if (spritesResponse.success) {
          const spritesWithPrice: SpriteWithPrice[] = (spritesResponse.data || []).map(sprite => ({
            ...sprite,
            price: sprite.price || 0
          }));
          setSprites(spritesWithPrice);
        } else {
          setError(spritesResponse.error || 'Не удалось загрузить спрайты');
        }
        
        if (ownedResponse.success && ownedResponse.data) {
          setOwnedSprites(ownedResponse.data);
        } else {
          setError(ownedResponse.error || 'Ошибка загрузки спрайтов');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Ошибка сети');
        setLoading(false);
      }
    };
    
      fetchData();
  }, [isReady, user, initData]);

  // В обработчиках используем numericTelegramId
   const handlePurchase = async (spriteId: number) => {
    const response = await api.purchaseSprite(numericTelegramId, spriteId, initData);
    if (!user) {
      setError('Пользователь не определен');
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      setError('Уже куплено');
      return;
    }
    
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) {
      setError('Спрайт не найден');
      return;
    }
    
    if (coins < sprite.price) {
      setError('Недостаточно монет');
      return;
    }
    
    try {
      const response = await api.purchaseSprite(user.id, spriteId, initData);
      if (response.success) {
        // Обновляем баланс с сервера
        await updateCoins();
        setOwnedSprites(prev => [...prev, spriteId]);
        setError(null);
      } else {
        setError(response.error || 'Ошибка при покупке');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleEquip = async (spriteId: number) => {
    if (!user) {
      setError('Пользователь не определен');
      return;
    }
    
    try {
      const response = await api.equipSprite(user.id, spriteId, initData);
      if (response.success) {
        setCurrentSprite(spriteId);
        setError(null);
      } else {
        setError(response.error || 'Ошибка при установке');
      }
    } catch (error) {
      setError('Ошибка сети');
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
        
        <div className="sprites-grid">
          {sprites.map(sprite => {
            const isOwned = ownedSprites.includes(sprite.id);
            const isEquipped = currentSprite === sprite.id;
            
            return (
              <div key={sprite.id} className="sprite-card">
                <img 
                  src={sprite.image_url} 
                  alt={sprite.name} 
                  className="sprite-image"
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
                        {isEquipped ? 'Установлен' : 'Установить'}
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
