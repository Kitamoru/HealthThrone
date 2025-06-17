import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './api';
import { queryClient } from './queryClient';

export const useUserData = (telegramId: number) => {
  return useQuery({
    queryKey: ['user', telegramId],
    queryFn: () => api.getUserData(telegramId),
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSpritesData = () => {
  return useQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useOwnedSprites = (telegramId: number) => {
  return useQuery({
    queryKey: ['ownedSprites', telegramId],
    queryFn: () => api.getOwnedSprites(telegramId),
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePurchaseSprite = () => {
  return useMutation({
    mutationFn: (params: {
      telegramId: number;
      spriteId: number;
    }) => api.purchaseSprite(params.telegramId, params.spriteId),
  });
};

export const useEquipSprite = () => {
  return useMutation({
    mutationFn: (params: {
      telegramId: number;
      spriteId: number;
    }) => api.equipSprite(params.telegramId, params.spriteId),
  });
};
