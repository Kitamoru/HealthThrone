import { useState, useEffect } from 'react';
import { ApiResponse, Friend } from './types';
import { api } from './api'; // Предположим, что путь правильный
import { useFriendsData } from './hooks'; // Предположим, что путь правильный

const FriendsPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Предположим, что userId и initData получены из контекста или пропсов
  const userId = 123; // Пример значения, в реальном коде это будет динамически
  const initData = 'example_init_data';

  // Используем хук для получения друзей
  const { data, isLoading, isError } = useFriendsData(userId, initData);

  useEffect(() => {
    if (data) {
      setFriends(data);
      setLoading(false);
    }
    if (isError) {
      setError('Failed to load friends');
      setLoading(false);
    }
  }, [data, isError]);

  // ИЛИ: если используется прямой вызов API в эффекте
  const loadFriendsDirectly = async () => {
    try {
      if (!userId || !initData) return;
      
      // ИСПРАВЛЕНИЕ: преобразуем userId в число перед передачей
      const userIdNumber = Number(userId);
      if (isNaN(userIdNumber)) {
        throw new Error('Invalid user ID');
      }

      const response = await api.getFriends(userIdNumber, initData);
      
      if (response.success && response.data) {
        setFriends(response.data);
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Выберите один из подходов (хук или прямой вызов)
  // useEffect(() => { loadFriendsDirectly(); }, []);

  if (loading) return <div>Loading friends...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="friends-container">
      <h2>Your Friends</h2>
      <ul>
        {friends.map(friend => (
          <li key={friend.id}>
            <div>
              <strong>{friend.friend.first_name}</strong>
              {friend.friend.last_name && ` ${friend.friend.last_name}`}
            </div>
            <div>Burnout level: {friend.friend.burnout_level}</div>
            <div>Coins: {friend.friend.coins}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendsPage;
