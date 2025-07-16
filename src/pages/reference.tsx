import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import Head from 'next/head';
import BottomMenu from '../components/BottomMenu';

const ReferencePage = () => {
  const router = useRouter();
  const { webApp } = useTelegram();

  // SVG иконки
  const SwordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-swords">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M21 3v5l-11 9l-4 4l-3 -3l4 -4l9 -11z" />
      <path d="M5 13l6 6" />
      <path d="M14.32 17.32l3.68 3.68l3 -3l-3.365 -3.365" />
      <path d="M10 5.5l-2 -2.5h-5v5l3 2.5" />
    </svg>
  );

  const MageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-cog">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h2.5" />
      <path d="M19.001 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M19.001 15.5v1.5" />
      <path d="M19.001 21v1.5" />
      <path d="M22.032 17.25l-1.299 .75" />
      <path d="M17.27 20l-1.3 .75" />
      <path d="M15.97 17.25l1.3 .75" />
      <path d="M20.733 20l1.3 .75" />
    </svg>
  );

  const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-star">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
    </svg>
  );

  const FriendsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-users">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
    </svg>
  );

  const GhostIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-ghost">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M5 11a7 7 0 0 1 14 0v7a1.78 1.78 0 0 1 -3.1 1.4a1.65 1.65 0 0 0 -2.6 0a1.65 1.65 0 0 1 -2.6 0a1.65 1.65 0 0 0 -2.6 0a1.78 1.78 0 0 1 -3.1 -1.4v-7" />
      <path d="M10 10l.01 0" />
      <path d="M14 10l.01 0" />
      <path d="M10 14a3.5 3.5 0 0 0 4 0" />
    </svg>
  );

  const CoinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-pig-money">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M15 11v.01" />
      <path d="M5.173 8.378a3 3 0 1 1 4.656 -1.377" />
      <path d="M16 4v3.803a6.019 6.019 0 0 1 2.658 3.197h1.341a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-1.342c-.336 .95 -.907 1.8 -1.658 2.473v2.027a1.5 1.5 0 0 1 -3 0v-.583a6.04 6.04 0 0 1 -1 .083h-4a6.04 6.04 0 0 1 -1 -.083v.583a1.5 1.5 0 0 1 -3 0v-2l0 -.027a6 6 0 0 1 4 -10.473h2.5l4.5 -3h0z" />
    </svg>
  );

  return (
    <>
      <Head>
        <title>Справочная страница</title>
        <meta name="description" content="О приложении" />
      </Head>
      
      <div className="container">
        <div className="scrollable-content">
          <div className="header-block">
            <h1 className="page-title">О Moraleon</h1>
          </div>

          <div className="description-block">
            <div className="page-description">
              Moraleon — это ваш персональный трекер мотивации и выгорания, 
              который становится еще мощнее в команде.<br/>
              Ваша легенда начинается здесь! ✨
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">
              <span className="icon-wrapper"><SwordIcon /></span> Главный экран
            </h2>
            <div className="reference-card">
              <p>Система отслеживания выгорания:</p>
              <ul className="feature-list">
                <li><strong>Ежедневный опрос из 10 вопросов</strong></li>
                <li>Первые 2 вопроса влияют на уровень выгорания</li>
                <li>Остальные вопросы влияют на <strong>мотивационные факторы</strong></li>
                <li>Визуализация уровня выгорания (0-100%)</li>
                <li>Ограничение: 1 опрос в сутки</li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">
              <span className="icon-wrapper"><MageIcon /></span> Персонаж и классы
            </h2>
            <div className="reference-card">
              <p>Игровая система персонажей:</p>
              <ul className="feature-list">
                <li>Каждый пользователь проходит тест на <strong>класс персонажа</strong> при старте</li>
                <li>Классы имеют уникальные описания</li>
                <li>Нажмите на класс на главном экране, чтобы увидеть описание</li>
                <li>Персонажи имеют спутника в виде <strong>фамильяра</strong></li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">
              <span className="icon-wrapper"><StarIcon /></span> Карта мотивации
            </h2>
            <div className="reference-card">
              <p>Визуализация 8 ключевых факторов:</p>
              <ul className="feature-list">
                <li>Октаграмма показывает 8 аспектов мотивации</li>
                <li>Факторы обновляются после каждого опроса</li>
                <li>Каждый луч соответствует определенному мотивационному аспекту</li>
                <li>Нажмите "Как работает карта мотивации?" для подробностей</li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">
              <span className="icon-wrapper"><FriendsIcon /></span> Мои союзники
            </h2>
            <div className="reference-card">
              <p>Система друзей и командной работы:</p>
              <ul className="feature-list">
                <li>Просмотр участников команды с их фамильярами</li>
                <li>Индикатор уровня выгорания каждого союзника</li>
                <li>Разверните карточку для просмотра:
                  <ul>
                    <li>Класса персонажа союзника</li>
                    <li>Его карты мотивации</li>
                  </ul>
                </li>
                <li>Добавление союзников через <strong>реферальную ссылку</strong></li>
                <li>Функция удаления через <strong>"Изгнать союзника"</strong></li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">
              <span className="icon-wrapper"><GhostIcon /></span> Лавка фамильяров
            </h2>
            <div className="reference-card">
              <p>Кастомизация персонажа:</p>
              <ul className="feature-list">
                <li>Коллекция <strong>анимированных фамильяров</strong></li>
                <li>Покупка за монеты</li>
                <li>Применение купленных фамильяров ("Вызвать")</li>
                <li>Текущий фамильяр отображается как "Вызван"</li>
                <li>Отображение текущего баланса монет в шапке</li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">
              <span className="icon-wrapper"><CoinIcon /></span> Экономика и награды
            </h2>
            <div className="reference-card">
              <p>Система вознаграждений:</p>
              <ul className="feature-list">
                <li><strong>Монеты</strong> - валюта для покупок в лавке</li>
                <li><strong>+100 монет</strong> - за ежедневное прохождение опроса</li>
                <li><strong>+200 монет</strong> - за каждого приглашенного друга</li>
                <li>Монеты используются для покупки фамильяров в магазине</li>
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
