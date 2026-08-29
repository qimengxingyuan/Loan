import { create } from 'zustand';
import type { FixedDebt } from '../types';
import { fixedDebtApi } from '../services/api';

interface FixedDebtState {
  fixedDebts: FixedDebt[];
  loading: boolean;
  error: string | null;
  fetchFixedDebts: () => Promise<void>;
  createFixedDebt: (data: Parameters<typeof fixedDebtApi.create>[0]) => Promise<boolean>;
  updateFixedDebt: (id: string, data: Parameters<typeof fixedDebtApi.update>[1]) => Promise<boolean>;
  deleteFixedDebt: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useFixedDebtStore = create<FixedDebtState>((set, get) => ({
  fixedDebts: [],
  loading: false,
  error: null,

  fetchFixedDebts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fixedDebtApi.getAll();
      if (response.success && response.data) {
        set({ fixedDebts: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch fixed debts' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  createFixedDebt: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await fixedDebtApi.create(data);
      if (response.success && response.data) {
        await get().fetchFixedDebts();
        return true;
      } else {
        set({ error: response.error || 'Failed to create fixed debt' });
        return false;
      }
    } catch (err) {
      set({ error: 'Network error' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateFixedDebt: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await fixedDebtApi.update(id, data);
      if (response.success && response.data) {
        await get().fetchFixedDebts();
        return true;
      } else {
        set({ error: response.error || 'Failed to update fixed debt' });
        return false;
      }
    } catch (err) {
      set({ error: 'Network error' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteFixedDebt: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fixedDebtApi.delete(id);
      if (response.success) {
        await get().fetchFixedDebts();
        return true;
      } else {
        set({ error: response.error || 'Failed to delete fixed debt' });
        return false;
      }
    } catch (err) {
      set({ error: 'Network error' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
