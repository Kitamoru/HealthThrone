
import type { User, BurnoutUpdateResponse, ApiResponse } from '@/types';

const API_BASE = '/api';

export const api = {
  async init(initData: string): Promise<ApiResponse<{ burnout_level: number }>> {
    const response = await fetch(`${API_BASE}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    });
    return response.json();
  },

  async getUserData(userId: string): Promise<ApiResponse<{ burnout_level: number }>> {
    const response = await fetch(`${API_BASE}/data?user_id=${userId}`);
    return response.json();
  },

  async updateBurnout(userId: string, delta: number): Promise<ApiResponse<BurnoutUpdateResponse>> {
    const response = await fetch(`${API_BASE}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, delta })
    });
    return response.json();
  }
};
