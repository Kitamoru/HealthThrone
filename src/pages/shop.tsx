import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api, Sprite } from '../lib/api'; // Import Sprite from api

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
          // Ensure all sprites have a price
          const spritesWithPrice = (spritesResponse.data || []).map(s => ({
            ...s,
            price: s.price || 0
          }));
          setSprites(spritesWithPrice);
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

  // ... rest of the component remains the same ...
}
