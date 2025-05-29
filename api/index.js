require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Отладочный вывод переменных окружения
console.log('Supabase URL:', process.env.SUPABASE_URL?.slice(0, 15) + '...');
console.log('Supabase KEY:', process.env.SUPABASE_KEY?.slice(0, 10) + '...');
console.log('Telegram Token:', process.env.TOKEN?.slice(0, 5) + '...');

// Инициализация Supabase с SSL настройками
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: { persistSession: false },
    db: {
      schema: 'public',
      ssl: {
        rejectUnauthorized: false // Только для разработки!
      }
    }
  }
);

// Проверка подключения к Supabase
supabase
  .from('users')
  .select('*')
  .limit(1)
  .then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      process.exit(1);
    }
    console.log('✅ Successfully connected to Supabase');
  });

// Верификация данных Telegram
const verifyTelegramData = (initData) => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Генерация секретного ключа
    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TOKEN)
      .digest();

    // Сортировка параметров
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Вычисление хеша
    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    return hash === calculatedHash;
  } catch (err) {
    console.error('🔒 Telegram hash verification failed:', err.message);
    return false;
  }
};

// Логирование входящих запросов
router.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`, {
    user_id: req.body?.user_id?.slice(0, 5) + '...',
    delta: req.body?.delta
  });
  next();
});

// Инициализация пользователя
router.post('/init', async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData required' });
    }

    // Верификация данных Telegram
    if (!verifyTelegramData(initData)) {
      console.warn('⚠️ Invalid Telegram auth data');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Парсинг данных пользователя
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user'));
    const user_id = user?.id;

    if (!user_id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    // Upsert записи пользователя
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        user_id,
        username: user?.username,
        first_name: user?.first_name,
        burnout_level: 5
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      throw new Error(`Upsert error: ${upsertError.message}`);
    }

    // Получение обновленных данных
    const { data, error: selectError } = await supabase
      .from('users')
      .select('burnout_level')
      .eq('user_id', user_id)
      .single();

    if (selectError) {
      throw new Error(`Select error: ${selectError.message}`);
    }

    res.json({
      burnout_level: data?.burnout_level || 5
    });

  } catch (err) {
    console.error('💥 Init error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение данных пользователя
router.get('/data', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('burnout_level')
      .eq('user_id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Не найдена запись
        return res.json({ burnout_level: 5 });
      }
      throw new Error(`Select error: ${error.message}`);
    }

    res.json({ burnout_level: data?.burnout_level || 5 });

  } catch (err) {
    console.error('💥 Data fetch error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Обновление уровня burnout
router.post('/update', async (req, res) => {
  try {
    const { user_id, delta } = req.body;

    if (!user_id || typeof delta !== 'number') {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const { error } = await supabase.rpc('update_burnout', {
      user_id,
      delta
    });

    if (error) {
      throw new Error(`RPC error: ${error.message}`);
    }

    res.json({ status: 'ok' });

  } catch (err) {
    console.error('💥 Update error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Update failed',
      details: err.message
    });
  }
});

module.exports = router;