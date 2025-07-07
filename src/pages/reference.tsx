import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import Head from 'next/head';

const ReferencePage = () => {
  const router = useRouter();
  const { webApp } = useTelegram();

  return (
    <>
      <Head>
        <title>Справочная страница</title>
        <meta name="description" content="О приложении" />
      </Head>
      
      <div className="container-reference">
        <div className="scrollable-content">
          <h1 className="page-title">📚 Где я?</h1>
          
          {/* Добавленное описание */}
          <div className="page-description">
            Moraleon — это ваш персональный трекер мотивации и выгорания, 
            который становится еще мощнее в команде.<br/>
            Ваша легенда начинается здесь! ⚔️✨
          </div>
          {/* Конец добавленного блока */}

          <div className="reference-section">
            <h2 className="section-title">📊 Главный экран</h2>
            <div className="reference-card">
              <p>Отслеживание эмоционального выгорания:</p>
              <ul className="feature-list">
                <li>Ежедневный чек-лист из 11 вопросов</li>
                <li>Визуализация уровня выгорания (0-100%)</li>
                <li>Автоматический расчет показателей</li>
                <li>Ограничение: 1 опрос в сутки</li>
              </ul>
            </div>
          </div>

          {/* Остальная часть кода без изменений */}
          <div className="reference-section">
            <h2 className="section-title">📈 Моя команда</h2>
            <div className="reference-card">
              <p>Управление командой:</p>
              <ul className="feature-list">
                <li>Просмотр участников команды</li>
                <li>Индикатор уровня их выгорания</li>
                <li>Добавление через реферальную ссылку</li>
                <li>Удаление участников</li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">🛍️ Магазин</h2>
            <div className="reference-card">
              <p>Персонализация вашего профиля:</p>
              <ul className="feature-list">
                <li>Коллекция спрайтов</li>
                <li>Покупка за монеты</li>
                <li>Применение купленных спрайтов</li>
                <li>Отображение текущего баланса монет</li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">🎁 Скрытые функции</h2>
            <div className="reference-card important">
              <h3>💰 Система монет</h3>
              <ul className="feature-list">
                <li><strong>+100 монет</strong> - за ежедневное прохождение теста</li>
                <li><strong>+200 монет</strong> - за каждого приглашенного друга</li>
                <li>Монеты используются для покупки спрайтов в магазине</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="menu">
          <Link href="/" passHref>
            <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>📊</button>
          </Link>
          <Link href="/friends" passHref>
            <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>📈</button>
          </Link>
          <Link href="/shop" passHref>
            <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>🛍️</button>
          </Link>
          <button className={`menu-btn active`}>ℹ️</button>
        </div>
      </div>
    </>
  );
};

export default ReferencePage;
