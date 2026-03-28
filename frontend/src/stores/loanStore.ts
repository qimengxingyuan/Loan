import { create } from 'zustand';
import type { Loan, LoanWithRelations, PaymentScheduleItem } from '../types';
import { loanApi } from '../services/api';

interface LoanState {
  loans: Loan[];
  currentLoan: LoanWithRelations | null;
  schedule: PaymentScheduleItem[];
  loading: boolean;
  error: string | null;
  fetchLoans: () => Promise<void>;
  fetchLoanById: (id: string) => Promise<void>;
  fetchSchedule: (id: string) => Promise<PaymentScheduleItem[] | null>;
  createLoan: (data: Parameters<typeof loanApi.create>[0]) => Promise<void>;
  updateLoan: (id: string, data: Parameters<typeof loanApi.update>[1]) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  addRateChange: (id: string, data: Parameters<typeof loanApi.addRateChange>[1]) => Promise<void>;
  deleteRateChange: (loanId: string, rateChangeId: string) => Promise<void>;
  addPrepayment: (id: string, data: Parameters<typeof loanApi.addPrepayment>[1]) => Promise<void>;
  clearError: () => void;
}

export const useLoanStore = create<LoanState>((set, get) => ({
  loans: [],
  currentLoan: null,
  schedule: [],
  loading: false,
  error: null,

  fetchLoans: async () => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.getAll();
      if (response.success && response.data) {
        set({ loans: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch loans' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  fetchLoanById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.getById(id);
      if (response.success && response.data) {
        set({ currentLoan: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch loan' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  fetchSchedule: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.getSchedule(id);
      if (response.success && response.data) {
        set({ schedule: response.data });
        return response.data;
      } else {
        set({ error: response.error || 'Failed to fetch schedule' });
        return null;
      }
    } catch (err) {
      set({ error: 'Network error' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  createLoan: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.create(data);
      if (response.success && response.data) {
        await get().fetchLoans();
      } else {
        const errorMsg = response.error || 'Failed to create loan';
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateLoan: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.update(id, data);
      if (response.success && response.data) {
        await get().fetchLoans();
        if (get().currentLoan?.id === id) {
          await get().fetchLoanById(id);
        }
      } else {
        const errorMsg = response.error || 'Failed to update loan';
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteLoan: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.delete(id);
      if (response.success) {
        await get().fetchLoans();
        if (get().currentLoan?.id === id) {
          set({ currentLoan: null });
        }
      } else {
        set({ error: response.error || 'Failed to delete loan' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  addRateChange: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.addRateChange(id, data);
      if (response.success) {
        await get().fetchLoanById(id);
      } else {
        set({ error: response.error || 'Failed to add rate change' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  deleteRateChange: async (loanId: string, rateChangeId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.deleteRateChange(loanId, rateChangeId);
      if (response.success) {
        await get().fetchLoanById(loanId);
      } else {
        set({ error: response.error || 'Failed to delete rate change' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  addPrepayment: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await loanApi.addPrepayment(id, data);
      if (response.success) {
        await get().fetchLoanById(id);
      } else {
        set({ error: response.error || 'Failed to add prepayment' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
