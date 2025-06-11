import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppContext } from '@/context/UserContext';
import { Loader } from '@/components/Loader';
import { Sprite } from '@/lib/types';

export default function Shop() {
  const router = useRouter();
  const { user, sprites, ownedSprites, coins, isLoading, error, updateUser } = useAppContext();
  const [currentSprite, setCurrentSprite] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.current_sprite_id !== undefined) {
      setCurrentSprite(user.current_sprite_id);
    }
  }, [user]);

  const handlePurchase = async (spriteId: number) => {
    if (!user?.id) {
      alert('Пользователь не определен.');
      return;
    }

    if (ownedSprites.includes(spriteId)) {
      alert('Вы уже приобрели этот спрайт!');
      return;
    }

    const sprite = sprites.find((s) => s.id === spriteId);
    if (!sprite) {
      alert('Такой спрайт не существует.');
      return;
    }

    if (coins < sprite.price) {
      alert('Недостаточно монет для покупки.');
      return;
    }

    try {
      const response = await updateUser(user.id!, '', spriteId); // Передача нового выбранного спрайта

      if (response.success) {
        setCurrentSprite(spriteId);
        alert('Покупка успешно совершена!');
      } else {
        alert(`Ошибка при покупке: ${response.error}`);
      }
    } catch (error) {
      alert('Ошибка сети: попробуйте позже.');
    }
  };

  const handleEquip = async (spriteId: number) => {
    if (!user?.id) {
      alert('Пользователь не определен.');
      return;
    }

    try {
      const response = await updateUser(user.id!, '', spriteId); // Экипируем выбранный спрайт

      if (response.success) {
        setCurrentSprite(spriteId);
        alert('Экипировка применена!');
      } else {
        alert(`Ошибка при применении экипировки: ${response.error}`);
      }
    } catch (error) {
      alert('Ошибка сети: попробуйте позже.');
    }
  };

  if (isLoading) {
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

        {!user?.id ? (
          <div className="error">
            Пользователь не идентифицирован. Обновите страницу.
          </div>
        ) : sprites.length === 0 ? (
          <div className="info">Нет доступных спрайтов.</div>
        ) : (
          <div className="sprites-grid">
            {sprites.map((sprite) => {
              const isOwned = ownedSprites.includes(sprite.id);
              const isEquipped = currentSprite === sprite.id;

              return (
                <div key={sprite.id} className="sprite-card">
                  <img
                    src={sprite.image_url}
                    alt={sprite.name}
                    className="sprite-image"
                    onError={(e) =>
                      (e.currentTarget.src =
                        'https://via.placeholder.com/150?text=No+Image')}
                  />
                  <div className="sprite-info">
                    <h3>{sprite.name}</h3>
                    <div className="sprite-price">
                      Цена:{' '}
                      {sprite.price > 0 ? `${sprite.price} монет` : 'Бесплатно'}
                    </div>
                    <div className="sprite-actions">
                      {!isOwned ? (
                        coins >= sprite.price ? (
                          <button
                            className="buy-btn"
                            onClick={() => handlePurchase(sprite.id)}>
                            Купить
                          </button>
                        ) : (
                          <button className="buy-btn disabled" disabled>
                            Недостаточно
                          </button>
                        )
                      ) : (
                        <button
                          className={`equip-btn ${isEquipped ? 'disabled' : ''}`}
                          onClick={() => handleEquip(sprite.id)}
                          disabled={isEquipped}>
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
