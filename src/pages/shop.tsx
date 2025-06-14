import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile, Sprite } from '../lib/types';
import { validateRequiredFields } from '../utils/validation';
import DOMPurify from 'dompurify'; // Добавлена санитизация

export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Shop] Component mounted');
    return () => console.log('[Shop] Component unmounted');
  }, []);

  useEffect(() => {
    if (!isReady || !user?.id || !initData) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userResponse, spritesResponse, ownedResponse] = await Promise.all([
          api.getUserData(Number(user.id), initData),
          api.getSprites(initData),
          api.getOwnedSprites(Number(user.id), initData)
        ]);

        if (userResponse.success && userResponse.data) {
          setCoins(userResponse.data.coins || 0);
          setCurrentSprite(userResponse.data.current_sprite_id || null);
        } else if (userResponse.error) {
          setError(`Ошибка загрузки профиля: ${userResponse.error}`);
        }

        // Исправленная проверка данных спрайтов
        if (spritesResponse.success && spritesResponse.data) {
          setSprites(spritesResponse.data);
        } else {
          setError(spritesResponse.error || 'Не удалось получить данные о спрайтах');
        }

        if (ownedResponse.success && Array.isArray(ownedResponse.data)) {
          setOwnedSprites(ownedResponse.data);
        } else if (ownedResponse.error) {
          setError(`Ошибка загрузки списка спрайтов: ${ownedResponse.error}`);
        }
      } catch (err) {
        setError('Непредвиденная ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isReady, user, initData]);

  const handleAction = async (
    action: () => Promise<ApiResponse>,
    successMessage: string
  ) => {
    const validationError = validateRequiredFields(
      { user, initData },
      ['user', 'initData'],
      'Необходимые данные отсутствуют'
    );
    
    if (validationError || !user?.id) {
      setError(validationError || 'Пользователь не определен');
      return;
    }

    try {
      const result = await action();
      if (result.success) {
        setError(null);
        // Обновление данных после успешного действия
        const userResponse = await api.getUserData(Number(user.id), initData!);
        if (userResponse.success && userResponse.data) {
          setCoins(userResponse.data.coins || 0);
          setCurrentSprite(userResponse.data.current_sprite_id || null);
        }
      } else {
        setError(result.error || 'Ошибка операции');
      }
    } catch (err) {
      setError('Сетевая ошибка при выполнении операции');
    }
  };

  const handlePurchase = (spriteId: number) => {
    handleAction(
      () => api.purchaseSprite(Number(user!.id), spriteId, initData!),
      'Спрайт успешно приобретен'
    );
  };

  const handleEquip = (spriteId: number) => {
    handleAction(
      () => api.equipSprite(Number(user!.id), spriteId, initData!),
      'Спрайт успешно применен'
    );
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

        {/* Санитизация ошибок */}
        {error && (
          <div 
            className="error" 
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(error) }} 
          />
        )}

        {!user?.id ? (
          <div className="error">
            Пользователь не авторизован. Перезагрузите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
        ) : (
          <div className="sprites-grid">
            {sprites.map((sprite) => {
              const isOwned = ownedSprites.includes(sprite.id);
              const isEquipped = currentSprite === sprite.id;

              return (
                <div key={`sprite-${sprite.id}`} className="sprite-card"> {/* Уникальный ключ */}
                  <img
                    src={sprite.image_url}
                    alt={sprite.name}
                    className="sprite-image"
                    onError={(e) => 
                      (e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image')
                    }
                  />
                  <div className="sprite-info">
                    <h3>{sprite.name}</h3>
                    <div className="sprite-price">
                      Цена: {sprite.price > 0 ? `${sprite.price} монет` : 'Бесплатно'}
                    </div>
                    <div className="sprite-actions">
                      {!isOwned ? (
                        coins >= sprite.price ? (
                          <button className="buy-btn" onClick={() => handlePurchase(sprite.id)}>
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
                          {isEquipped ? 'Применён' : 'Применить'}
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
          <button className="menu-btn" title="Главная">📊 Главная</button>
        </Link>
        <Link href="/friends" passHref>
          <button className="menu-btn" title="Друзья">📈 Друзья</button>
        </Link>
        <Link href="/shop" passHref>
          <button className="menu-btn active" title="Магазин">🛍️ Магазин</button>
        </Link>
        <Link href="/info" passHref>
          <button className="menu-btn" title="Информация">ℹ️ Инфо</button>
        </Link>
      </div>
    </div>
  );
}
