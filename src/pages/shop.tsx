import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';

interface Sprite {
  id: number;
  name: string;
  image_url: string;
  price: number;
}

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
        
        // Загрузка спрайтов
        const spritesResponse = await api.getSprites();
        if (spritesResponse.success) {
          setSprites(spritesResponse.data || []);
        } else {
          setError(spritesResponse.error || 'Failed to load sprites');
        }
        
        // Загрузка данных пользователя
        const userResponse = await api.getUserData(user.id, initData);
        if (userResponse.success && userResponse.data) {
          setCoins(userResponse.data.coins || 0);
          setCurrentSprite(userResponse.data.current_sprite_id || null);
        } else {
          setError(userResponse.error || 'Failed to load user data');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Network error');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isReady, user, initData]);

  const handlePurchase = async (spriteId: number, price: number) => {
    if (coins < price) {
      setError('Недостаточно монет');
      return;
    }
    
    try {
      const response = await api.purchaseSprite(user!.id, spriteId, price, initData);
      if (response.success) {
        setCoins(coins - price);
        setError(null);
      } else {
        setError(response.error || 'Ошибка при покупке');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

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
                      onClick={() => handlePurchase(sprite.id, sprite.price)}
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
