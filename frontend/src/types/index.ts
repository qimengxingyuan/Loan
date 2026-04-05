// 还款方式
export const RepaymentMethod = {
  EQUAL_INSTALLMENT: 'equal_installment',
  EQUAL_PRINCIPAL: 'equal_principal',
  EQUAL_PRINCIPAL_INTEREST: 'equal_principal_interest',
  FREE_REPAYMENT: 'free_repayment'
} as const;
export type RepaymentMethod = typeof RepaymentMethod[keyof typeof RepaymentMethod];

// 提前还款类型
export const PrepaymentType = {
  REDUCE_TERM: 'reduce_term',
  REDUCE_PAYMENT: 'reduce_payment'
} as const;
export type PrepaymentType = typeof PrepaymentType[keyof typeof PrepaymentType];

// 利率变更记录
export interface RateChange {
  id: string;
  loanId: string;
  effectiveDate: string;
  annualRate: number;
  createdAt: string;
}

// 提前还款记录
export interface Prepayment {
  id: string;
  loanId: string;
  paymentDate: string;
  amount: number;
  type: PrepaymentType;
  createdAt: string;
}

// 贷款实体
export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  totalMonths: number;
  method: RepaymentMethod;
  loanDate: string;
  paymentDay: number;
  initialRate: number;
  minimumPayment?: number; // 自由还款模式的最低还款额
  icon?: string; // 贷款图标 (Base64/SVG)
  createdAt: string;
  updatedAt: string;
}

// 贷款完整信息（含关联数据）
export interface LoanWithRelations extends Loan {
  rateChanges: RateChange[];
  prepayments: Prepayment[];
}

// 还款计划项
export interface PaymentScheduleItem {
  period: number;
  paymentDate: string;
  monthlyPayment: number;
  principal: number;
  interest: number;
  remainingPrincipal: number;
  isPaid: boolean;
  prepayment?: number; // 当期提前还款金额
  prepaymentType?: PrepaymentType; // 提前还款类型
  annualRate?: number; // 当期适用的年化利率
}

// 固定债务
export interface FixedDebt {
  id: string;
  name: string;
  amount: number;
  description?: string;
  debtDate: string;
  createdAt: string;
  updatedAt: string;
}

// 大盘总览数据
export interface DashboardData {
  totalRemainingPrincipal: number;
  totalFixedDebt: number;
  totalDebt: number;
  totalPaidPrincipal: number;
  totalPaidInterest: number;
  overallProgress: number;
  loans: LoanSummary[];
  fixedDebts: FixedDebt[];
}

// 贷款摘要
export interface LoanSummary {
  id: string;
  name: string;
  remainingPrincipal: number;
  progress: number;
  monthlyPayment: number;
  nextPaymentDate: string | null;
  method: RepaymentMethod;
  icon?: string;
}

// 预估查询结果
export interface ForecastResult {
  date: string;
  totalRemainingPrincipal: number;
  totalFixedDebt: number;
  totalDebt: number;
  loans: {
    loanId: string;
    loanName: string;
    remainingPrincipal: number;
    remainingPeriods: number;
    payoffDate: string;
  }[];
  fixedDebts: FixedDebt[];
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 创建贷款请求
export interface CreateLoanRequest {
  name: string;
  totalAmount: number;
  totalMonths: number;
  method: RepaymentMethod;
  loanDate: string;
  paymentDay: number;
  initialRate: number;
  minimumPayment?: number; // 自由还款模式的最低还款额
  icon?: string;
}

// 更新贷款请求
export interface UpdateLoanRequest {
  name?: string;
  totalAmount?: number;
  totalMonths?: number;
  method?: RepaymentMethod;
  loanDate?: string;
  paymentDay?: number;
  initialRate?: number;
  minimumPayment?: number;
  icon?: string;
}

// 创建固定债务请求
export interface CreateFixedDebtRequest {
  name: string;
  amount: number;
  description?: string;
  debtDate: string;
}

// 添加利率变更请求
export interface AddRateChangeRequest {
  effectiveDate: string;
  annualRate: number;
}

// 添加提前还款请求
export interface AddPrepaymentRequest {
  paymentDate: string;
  amount: number;
  type: PrepaymentType;
}
