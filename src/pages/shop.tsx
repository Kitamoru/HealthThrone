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
    console.log("[Shop] Router path:", router.pathname);
    console.log("[Shop] isReady:", isReady, "user:", user);
    console.log("[Shop] initData length:", initData ? initData.length : "null");
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
      const userData = response.data as UserData;
      console.log(`[updateCoins] Received coins: ${userData.coins} (previous: ${coins})`);
      setCoins(userData.coins || 0);
    } else {
      console.error(
        "[updateCoins] Failed to update coins:", 
        response.error
      );
    }
  };

  useEffect(() => {
    if (!isReady || !user?.id) {
      console.log(`[useEffect] Skipping fetch - isReady:${isReady} userID:${user?.id}`);
      return;
    }
    
    const fetchData = async () => {
      try {
        console.log("[fetchData] Starting data loading");
        setLoading(true);
        
        // Загрузка данных пользователя
        console.log("[fetchData] Loading user data for ID:", user.id);
        const userResponse = await api.getUserData(user.id, initData);
        console.log("[fetchData] User response:", userResponse);

        if (!userResponse.success || !userResponse.data) {
          const errorMsg = userResponse.error || 'Не удалось загрузить данные пользователя';
          console.error("[fetchData] User data error:", errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        const userData = userResponse.data as UserData;
        console.log(
          `[fetchData] User data: coins=${userData.coins}, ` +
          `sprite=${userData.current_sprite_id}, ` +
          `burnout=${userData.burnout_level}`
        );
        setCoins(userData.coins || 0);
        setCurrentSprite(userData.current_sprite_id || null);
        
        // Параллельная загрузка спрайтов и купленных спрайтов
        console.log("[fetchData] Loading sprites and owned sprites");
        const [spritesResponse, ownedResponse] = await Promise.all([
          api.getSprites(initData),
          api.getOwnedSprites(user.id, initData)
        ]);

        console.log("[fetchData] Sprites response:", spritesResponse);
        console.log("[fetchData] Owned sprites response:", ownedResponse);

        if (spritesResponse.success) {
          const spritesWithPrice: SpriteWithPrice[] = (spritesResponse.data || []).map(sprite => ({
            ...sprite,
            price: sprite.price || 0
          }));
          console.log(`[fetchData] Loaded ${spritesWithPrice.length} sprites`);
          setSprites(spritesWithPrice);
        } else {
          const errorMsg = spritesResponse.error || 'Не удалось загрузить спрайты';
          console.error("[fetchData] Sprites error:", errorMsg);
          setError(errorMsg);
        }
        
        if (ownedResponse.success && ownedResponse.data) {
          console.log(`[fetchData] User owns ${ownedResponse.data.length} sprites`);
          setOwnedSprites(ownedResponse.data);
        } else {
          const errorMsg = ownedResponse.error || 'Ошибка загрузки спрайтов';
          console.error("[fetchData] Owned sprites error:", errorMsg);
          setError(errorMsg);
        }
        
        setLoading(false);
        console.log("[fetchData] Data loading completed");
      } catch (err) {
        console.error("[fetchData] Network error:", err);
        setError('Ошибка сети');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isReady, user, initData]);

  const handlePurchase = async (spriteId: number) => {
    console.log("[handlePurchase] Attempting purchase for sprite:", spriteId);
    
    if (!user) {
      const errorMsg = 'Пользователь не определен';
      console.error("[handlePurchase] Error:", errorMsg);
      setError(errorMsg);
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      const errorMsg = 'Уже куплено';
      console.warn("[handlePurchase]", errorMsg);
      setError(errorMsg);
      return;
    }
    
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) {
      const errorMsg = 'Спрайт не найден';
      console.error("[handlePurchase]", errorMsg);
      setError(errorMsg);
      return;
    }
    
    console.log(`[handlePurchase] User coins: ${coins}, Sprite price: ${sprite.price}`);
    if (coins < sprite.price) {
      const errorMsg = 'Недостаточно монет';
      console.warn("[handlePurchase]", errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      console.log(`[handlePurchase] Purchasing sprite ${spriteId} for user ${user.id}`);
      const response = await api.purchaseSprite(user.id, spriteId, initData);
      console.log("[handlePurchase] Purchase response:", response);

      if (response.success) {
        console.log("[handlePurchase] Purchase successful");
        // Обновляем баланс с сервера
        await updateCoins();
        setOwnedSprites(prev => [...prev, spriteId]);
        setError(null);
      } else {
        console.error(
          "[handlePurchase] Purchase failed:", 
          response.error
        );
        setError(response.error || 'Ошибка при покупке');
      }
    } catch (error) {
      console.error("[handlePurchase] Network exception:", error);
      setError('Ошибка сети');
    }
  };

  const handleEquip = async (spriteId: number) => {
    console.log("[handleEquip] Equipping sprite:", spriteId);
    
    if (!user) {
      const errorMsg = 'Пользователь не определен';
      console.error("[handleEquip] Error:", errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      console.log(`[handleEquip] Equipping sprite ${spriteId} for user ${user.id}`);
      const response = await api.equipSprite(user.id, spriteId, initData);
      console.log("[handleEquip] Equip response:", response);

      if (response.success) {
        console.log("[handleEquip] Equip successful");
        setCurrentSprite(spriteId);
        setError(null);
      } else {
        console.error(
          "[handleEquip] Equip failed:", 
          response.error
        );
        setError(response.error || 'Ошибка при установке');
      }
    } catch (error) {
      console.error("[handleEquip] Network exception:", error);
      setError('Ошибка сети');
    }
  };

  if (loading) {
    console.log("[Render] Loading state");
    return <Loader />;
  }

  console.log("[Render] Rendering shop UI");
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
