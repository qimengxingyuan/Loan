import { create } from 'zustand';
import type { DashboardData, ForecastResult } from '../types';
import { dashboardApi, forecastApi } from '../services/api';

interface DashboardState {
  dashboardData: DashboardData | null;
  forecastData: ForecastResult | null;
  loading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  fetchForecast: (date: string) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: null,
  forecastData: null,
  loading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await dashboardApi.getData();
      if (response.success && response.data) {
        set({ dashboardData: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch dashboard data' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  fetchForecast: async (date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await forecastApi.getForecast(date);
      if (response.success && response.data) {
        set({ forecastData: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch forecast' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
