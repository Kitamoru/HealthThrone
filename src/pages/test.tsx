
import { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';

export default function TestPage() {
  const { user, isReady, initData } = useTelegram();
  const [testResults, setTestResults] = useState({
    telegram: false,
    supabase: false,
    api: false
  });

  useEffect(() => {
    if (isReady && user) {
      setTestResults(prev => ({ ...prev, telegram: true }));
      
      // Тест API инициализации
      const testApi = async () => {
        try {
          const result = await api.initUser(initData);
          if (result.success) {
            setTestResults(prev => ({ ...prev, api: true, supabase: true }));
          }
        } catch (error) {
          console.error('API test failed:', error);
        }
      };

      testApi();
    }
  }, [isReady, user, initData]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🔧 Тест интеграции</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Статус компонентов:</h2>
        <div>
          {testResults.telegram ? '✅' : '❌'} Telegram WebApp
        </div>
        <div>
          {testResults.api ? '✅' : '❌'} API подключение
        </div>
        <div>
          {testResults.supabase ? '✅' : '❌'} Supabase интеграция
        </div>
      </div>

      {user && (
        <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
          <h3>Данные пользователя Telegram:</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Переменные окружения:</h3>
        <div>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Настроено' : '❌ Не настроено'}</div>
        <div>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_KEY ? '✅ Настроено' : '❌ Не настроено'}</div>
      </div>
    </div>
  );
}
