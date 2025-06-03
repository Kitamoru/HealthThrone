import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';
import { useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';

export default function App({ Component, pageProps }: AppProps) {
  const { isReady, initData, startParam } = useTelegram();

  useEffect(() => {
    if (isReady && initData) {
      console.log('Initializing user with startParam:', startParam);
      api.initUser(initData, startParam)
        .then(response => {
          if (response.success) {
            console.log('User initialized successfully');
          } else {
            console.error('Failed to initialize user:', response.error);
          }
        });
    }
  }, [isReady, initData, startParam]);

  return (
    <>
      <Head>
        <title>Burnout Tracker - Отслеживание выгорания</title>
        <meta name="description" content="Telegram Mini App для отслеживания уровня выгорания" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#18222d" />
      </Head>
      
      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive" 
      />
      
      <Component {...pageProps} />
    </>
  );
}
