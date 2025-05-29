import React, { useState, useEffect } from 'react';
import './styles.css';

function App() {
  const [state, setState] = useState({
    isLoading: true,
    burnoutLevel: 5,
    error: null
  });

  useEffect(() => {
    const initApp = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg) throw new Error('Telegram context missing');

        tg.ready();
        tg.expand();

        // 1. Отправка initData для верификации
        const response = await fetch('/api/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            initData: tg.initData 
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Auth failed');
        }

        // 2. Загрузка данных пользователя
        const data = await response.json();
        setState(s => ({ 
          ...s, 
          burnoutLevel: data.burnout_level,
          isLoading: false 
        }));

      } catch (err) {
        setState({ 
          isLoading: false, 
          burnoutLevel: 5, 
          error: err.message 
        });
      }
    };

    initApp();
  }, []);

  // Обработка ответов
  const handleAnswer = async (delta) => {
    try {
      const newLevel = Math.max(0, Math.min(10, state.burnoutLevel + delta));
      setState(s => ({ ...s, burnoutLevel: newLevel }));

      const tg = window.Telegram?.WebApp;
      await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: tg?.initDataUnsafe?.user?.id,
          delta
        })
      });

    } catch (err) {
      setState(s => ({ 
        ...s, 
        error: 'Failed to save data' 
      }));
    }
  };

  // Рендеринг ошибки
  if (state.error) {
    return (
      <div className="error-screen">
        <h2>⚠️ Ошибка</h2>
        <p>{state.error}</p>
        <button onClick={() => window.location.reload()}>
          Перезагрузить
        </button>
      </div>
    );
  }

  // Основной интерфейс
  return (
    <div className="container">
      {state.isLoading ? (
        <div className="loader">
          <div className="loader-spinner">🚀</div>
          <div className="loader-text">Загрузка...</div>
        </div>
      ) : (
        <>
          <div className="header">
            <img 
              src="/sprite.gif" 
              className="sprite-container" 
              alt="Персонаж"
            />
            <div className="pentagon">🔥</div>
          </div>

          <div className="progress-wrapper">
            <div className="burnout-bar">
              <div 
                className="burnout-progress" 
                style={{ width: `${state.burnoutLevel * 10}%` }}
              />
            </div>
          </div>

          <div className="content">
            {[
              'Я чувствую себя энергичным',
              'Мне легко концентрироваться',
              'Я получаю удовольствие от работы',
              'Я хорошо сплю',
              'Я чувствую себя мотивированным',
              'У меня хороший аппетит'
            ].map((question, idx) => (
              <div key={idx} className="question-card">
                <p className="question-text">{idx + 1}. {question}</p>
                <div className="answer-buttons">
                  <button
                    className="answer-btn negative"
                    onClick={() => handleAnswer(-1)}
                  >
                    👎
                  </button>
                  <button
                    className="answer-btn positive"
                    onClick={() => handleAnswer(1)}
                  >
                    👍
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;