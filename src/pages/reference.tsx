import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import Head from 'next/head';
import BottomMenu from '../components/BottomMenu'; // Импортируем компонент меню

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
          {/* Отдельный блок для заголовка "Где я?" */}
          <div className="header-block">
            <h1 className="page-title">О Maraleon</h1>
          </div>

          {/* Блок описания приложения */}
          <div className="description-block">
            <div className="page-description">
              Moraleon — это ваш персональный трекер мотивации и выгорания, 
              который становится еще мощнее в команде.<br/>
              Ваша легенда начинается здесь! ⚔️✨
            </div>
          </div>

          {/* Остальные блоки информации */}
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

          <div className="reference-section">
            <h2 className="section-title">📈 Мои союзники</h2>
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
            <h2 className="section-title">🛍️ Лавка фамильяров</h2>
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

          {/* Обновленный блок "Скрытые функции" */}
          <div className="reference-section">
            <h2 className="section-title">🎁 Скрытые функции</h2>
            <div className="reference-card">
              <p>Монеты можно получить:</p>
              <ul className="feature-list">
                <li><strong>+100 монет</strong> - за ежедневное прохождение теста</li>
                <li><strong>+200 монет</strong> - за каждого приглашенного друга</li>
                <li>Монеты используются для покупки спрайтов в магазине</li>
              </ul>
            </div>
          </div>
        </div>
        
    <BottomMenu />
      </div>
    </>
  );
};

export default ReferencePage;
