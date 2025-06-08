import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../../hooks/useTelegram';
import { Loader } from '../../components/Loader';
import { api, Sprite } from '../../lib/api';

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

  console.log('Shop component render:', {
    isReady,
    user: user ? 'exists' : 'null',
    loading,
    coins,
    currentSprite,
    ownedSprites,
    error
  });

  // Функция для обновления баланса монет
  const updateCoins = async () => {
    console.log('updateCoins called');
    if (!user?.id) {
      console.warn('updateCoins: user.id missing');
      return;
    }
    
    try {
      console.log('Calling api.getUserData for updateCoins');
      const response = await api.getUserData(user.id, initData);
      console.log('updateCoins response:', response);
      
      if (response.success && response.data) {
        const userData = response.data as UserData;
        console.log('Updating coins:', userData.coins || 0);
        setCoins(userData.coins || 0);
      } else {
        console.error('updateCoins failed:', response.error);
      }
    } catch (err) {
      console.error('updateCoins network error:', err);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered', { isReady, user: user?.id });
    
    if (!isReady) {
      console.log('useEffect: Telegram not ready yet');
      return;
    }
    
    if (!user?.id) {
      console.log('useEffect: user.id missing');
      setError('User ID not available');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        console.log('Starting data fetching');
        setLoading(true);
        setError(null);
        
        // Загрузка данных пользователя
        console.log('Fetching user data...');
        const userResponse = await api.getUserData(user.id, initData);
        console.log('User data response:', userResponse);
        
        if (!userResponse.success || !userResponse.data) {
          const errorMsg = userResponse.error || 'Не удалось загрузить данные пользователя';
          console.error('User data error:', errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        const userData = userResponse.data as UserData;
        console.log('User data received:', {
          coins: userData.coins,
          current_sprite: userData.current_sprite_id
        });
        
        setCoins(userData.coins || 0);
        setCurrentSprite(userData.current_sprite_id || null);
        
        // Параллельная загрузка спрайтов и купленных спрайтов
        console.log('Fetching sprites and owned sprites...');
        const [spritesResponse, ownedResponse] = await Promise.all([
          api.getSprites(initData),
          api.getOwnedSprites(user.id, initData)
        ]);

        console.log('Sprites response:', spritesResponse);
        console.log('Owned sprites response:', ownedResponse);

        if (spritesResponse.success) {
          const spritesWithPrice: SpriteWithPrice[] = (spritesResponse.data || []).map(sprite => ({
            ...sprite,
            price: sprite.price || 0
          }));
          console.log(`Loaded ${spritesWithPrice.length} sprites`);
          setSprites(spritesWithPrice);
        } else {
          const errorMsg = spritesResponse.error || 'Не удалось загрузить спрайты';
          console.error('Sprites error:', errorMsg);
          setError(errorMsg);
        }
        
        if (ownedResponse.success && ownedResponse.data) {
          console.log(`Loaded ${ownedResponse.data.length} owned sprites`);
          setOwnedSprites(ownedResponse.data);
        } else {
          const errorMsg = ownedResponse.error || 'Ошибка загрузки спрайтов';
          console.error('Owned sprites error:', errorMsg);
          setError(errorMsg);
        }
        
        setLoading(false);
        console.log('Data loading completed');
      } catch (err) {
        console.error('Fetch data error:', err);
        setError('Ошибка сети');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isReady, user, initData]);

  const handlePurchase = async (spriteId: number) => {
    console.log('handlePurchase called for sprite:', spriteId);
    setError(null);
    
    if (!user) {
      const errorMsg = 'Пользователь не определен';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      const errorMsg = 'Уже куплено';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) {
      const errorMsg = 'Спрайт не найден';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    if (coins < sprite.price) {
      const errorMsg = 'Недостаточно монет';
      console.error(errorMsg, { coins, price: sprite.price });
      setError(errorMsg);
      return;
    }
    
    try {
      console.log('Calling api.purchaseSprite', {
        userId: user.id,
        spriteId,
        initData: initData ? 'exists' : 'null'
      });
      
      const response = await api.purchaseSprite(user.id, spriteId, initData);
      console.log('purchaseSprite response:', response);
      
      if (response.success) {
        console.log('Purchase successful, updating coins...');
        await updateCoins();
        setOwnedSprites(prev => [...prev, spriteId]);
        setError(null);
      } else {
        const errorMsg = response.error || 'Ошибка при покупке';
        console.error('Purchase failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Purchase network error:', error);
      setError('Ошибка сети');
    }
  };

  const handleEquip = async (spriteId: number) => {
    console.log('handleEquip called for sprite:', spriteId);
    setError(null);
    
    if (!user) {
      const errorMsg = 'Пользователь не определен';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      console.log('Calling api.equipSprite', {
        userId: user.id,
        spriteId,
        initData: initData ? 'exists' : 'null'
      });
      
      const response = await api.equipSprite(user.id, spriteId, initData);
      console.log('equipSprite response:', response);
      
      if (response.success) {
        console.log('Equip successful, setting current sprite:', spriteId);
        setCurrentSprite(spriteId);
        setError(null);
      } else {
        const errorMsg = response.error || 'Ошибка при установке';
        console.error('Equip failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Equip network error:', error);
      setError('Ошибка сети');
    }
  };

  if (loading) {
    console.log('Rendering loader');
    return <Loader />;
  }

  console.log('Rendering shop content');
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
