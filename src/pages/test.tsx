
import { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

interface TestResults {
  telegram: { status: boolean; message: string };
  supabase: { status: boolean; message: string };
  api: { status: boolean; message: string };
  webhook: { status: boolean; message: string };
}

export default function TestPage() {
  const { user, isReady, initData } = useTelegram();
  const [testResults, setTestResults] = useState<TestResults>({
    telegram: { status: false, message: 'Проверка...' },
    supabase: { status: false, message: 'Проверка...' },
    api: { status: false, message: 'Проверка...' },
    webhook: { status: false, message: 'Проверка...' }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    // Test 1: Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setTestResults(prev => ({
        ...prev,
        telegram: { 
          status: true, 
          message: `✅ Подключен (${user?.first_name || 'Пользователь'})` 
        }
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        telegram: { 
          status: false, 
          message: '❌ Telegram WebApp не обнаружен' 
        }
      }));
    }

    // Test 2: Supabase connection
    try {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) throw error;
      
      setTestResults(prev => ({
        ...prev,
        supabase: { 
          status: true, 
          message: '✅ Подключение к Supabase работает' 
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        supabase: { 
          status: false, 
          message: `❌ Ошибка Supabase: ${error}` 
        }
      }));
    }

    // Test 3: API endpoints
    try {
      if (user && initData) {
        const result = await api.initUser(initData);
        if (result.success) {
          setTestResults(prev => ({
            ...prev,
            api: { 
              status: true, 
              message: '✅ API endpoints работают' 
            }
          }));
        } else {
          throw new Error(result.error);
        }
      } else {
        setTestResults(prev => ({
          ...prev,
          api: { 
            status: false, 
            message: '❌ Нет данных пользователя для теста API' 
          }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        api: { 
          status: false, 
          message: `❌ Ошибка API: ${error}` 
        }
      }));
    }

    // Test 4: Webhook endpoint
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { text: '/start' } })
      });
      
      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          webhook: { 
            status: true, 
            message: '✅ Webhook endpoint доступен' 
          }
        }));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        webhook: { 
          status: false, 
          message: `❌ Webhook недоступен: ${error}` 
        }
      }));
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'var(--tg-font-family)', 
      background: 'var(--tg-bg)', 
      color: 'var(--tg-text)',
      minHeight: '100vh'
    }}>
      <h1>🔧 Тест интеграций</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Статус компонентов:</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Telegram WebApp:</strong> {testResults.telegram.message}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Supabase Database:</strong> {testResults.supabase.message}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>API Endpoints:</strong> {testResults.api.message}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Webhook:</strong> {testResults.webhook.message}
        </div>
      </div>

      {user && (
        <div style={{ 
          background: 'var(--tg-secondary)', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Данные пользователя Telegram:</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ 
        background: 'var(--tg-secondary)', 
        padding: '15px', 
        borderRadius: '8px'
      }}>
        <h3>Переменные окружения:</h3>
        <div>
          SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Настроено' : '❌ Не настроено'}
        </div>
        <div>
          SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_KEY ? '✅ Настроено' : '❌ Не настроено'}
        </div>
      </div>

      <button 
        onClick={runTests}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'var(--tg-button)',
          color: 'var(--tg-button-text)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🔄 Перезапустить тесты
      </button>
    </div>
  );
}
