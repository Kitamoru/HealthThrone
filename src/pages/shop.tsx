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

  // Логирование состояния компонента
  useEffect(() => {
    console.log("[Shop] Component mounted");
    console.log("[Shop] Telegram user:", user);
    return () => console.log("[Shop] Component unmounted");
  }, []);

  // Функция для обновления баланса монет
  const updateCoins = async () => {
    if (!user?.id) {
      console.error("[updateCoins] User ID is missing");
      return;
    }
    
    console.log("[updateCoins] Fetching user data for ID:", user.id);
    const response = await api.getUserData(user.id, initData);
    
    if (response.success && response.data) {
      const userData = response.data;
      console.log(`[updateCoins] Received coins: ${userData.coins} (previous: ${coins})`);
      setCoins(userData.coins || 0);
    } else {
      const errorMsg = response.error || 'Failed to update coins';
      console.error("[updateCoins] Error:", errorMsg);
      setError(errorMsg);
    }
  };

 useEffect(() => {
    if (!isReady || !user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const responses = await Promise.allSettled([
          api.getUserData(user.id, initData),
          api.getSprites(initData),
          api.getOwnedSprites(user.id, initData)
        ]);

        const [userResponse, spritesResponse, ownedResponse] = responses;

        // Обработка пользовательских данных
        if (userResponse.status === 'fulfilled' && 
            userResponse.value.success && 
            userResponse.value.data) {
          const userData = userResponse.value.data;
          setCoins(userData.coins || 0);
          setCurrentSprite(userData.current_sprite_id || null);
        } else {
          // Обработка ошибки
        }

        // Ключевое исправление: проверка типа данных перед map
        if (spritesResponse.status === 'fulfilled' && 
            spritesResponse.value.success) {
          // Защита от не-массивов
          const spritesData = Array.isArray(spritesResponse.value.data) 
            ? spritesResponse.value.data 
            : [];
          
          const spritesWithPrice = spritesData.map(sprite => ({
            ...sprite,
            price: sprite.price || 0
          }));
          setSprites(spritesWithPrice);
        } else {
          // Обработка ошибки
          setSprites([]);
        }

        // Обработка купленных спрайтов
        if (ownedResponse.status === 'fulfilled' && 
            ownedResponse.value.success && 
            Array.isArray(ownedResponse.value.data)) {
          setOwnedSprites(ownedResponse.value.data);
        }
        
      } catch (err) {
        setError('Unexpected error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isReady, user, initData]);


  const handlePurchase = async (spriteId: number) => {
    console.log("[Shop] Purchase attempt for sprite:", spriteId);
    
    if (!user?.id) {
      const errorMsg = 'User not defined';
      setError(errorMsg);
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      setError('Already purchased');
      return;
    }
    
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) {
      setError('Sprite not found');
      return;
    }
    
    if (coins < sprite.price) {
      setError('Not enough coins');
      return;
    }
    
    try {
      const response = await api.purchaseSprite(user.id, spriteId, initData);
      console.log("[Shop] Purchase response:", response);

      if (response.success) {
        // Обновляем только необходимые данные
        setOwnedSprites(prev => [...prev, spriteId]);
        setCoins(prev => prev - sprite.price);
        setError(null);
      } else {
        setError(response.error || 'Purchase failed');
      }
    } catch (error: any) {
      console.error("[Shop] Purchase error:", error);
      setError('Network error');
    }
  };

  const handleEquip = async (spriteId: number) => {
    console.log("[Shop] Equip attempt for sprite:", spriteId);
    
    if (!user?.id) {
      setError('User not defined');
      return;
    }
    
    try {
      const response = await api.equipSprite(user.id, spriteId, initData);
      console.log("[Shop] Equip response:", response);

      if (response.success) {
        setCurrentSprite(spriteId);
        setError(null);
      } else {
        setError(response.error || 'Equip failed');
      }
    } catch (error: any) {
      console.error("[Shop] Equip error:", error);
      setError('Network error');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Sprite Shop</h2>
          <div className="coins-display">Coins: {coins}</div>
          {user?.id && <div className="user-id">User ID: {user.id}</div>}
        </div>
        
        {error && <div className="error">{error}</div>}
        
        {!user?.id ? (
          <div className="error">
            User not identified. Please try refreshing the page.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">No sprites available</div>
        ) : (
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
                      Price: {sprite.price > 0 ? `${sprite.price} coins` : 'Free'}
                    </div>
                    <div className="sprite-actions">
                      {!isOwned ? (
                        coins >= sprite.price ? (
                          <button 
                            className="buy-btn"
                            onClick={() => handlePurchase(sprite.id)}
                          >
                            Buy
                          </button>
                        ) : (
                          <button className="buy-btn disabled" disabled>
                            Not enough
                          </button>
                        )
                      ) : (
                        <button 
                          className="equip-btn"
                          onClick={() => handleEquip(sprite.id)}
                          disabled={isEquipped}
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
