# Moraleon - Telegram Mini App для отслеживания мотивации и выгорания в стиле фэнтези

<div align="center">

![Moraleon Logo](https://via.placeholder.com/150x150/18222d/0FEE9E?text=🎮)
![Telegram Mini App](https://img.shields.io/badge/Telegram-Mini%20App-2AABEE?logo=telegram)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

**Твой персональный трекер мотивации, который становится еще мощнее в команде**

</div>

## 📖 Содержание

- [🎯 О проекте](#🎯-о-проекте)
- [🚀 Функциональность](#🚀-функциональность)
- [🛠 Технологии](#🛠-технологии)
- [🚀 Быстрый старт](#🚀-быстрый-старт)
- [📚 Документация](#📚-документация)
- [👨💻 Разработка](#👨💻-разработка)
- [🤝 Участие](#🤝-участие)

## 🎯 О проекте

Moraleon — это инновационное приложение для Telegram, которое превращает отслеживание мотивации и профилактику выгорания в увлекательную RPG-игру. Проект сочетает в себе геймификацию, практическую реализацию теории октализа и социальные элементы для создания комплексного решения проблемы профессионального выгорания.

### 🌟 Ключевые особенности

- **🎮 Геймификация**: Система классов персонажей, фамильяров и прогресса
- **📊 Октализ**: Визуализация 8 ключевых факторов мотивации
- **👥 Социальные элементы**: Система друзей и совместных достижений
- **💎 Экономика**: Внутриигровая валюта и система наград
- **📱 Нативная интеграция**: Полная поддержка Telegram Mini Apps
- **🔒 Безопасность**: End-to-end валидация данных через Telegram WebApp

## 🚀 Функциональность

### Основные модули

| Модуль | Описание | Особенности |
|--------|-----------|-------------|
| **🏠 Главный экран** | Ежедневный опрос и отслеживание состояния | 10 вопросов, октаграмма мотивации |
| **👥 Мои союзники** | Система друзей и командной работы | Приглашения, общие показатели |
| **🛍️ Лавка фамильяров** | Магазин кастомизации | Покупка/применение спрайтов, система монет |
| **📚 Справочник** | Обучение и руководство | Полное описание механик |
| **🎯 Онбординг** | Определение класса персонажа |

### Система классов персонажей

Проект реализует сложную систему классификации на основе:
- **17 профессиональных ролей** (Разработчик, Дизайнер, HR, C-level и др.)
- **4 базовых психотипа** (Достигатор, Исследователь, Социализатор, Убийца)
- **68 уникальных классов** с индивидуальными описаниями

### Ежедневная механика

- **📝 Ежедневный опрос**: 10 вопросов для оценки состояния
- **🎯 Ограничение**: 1 опрос в сутки для формирования привычки
- **📈 Динамическое обновление**: Факторы октализиса обновляются после каждого опроса
- **💫 Визуализация**: Интерактивная октаграмма показывает 8 аспектов мотивации

## 🛠 Технологии

### Frontend Stack
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - Статическая типизация
- **TanStack Query** - Управление состоянием и кеширование
- **Framer Motion** - Анимации и переходы
- **React Tinder Card** - Swipe-интерфейс для опросов

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth + Storage)
- **PostgreSQL** - База данных с Row Level Security
- **Telegram WebApp API** - Нативная интеграция с Telegram

### Стилизация & UI
- **CSS Modules** - Компонентные стили
- **Адаптивный дизайн** - Mobile-first подход
- **Telegram UI Kit** - Нативные элементы Telegram

## 📚 Документация

### Архитектура проекта

```
moraleon/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Группировка маршрутов
│   │   ├── layout.tsx     # Корневой layout
│   │   ├── page.tsx       # Главная страница
│   │   ├── friends/       # Страница друзей
│   │   ├── shop/          # Магазин фамильяров
│   │   └── reference/     # Справочная страница
│   ├── api/               # API endpoints
│   │   ├── data/          # Данные пользователя
│   │   ├── friends/       # Управление друзьями
│   │   ├── shop/          # Магазин и покупки
│   │   ├── octalysis/     # Факторы мотивации
│   │   └── updateBurnout/ # Обновление состояния
│   └── globals.css        # Глобальные стили
├── components/            # React компоненты
│   ├── ui/               # Базовые UI компоненты
│   │   ├── BottomMenu.tsx # Нижнее меню
│   │   ├── Loader.tsx     # Индикатор загрузки
│   │   └── SurveyModal.tsx # Модалка опроса
│   ├── onboarding/       # Онбординг и тестирование
│   │   └── Onboarding.tsx # Компонент онбординга
│   ├── CharacterSprite.tsx # Анимированный спрайт
│   ├── Octagram.tsx      # Октаграмма мотивации
│   └── BurnoutBlock.tsx  # Блок уровня выгорания
├── hooks/                # Кастомные React хуки
│   └── useTelegram.ts    # Интеграция с Telegram
├── lib/                  # Утилиты и конфигурации
│   ├── api.ts           # API клиент и хуки
│   ├── supabase.ts      # Supabase конфигурация
│   ├── telegramAuth.ts  # Аутентификация Telegram
│   ├── types.ts         # TypeScript типы
│   └── queryClient.ts   # Конфигурация React Query
└── public/              # Статические файлы
    └── sprites/         # Изображения фамильяров
```

### API Reference

#### Основные endpoints

| Метод | Endpoint | Назначение | Параметры |
|-------|----------|------------|-----------|
| `GET` | `/api/data` | Данные пользователя | `telegramId` |
| `POST` | `/api/init` | Инициализация пользователя | `initData`, `ref` |
| `POST` | `/api/updateBurnout` | Обновление уровня выгорания | `telegramId`, `burnoutDelta`, `factors` |
| `GET` | `/api/octalysis` | Факторы октализиса | `userId` |
| `GET` | `/api/friends` | Список друзей | `telegramId` |
| `DELETE` | `/api/friends/[id]` | Удаление друга | `friendId` |
| `GET` | `/api/shop/sprites` | Спрайты для магазина | - |
| `POST` | `/api/shop/purchase` | Покупка спрайта | `telegramId`, `spriteId` |
| `POST` | `/api/shop/equip` | Применение спрайта | `telegramId`, `spriteId` |

#### Пример использования API

```typescript
// Инициализация пользователя
const response = await api.initUser(initData, startParam);

// Получение данных пользователя
const userData = await api.getUserData(telegramId, initData);

// Отправка результатов опроса
await api.submitSurvey({
  telegramId: user.id,
  burnoutDelta: calculatedDelta,
  factors: octalysisFactors,
  initData
});
```

### Система классов персонажей

#### Базовые психотипы

1. **Достигатор** - Фокус на целях и результатах
2. **Исследователь** - Стремление к знаниям и открытиям  
3. **Социализатор** - Важность отношений и командной работы
4. **Убийца** - Конкуренция и доказательство превосходства

#### Примеры классов

| Роль | Достигатор | Исследователь | Социализатор | Убийца |
|------|------------|---------------|--------------|--------|
| **Разработчик** | Мастер алгоритмов | Искатель оптимизации | Бард коллаборации | Разрушитель багов |
| **Дизайнер** | Ясновидящий | Картограф опыта | Глас народа | Разрушитель хаоса |
| **HR** | Инженер талантов | Картограф мотивации | Изгнанник выгорания | Охотник за головами |

### Конфигурация

#### Переменные окружения

```env
# Обязательные
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NEXT_PUBLIC_BOT_USERNAME=your_bot_username

# Опциональные
NEXT_PUBLIC_APP_URL=your_deployment_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Конфигурация Supabase

```sql
-- Включение RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политика доступа к пользователям
CREATE POLICY "Users can read own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Функция для обработки рефералов
CREATE OR REPLACE FUNCTION handle_referral(
  new_user_id UUID,
  referrer_tg_id BIGINT,
  bonus_amount INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Логика начисления бонусов рефереру
END;
$$ LANGUAGE plpgsql;
```

## 👨💻 Разработка

### Скрипты package.json

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "test": "jest",
  "test:e2e": "playwright test"
}
```

### Процесс разработки

1. **Создание feature ветки**
```bash
git checkout -b feature/amazing-feature
```

2. **Разработка с горячей перезагрузкой**
```bash
npm run dev
```

3. **Проверка типов и линтинг**
```bash
npm run type-check && npm run lint
```

4. **Тестирование**
```bash
npm test
```

### Code Style

- **TypeScript**: Строгая типизация, избегание `any`
- **Именование**: PascalCase для компонентов, camelCase для функций
- **Компоненты**: Функциональные компоненты с хуками
- **Стили**: CSS Modules с BEM-подобной методологией

### Тестирование

```bash
# Unit тесты
npm test

# E2E тесты
npm run test:e2e

# Проверка покрытия
npm test -- --coverage
```

## 🚀 Деплой

### Vercel (Рекомендуется)

```bash
npm run build
vercel --prod
```

### Подготовка к продакшену

1. **Оптимизация изображений**
```bash
npm run build:optimize
```

2. **Анализ бандла**
```bash
npm run analyze
```

3. **Тестирование производительности**
```bash
npm run test:performance
```

### Мониторинг и аналитика

- **Supabase Analytics**: Мониторинг запросов к БД
- **Vercel Analytics**: Аналитика производительности
- **Custom Events**: Отслеживание пользовательских действий

## 🤝 Участие

Мы приветствуем вклад в развитие проекта! 

### Как помочь проекту

1. **Сообщения об ошибках**: Используйте Issues для багов
2. **Документация**: Помогите улучшить документацию
3. **Переводы**: Добавьте поддержку новых языков

### Процесс разработки

1. **Форкните репозиторий**
2. **Создайте feature ветку**
3. **Сделайте коммит изменений**
4. **Запушьте ветку**
5. **Создайте Pull Request**

### Требования к коду

- ✅ Проходит линтинг и проверку типов
- ✅ Соответствует существующему code style
- ✅ Включает тесты для новой функциональности
- ✅ Обновляет документацию при необходимости

## 🐛 Поиск и устранение неисправностей

### Распространенные проблемы

**Проблема**: Ошибка аутентификации Telegram
```bash
# Решение: Проверьте токен бота и initData
console.log('Init Data:', initData);
```

**Проблема**: Ошибки Supabase RLS
```sql
-- Решение: Проверьте политики доступа
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

**Проблема**: Не загружаются изображения
```bash
# Решение: Проверьте пути и настройки CORS
npm run check:assets
```

### Дебаггинг

```typescript
// Включение подробного логирования
localStorage.setItem('debug', 'moraleon:*');

// Проверка состояния Telegram WebApp
console.log('WebApp state:', window.Telegram?.WebApp);
```

## 📈 Дорожная карта

### Версия 1.1 (Q4 2026)
- [ ] Расширенная аналитика мотивации
- [ ] Групповые челленджи
- [ ] Система достижений
- [ ] AI-ассистент для интепретации результатов октаграммы

### Версия 1.2 (Q1 2026)
- [ ] AI-ассистент для рекомендаций
- [ ] Расширенная аналитика для HR
- [ ] API для сторонних интеграций

### Версия 2.0 (Q2 2026)

- [ ] Квесты и индивидуальные задания
- [ ] Мини игры для вовлечения
- [ ] Marketplace фамильяров

## 👥 Команда разработки

- **Developer**: [Иванов Вадим]
- **UI/UX Designer**: [Мирзагалимов Булат]

## 🔗 Полезные ссылки

- [🌐 Приложение](https://t.me/MoraleonBot)
- [📖 Документация Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [🗃️ Документация Supabase](https://supabase.com/docs)
- [🎮 Октализ: Геймификация в бизнесе](https://yukaichou.com/octalysis-book/)
- [💬 Telegram канал обновлений](https://t.me/+CiYNPjJNjHswZDBi)

---

<div align="center">

**Присоединяйтесь к нашей команде, вместе мы сделаем борьбу с выгоранием увлекательной!**

*✨ Твоя мотивация — искра. Вместе мы — пламя! 🔥*

</div>
