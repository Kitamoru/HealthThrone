import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { Sprite, ShopUserProfile } from '../lib/types';

export default function Shop() {
  const router = useRouter();
  const { user, isReady, initData } = useTelegram();
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [equippingId, setEquippingId] = useState<number | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000); // Убираем ошибку спустя 3 секунды
      return () => clearTimeout(timer); // Очищаем таймер при выходе из эффекта
    }
  }, [error]);

  useEffect(() => {
    if (!isReady || !user?.id) return; // Если Telegram API ещё не готово или нет пользователя

    const fetchData = async () => {
      try {
        setLoading(true); // Показываем загрузчик перед отправкой запросов
        setError(null);   // Удаляем возможные предыдущие ошибки

        // Отправляем три параллельных запроса на получение данных
        const [
          userResponse,
          spritesResponse,
          ownedResponse
        ] = await Promise.all([
          api.getUserData(Number(user.id)),     // Получение данных пользователя
          api.getSprites(),                     // Получение списка спрайтов
          api.getOwnedSprites(Number(user.id))  // Получение списка приобретённых спрайтов
        ]);

        // Проверяем успешность каждого запроса отдельно
        if (userResponse.success && userResponse.data) {
          setCoins(userResponse.data.coins);       // Устанавливаем количество монет
          setCurrentSprite(userResponse.data.current_sprite_id || null); // Текущий выбранный спрайт
        } else if (userResponse.error) {
          setError(userResponse.error);           // Отображаем ошибку, если возникла проблема
        }

        if (spritesResponse.success && Array.isArray(spritesResponse.data)) {
          setSprites(spritesResponse.data);      // Заполняем список спрайтов
        } else if (spritesResponse.error) {
          setError(spritesResponse.error);        // Сообщаем об ошибке загрузки спрайтов
        }

        if (ownedResponse.success && Array.isArray(ownedResponse.data)) {
          setOwnedSprites(ownedResponse.data);   // Сохраняем список купленных спрайтов
        } else if (ownedResponse.error) {
          setError(ownedResponse.error);          // Сообщаем об ошибке получения списка купленных спрайтов
        }
      } catch (err) {
        console.error(err);                       // Логируем возможную общую ошибку
        setError('Непредвиденная ошибка');        // Стандартная ошибка на случай непредвиденных ситуаций
      } finally {
        setLoading(false);                         // Скрываем загрузчик независимо от результата
      }
    };

    fetchData();                                  // Выполнение асинхронного фетчинга данных
  }, [isReady, user]);                           // Повторяем при изменении готовности Telegram API и пользователя

  /**
   * Обработчик покупки спрайта
   */
  const handlePurchase = async (spriteId: number) => {
    if (!user?.id) {
      setError('Пользователь не определен');
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      setError('Этот спрайт уже куплен');
      return;
    }

    const sprite = sprites.find((s) => s.id === spriteId);
    if (!sprite) {
      setError('Спрайт не найден');
      return;
    }

    if (coins < sprite.price) {
      setError('У вас недостаточно монет');
      return;
    }

    try {
      setPurchasingId(spriteId);                 // Начинаем процесс покупки
      const response = await api.purchaseSprite(Number(user.id), spriteId);
      
      if (response.success) {
        setOwnedSprites(prev => [...prev, spriteId]); // Добавляем новый спрайт в список купленных
        setCoins(prev => prev - sprite.price);        // Вычитаем цену спрайта из количества монет
        setError(null);                               // Сбрасываем сообщение об ошибке
      } else {
        setError(response.error || 'Ошибка покупки');
      }
    } catch (error: any) {
      setError('Ошибка сети');
    } finally {
      setPurchasingId(null);                         // Завершаем покупку
    }
  };

  /**
   * Обработчик смены текущего спрайта
   */
  const handleEquip = async (spriteId: number) => {
    if (!user?.id) {
      setError('Пользователь не определен');
      return;
    }

    try {
      setEquippingId(spriteId);                   // Начинаем процесс выбора нового спрайта
      const response = await api.equipSprite(Number(user.id), spriteId);
  
      if (response.success) {
        setCurrentSprite(spriteId);               // Меняем текущий спрайт
        setError(null);                           // Сбрасываем сообщение об ошибке
      } else {
        setError(response.error || 'Ошибка применения');
      }
    } catch (error: any) {
      setError('Ошибка сети');
    } finally {
      setEquippingId(null);                       // Завершаем выбор спрайта
    }
  };

  // Пока идёт загрузка показываем индикатор
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      {/* Основная область страницы */}
      <div className="scrollable-content">
        <div className="header">
          <h2>Магазин спрайтов</h2>
          <div className="coins-display">Монеты: {coins}</div>
        </div>
        
        {/* Отображение ошибок */}
        {error && <div className="error">{error}</div>}

        {/* Контент зависит от наличия авторизованного пользователя и доступности спрайтов */}
        {!user?.id ? (
          <div className="error">
            Пользователь не идентифицирован. Обновите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов</div>
        ) : (
          /* Грид с доступными спрайтами */
          <div className="sprites-grid">
            {sprites.map((sprite) => {
              const isOwned = ownedSprites.includes(sprite.id);    // Проверяем, купил ли пользователь этот спрайт
              const isEquipped = currentSprite === sprite.id;      // Спрайт применён?
              const isPurchasing = purchasingId === sprite.id;     // Покупается сейчас?
              const isEquipping = equippingId === sprite.id;      // Применяется сейчас?

              return (
                <div key={sprite.id} className="sprite-card">
                  <img
                    src={sprite.image_url}
                    alt={sprite.name}
                    className="sprite-image"
                    onError={(e) =>
                      (e.currentTarget.src =
                        'https://via.placeholder.com/150?text=No+Image') // Замещающее изображение
                    }
                  />
                  <div className="sprite-info">
                    <h3>{sprite.name}</h3>
                    <div className="sprite-price">
                      Цена: {' '}
                      {sprite.price > 0 ? `${sprite.price} монет` : 'Бесплатно'} {/* Определяем стоимость спрайта */}
                    </div>
                    
                    <div className="sprite-actions">
                      {!isOwned ? (
                        coins >= sprite.price ? (
                          <button
                            className={`buy-btn ${isPurchasing ? 'loading' : ''}`}
                            onClick={() => handlePurchase(sprite.id)} // Нажатие кнопки покупает спрайт
                            disabled={isPurchasing} // Блокировка пока идет покупка
                          >
                            {isPurchasing ? 'Покупка...' : 'Купить'}
                          </button>
                        ) : (
                          <button className="buy-btn disabled" disabled>
                            Недостаточно
                          </button>
                        )
                      ) : (
                        <button
                          className={`equip-btn ${isEquipped ? 'equipped' : ''}`}
                          onClick={() => handleEquip(sprite.id)} // Кнопка изменения активного спрайта
                          disabled={isEquipped || isEquipping} // Заблокирована, если применяется другой спрайт
                        >
                          {isEquipping 
                            ? 'Применение...'
                            : isEquipped 
                              ? 'Применён'
                              : 'Применить'}
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

      {/* Навигационное меню внизу экрана */}
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
