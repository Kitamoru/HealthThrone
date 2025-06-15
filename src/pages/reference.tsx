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
        <meta name="description" content="Инструкция о приложении" />
      </Head>
      
      <div className="container">
        <div className="scrollable-content">
          <h1 className="page-title">📚 Справочный центр</h1>
          
          <div className="reference-section">
            <h2 className="section-title">📊 Главная страница</h2>
            <div className="reference-card">
              <p>Главный экран приложения для отслеживания эмоционального выгорания:</p>
              <ul className="feature-list">
                <li>Ежедневный тест из 11 вопросов</li>
                <li>Визуализация уровня выгорания (0-100%)</li>
                <li>Автоматический расчет показателей</li>
                <li>Ограничение: 1 тест в сутки</li>
                <li>Текущая аватарка отображается на главной странице</li>
              </ul>
            </div>
          </div>

          <div className="reference-section">
            <h2 className="section-title">📈 Моя команда</h2>
            <div className="reference-card">
              <p>Управление командой и приглашение участников:</p>
              <ul className="feature-list">
                <li>Просмотр участников команды</li>
                <li>Индикаторы уровня выгорания для каждого друга</li>
                <li>Добавление через реферальную ссылку</li>
                <li>Удаление участников</li>
                <li>Копирование и расшаривание ссылки</li>
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
                <li>Применение купленных аватарок</li>
                <li>Отображение текущего баланса монет</li>
                <li>Бесплатные и платные варианты</li>
              </ul>
            </div>
          </div>

          <div className="reference-section hidden-features">
            <h2 className="section-title">🎁 Скрытые функции</h2>
            <div className="feature-card important">
              <h3>💰 Система монет</h3>
              <ul>
                <li><strong>+100 монет</strong> - за ежедневное прохождение теста</li>
                <li><strong>+200 монет</strong> - за каждого приглашенного друга</li>
                <li>Монеты используются для покупки спрайтов в магазине</li>
              </ul>
              
              <h3>🔄 Особенности работы</h3>
              <ul>
                <li>Аватарки остаются у вас навсегда после покупки</li>
                <li>Бесплатные спрайты доступны сразу</li>
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
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>ℹ️</button>
        </div>
      </div>
      
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #f5f7fa;
          font-family: 'Roboto', sans-serif;
        }
        
        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          padding-bottom: 60px;
        }
        
        .page-title {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 24px;
          font-size: 1.8rem;
        }
        
        .reference-section {
          margin-bottom: 25px;
          animation: fadeIn 0.5s ease;
        }
        
        .section-title {
          color: #3498db;
          border-bottom: 2px solid #3498db;
          padding-bottom: 8px;
          margin-bottom: 15px;
          font-size: 1.4rem;
        }
        
        .reference-card, .feature-card {
          background: white;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          margin-bottom: 15px;
          border-left: 4px solid #3498db;
        }
        
        .feature-card.important {
          border-left: 4px solid #e74c3c;
          background: #fff9f9;
        }
        
        .feature-list {
          padding-left: 20px;
          margin: 12px 0;
        }
        
        .feature-list li {
          margin-bottom: 10px;
          line-height: 1.5;
        }
        
        .hidden-features .section-title {
          color: #e74c3c;
          border-color: #e74c3c;
        }
        
        .menu {
          position: fixed;
          bottom: 0;
          width: 100%;
          display: flex;
          justify-content: space-around;
          background: white;
          padding: 12px 0;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          z-index: 100;
        }
        
        .menu-btn {
          background: none;
          border: none;
          font-size: 1.6rem;
          cursor: pointer;
          padding: 8px 20px;
          border-radius: 50px;
          transition: all 0.3s;
        }
        
        .menu-btn.active {
          background: #3498db;
          color: white;
          transform: translateY(-5px);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 480px) {
          .reference-card, .feature-card {
            padding: 14px;
          }
          
          .page-title {
            font-size: 1.5rem;
          }
          
          .section-title {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </>
  );
};

export default ReferencePage;
