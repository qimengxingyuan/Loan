import axios from 'axios';
import type {
  Loan,
  LoanWithRelations,
  FixedDebt,
  PaymentScheduleItem,
  DashboardData,
  ForecastResult,
  CreateLoanRequest,
  UpdateLoanRequest,
  CreateFixedDebtRequest,
  AddRateChangeRequest,
  AddPrepaymentRequest,
  RateChange,
  Prepayment,
  ApiResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api', // 使用代理
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 贷款 API
export const loanApi = {
  getAll: () => api.get<ApiResponse<Loan[]>>('/loans').then(res => res.data),
  getById: (id: string) => api.get<ApiResponse<LoanWithRelations>>(`/loans/${id}`).then(res => res.data),
  create: (data: CreateLoanRequest) => api.post<ApiResponse<Loan>>('/loans', data).then(res => res.data),
  update: (id: string, data: UpdateLoanRequest) => api.put<ApiResponse<Loan>>(`/loans/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/loans/${id}`).then(res => res.data),
  getSchedule: (id: string) => api.get<ApiResponse<PaymentScheduleItem[]>>(`/loans/${id}/schedule`).then(res => res.data),
  addRateChange: (id: string, data: AddRateChangeRequest) => api.post<ApiResponse<RateChange>>(`/loans/${id}/rate-changes`, data).then(res => res.data),
  deleteRateChange: (loanId: string, rateChangeId: string) => api.delete<ApiResponse<null>>(`/loans/${loanId}/rate-changes/${rateChangeId}`).then(res => res.data),
  addPrepayment: (id: string, data: AddPrepaymentRequest) => api.post<ApiResponse<Prepayment>>(`/loans/${id}/prepayments`, data).then(res => res.data),
  deletePrepayment: (loanId: string, prepaymentId: string) => api.delete<ApiResponse<null>>(`/loans/${loanId}/prepayments/${prepaymentId}`).then(res => res.data),
};

// 固定债务 API
export const fixedDebtApi = {
  getAll: () => api.get<ApiResponse<FixedDebt[]>>('/fixed-debts').then(res => res.data),
  getById: (id: string) => api.get<ApiResponse<FixedDebt>>(`/fixed-debts/${id}`).then(res => res.data),
  create: (data: CreateFixedDebtRequest) => api.post<ApiResponse<FixedDebt>>('/fixed-debts', data).then(res => res.data),
  update: (id: string, data: Partial<CreateFixedDebtRequest>) => api.put<ApiResponse<FixedDebt>>(`/fixed-debts/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/fixed-debts/${id}`).then(res => res.data),
};

// 大盘 API
export const dashboardApi = {
  getData: () => api.get<ApiResponse<DashboardData>>('/dashboard').then(res => res.data),
};

// 预估 API
export const forecastApi = {
  getForecast: (date: string) => api.get<ApiResponse<ForecastResult>>('/forecast', { params: { date } }).then(res => res.data),
};

export default api;
