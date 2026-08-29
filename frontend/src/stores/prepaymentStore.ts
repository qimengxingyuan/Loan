import { create } from 'zustand';
import type { Loan, PrepaymentWithLoan } from '../types';
import { loanApi } from '../services/api';

interface PrepaymentState {
  prepayments: PrepaymentWithLoan[];
  loading: boolean;
  error: string | null;
  fetchPrepayments: (loans: Loan[]) => Promise<void>;
  createPrepayment: (loanId: string, data: Parameters<typeof loanApi.addPrepayment>[1]) => Promise<boolean>;
  updatePrepayment: (loanId: string, prepaymentId: string, data: Parameters<typeof loanApi.addPrepayment>[1]) => Promise<boolean>;
  deletePrepayment: (loanId: string, prepaymentId: string) => Promise<boolean>;
  clearError: () => void;
}

export const usePrepaymentStore = create<PrepaymentState>((set, get) => ({
  prepayments: [],
  loading: false,
  error: null,

  fetchPrepayments: async (_loans: Loan[]) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.getAllPrepayments();
      if (response.success && response.data) {
        set({ prepayments: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch prepayments' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  createPrepayment: async (loanId, data) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.addPrepayment(loanId, data);
      if (response.success) {
        // 重新获取所有提前还款记录
        const loanResponse = await loanApi.getAll();
        if (loanResponse.success && loanResponse.data) {
          await get().fetchPrepayments(loanResponse.data);
        }
        return true;
      } else {
        set({ error: response.error || 'Failed to add prepayment' });
        return false;
      }
    } catch (err) {
      set({ error: 'Network error' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updatePrepayment: async (loanId, prepaymentId, data) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.updatePrepayment(loanId, prepaymentId, data);
      if (response.success) {
        const loanResponse = await loanApi.getAll();
        if (loanResponse.success && loanResponse.data) {
          await get().fetchPrepayments(loanResponse.data);
        }
        return true;
      } else {
        set({ error: response.error || 'Failed to update prepayment' });
        return false;
      }
    } catch (err) {
      set({ error: 'Network error' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deletePrepayment: async (loanId, prepaymentId) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.deletePrepayment(loanId, prepaymentId);
      if (response.success) {
        const loanResponse = await loanApi.getAll();
        if (loanResponse.success && loanResponse.data) {
          await get().fetchPrepayments(loanResponse.data);
        }
        return true;
      } else {
        set({ error: response.error || 'Failed to delete prepayment' });
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
