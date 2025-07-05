import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '@/hooks/useTelegram';
import { Loader } from '@/components/Loader';
import { 
  useUserData, 
  useSpritesData, 
  useOwnedSprites,
  usePurchaseSprite,
  useEquipSprite
} from '@/lib/api';
import { Sprite } from '@/lib/types';
import { validateRequiredFields } from '@/utils/validation';
import { queryClient } from '@/lib/queryClient';

// ... (SpriteCard component remains the same)

export default function Shop() {
  const router = useRouter();
  const { user, initData, webApp } = useTelegram();
  const telegramId = user?.id ? Number(user.id) : null;
  
  // Используем новый флаг isFetched для определения завершения запросов
  const { 
    data: userResponse, 
    isLoading: userLoading,
    isFetched: userFetched,
    error: userError 
  } = useUserData(telegramId || 0, initData);
  
  const { 
    data: spritesResponse, 
    isLoading: spritesLoading,
    isFetched: spritesFetched,
    error: spritesError 
  } = useSpritesData(initData);
  
  const { 
    data: ownedResponse, 
    isLoading: ownedLoading,
    isFetched: ownedFetched,
    error: ownedError 
  } = useOwnedSprites(telegramId || 0, initData);
  
  const purchaseMutation = usePurchaseSprite();
  const equipMutation = useEquipSprite();
  
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Определяем, все ли данные загружены
  const allFetched = userFetched && spritesFetched && ownedFetched;
  const anyError = userError || spritesError || ownedError || 
                  (userResponse && !userResponse.success) || 
                  (spritesResponse && !spritesResponse.success) || 
                  (ownedResponse && !ownedResponse.success);

  // Данные пользователя
  const coins = userResponse?.success ? userResponse.data?.coins || 0 : 0;
  const currentSprite = userResponse?.success 
    ? userResponse.data?.current_sprite_id || null 
    : null;
  
  // Данные спрайтов
  const ownedSprites = ownedResponse?.success 
    ? ownedResponse.data || [] 
    : [];
  const sprites = spritesResponse?.success 
    ? spritesResponse.data || [] 
    : [];

  // Обработчики покупки и применения (остаются без изменений)
  // ...

  // Если данные еще загружаются, показываем лоадер
  if (!allFetched) {
    return <Loader />;
  }

  // Если есть ошибки, показываем сообщение
  if (anyError) {
    const errorMessage = 
      userError?.message || 
      spritesError?.message || 
      ownedError?.message ||
      (userResponse && !userResponse.success ? userResponse.error : null) ||
      (spritesResponse && !spritesResponse.success ? spritesResponse.error : null) ||
      (ownedResponse && !ownedResponse.success ? ownedResponse.error : null) ||
      'Неизвестная ошибка';
    
    return (
      <div className="container">
        <div className="error">{errorMessage}</div>
      </div>
    );
  }

  // Если пользователь не авторизован ПОСЛЕ загрузки данных
  if (!telegramId) {
    return (
      <div className="container">
        <div className="error">
          Пользователь не авторизован. Перезагрузите страницу.
        </div>
      </div>
    );
  }

  // Основной рендер магазина
  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="header">
          <h2>Лавка спрайтов</h2>
          <div className="coins-display">Монеты: {coins}</div>
        </div>

        {error && <div className="error">{error}</div>}

        {sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
        ) : (
          <div className="sprites-grid">
            {sprites.map((sprite) => (
              <SpriteCard
                key={sprite.id}
                sprite={sprite}
                coins={coins}
                isOwned={ownedSprites.includes(sprite.id)}
                isEquipped={currentSprite === sprite.id}
                isProcessing={processing === sprite.id}
                onPurchase={handlePurchase}
                onEquip={handleEquip}
              />
            ))}
          </div>
        )}
      </div>

      <div className="menu">
        {/* Навигация */}
      </div>
    </div>
  );
}
