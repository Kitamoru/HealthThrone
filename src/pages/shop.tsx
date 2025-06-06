import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api, Sprite } from '../lib/api'; // Импортируем Sprite из API

export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<Sprite[]>([]);
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
          const spritesWithPrice = (spritesResponse.data || []).map(sprite => ({
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
          setCoins(userResponse.data.coins || 0);
          setCurrentSprite(userResponse.data.current_sprite_id || null);
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
    
    // Проверяем достаточно ли монет
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
      const response = await api.equipSprite(user!.id, spriteId, initData);
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
                <div className="sprite-price">Цена: {sprite.price} монет</div>
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
