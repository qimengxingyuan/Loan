import { create } from 'zustand';
import type { Prepayment, Loan } from '../types';
import { loanApi } from '../services/api';

interface PrepaymentWithLoan extends Prepayment {
  loanName: string;
}

interface PrepaymentState {
  prepayments: PrepaymentWithLoan[];
  loading: boolean;
  error: string | null;
  fetchPrepayments: (loans: Loan[]) => Promise<void>;
  createPrepayment: (loanId: string, data: Parameters<typeof loanApi.addPrepayment>[1]) => Promise<void>;
  updatePrepayment: (loanId: string, prepaymentId: string, data: Parameters<typeof loanApi.addPrepayment>[1]) => Promise<void>;
  deletePrepayment: (loanId: string, prepaymentId: string) => Promise<void>;
  clearError: () => void;
}

export const usePrepaymentStore = create<PrepaymentState>((set, get) => ({
  prepayments: [],
  loading: false,
  error: null,

  fetchPrepayments: async (loans: Loan[]) => {
    set({ loading: true, error: null });
    try {
      const allPrepayments: PrepaymentWithLoan[] = [];
      
      for (const loan of loans) {
        const response = await loanApi.getById(loan.id);
        if (response.success && response.data && response.data.prepayments) {
          for (const prepayment of response.data.prepayments) {
            allPrepayments.push({
              ...prepayment,
              loanName: loan.name,
            });
          }
        }
      }
      
      // 按还款日期排序
      allPrepayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      
      set({ prepayments: allPrepayments });
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
      } else {
        set({ error: response.error || 'Failed to add prepayment' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  updatePrepayment: async (loanId, prepaymentId, data) => {
    set({ loading: true, error: null });
    try {
      // 先删除旧记录
      const deleteResponse = await loanApi.deletePrepayment(loanId, prepaymentId);
      if (!deleteResponse.success) {
        set({ error: deleteResponse.error || 'Failed to update prepayment' });
        return;
      }
      
      // 再创建新记录
      const createResponse = await loanApi.addPrepayment(loanId, data);
      if (createResponse.success) {
        const loanResponse = await loanApi.getAll();
        if (loanResponse.success && loanResponse.data) {
          await get().fetchPrepayments(loanResponse.data);
        }
      } else {
        set({ error: createResponse.error || 'Failed to update prepayment' });
      }
    } catch (err) {
      set({ error: 'Network error' });
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
      } else {
        set({ error: response.error || 'Failed to delete prepayment' });
      }
    } catch (err) {
      set({ error: 'Network error' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
