import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import Head from 'next/head';
import BottomMenu from '../components/BottomMenu';

const ReferencePage = () => {
  const router = useRouter();
  const { webApp } = useTelegram();

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
            <h2 className="section-title">⚔️ Главный экран</h2>
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
            <h2 className="section-title">🧙 Персонаж и классы</h2>
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
            <h2 className="section-title">🌟 Карта мотивации</h2>
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
            <h2 className="section-title">👥 Мои союзники</h2>
            <div className="reference-card">
              <p>Система друзей и командной работы:</p>
              <ul className="feature-list">
                <li>Просмотр участников команды с их фамильярами</li>
                <li>Индикатор уровня выгорания каждого союзника</li>
                <li>Разверните карточку для просмотра:
                  <ul>
                    <li>Класса персонажа союзника</li>
                    <li>Его карта мотивации</li>
                  </ul>
                </li>
                <li>Добавление союзников через <strong>реферальную ссылку</strong></li>
                <li>Функция удаления через <strong>"Изгнать союзника"</strong></li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">🛍️ Лавка фамильяров</h2>
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
            <h2 className="section-title">🪙 Экономика и награды</h2>
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
