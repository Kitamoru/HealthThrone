import { useEffect, useState } from 'react';
import { queryClient } from '../lib/queryClient';

export const useCriticalDataReady = (pathname: string, userId?: number) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Определяем критические запросы для каждого пути
    const getCriticalQueries = (): [string, string?][] => {
      switch (pathname) {
        case '/friends':
          return [
            ['userData', userId.toString()],
            ['friends', userId.toString()]
          ];
        case '/shop':
          return [
            ['userData', userId.toString()],
            ['sprites']
          ];
        case '/octalysis':
          return [
            ['userData', userId.toString()],
            ['octalysisFactors', userId.toString()]
          ];
        default: // Главная страница
          return [
            ['userData', userId.toString()],
            ['octalysisFactors', userId.toString()]
          ];
      }
    };

    const checkCriticalData = () => {
      const queries = getCriticalQueries();
      const allDataPresent = queries.every(queryKey => 
        queryClient.getQueryData(queryKey) !== undefined
      );
      
      setIsReady(allDataPresent);
    };

    // Первоначальная проверка
    checkCriticalData();

    // Подписываемся на изменения кеша
    const unsubscribe = queryClient.getQueryCache().subscribe(checkCriticalData);

    return () => unsubscribe();
  }, [pathname, userId]);

  return isReady;
};
