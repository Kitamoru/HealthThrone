import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api, Sprite } from '../lib/api';

// Интерфейс для данных пользователя
interface UserData {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  coins: number;
  burnout_level: number;
  current_sprite_id?: number | null;
  last_attempt_date?: string;
}

// Новый тип с гарантированным наличием цены
type SpriteWithPrice = Omit<Sprite, 'price'> & { price: number };

export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<SpriteWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !user?.id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загрузка спрайтов из магазина
        const spritesResponse = await api.getSprites();
        if (spritesResponse.success) {
          // Гарантируем что у всех спрайтов есть цена (по умолчанию 0)
          const spritesWithPrice: SpriteWithPrice[] = (spritesResponse.data || []).map(sprite => ({
            ...sprite,
            price: sprite.price || 0
          }));
          setSprites(spritesWithPrice);
        } else {
          setError(spritesResponse.error || 'Не удалось загрузить спрайты');
        }
        
        // Загрузка данных пользователя
        const userResponse = await api.getUserData(user.id, initData);
        if (userResponse.success && userResponse.data) {
          // Приводим данные пользователя к нашему интерфейсу
          const userData = userResponse.data as UserData;
          setCoins(userData.coins || 0);
          setCurrentSprite(userData.current_sprite_id || null);
        } else {
          setError(userResponse.error || 'Не удалось загрузить данные пользователя');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Ошибка сети');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isReady, user, initData]);

  // Обработка покупки спрайта
  const handlePurchase = async (spriteId: number) => {
    // Находим спрайт по ID
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) {
      setError('Спрайт не найден');
      return;
    }
    
    // Проверяем достаточно ли монет (теперь price гарантированно число)
    if (coins < sprite.price) {
      setError('Недостаточно монет');
      return;
    }
    
    try {
      // Выполняем покупку
      const response = await api.purchaseSprite(user!.id, spriteId, initData);
      if (response.success) {
        // Обновляем баланс монет
        setCoins(coins - sprite.price);
        setError(null);
      } else {
        setError(response.error || 'Ошибка при покупке');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  // Обработка установки спрайта
  const handleEquip = async (spriteId: number) => {
    try {
      // Временная функция, пока не реализована в API
      // В реальном приложении замените на вызов API
      const mockEquip = async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true });
          }, 300);
        });
      };
      
      const response: any = await mockEquip();
      
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

  // Показываем загрузчик если данные еще не готовы
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
          {sprites.map(sprite => (
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
                  {coins >= sprite.price ? (
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
                  )}
                  <button 
                    className="equip-btn"
                    onClick={() => handleEquip(sprite.id)}
                    disabled={currentSprite === sprite.id}
                  >
                    {currentSprite === sprite.id ? 'Установлен' : 'Установить'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Нижнее меню навигации */}
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
        <button className="menu-btn">ℹ️</button>
      </div>
    </div>
  );
}
