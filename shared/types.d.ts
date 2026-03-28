export declare enum RepaymentMethod {
    EQUAL_INSTALLMENT = "equal_installment",
    EQUAL_PRINCIPAL = "equal_principal"
}
export declare enum PrepaymentType {
    REDUCE_TERM = "reduce_term",
    REDUCE_PAYMENT = "reduce_payment"
}
export interface RateChange {
    id: string;
    loanId: string;
    effectiveDate: string;
    annualRate: number;
    createdAt: string;
}
export interface Prepayment {
    id: string;
    loanId: string;
    paymentDate: string;
    amount: number;
    type: PrepaymentType;
    createdAt: string;
}
export interface Loan {
    id: string;
    name: string;
    totalAmount: number;
    totalMonths: number;
    method: RepaymentMethod;
    firstPaymentDate: string;
    paymentDay: number;
    initialRate: number;
    createdAt: string;
    updatedAt: string;
}
export interface LoanWithRelations extends Loan {
    rateChanges: RateChange[];
    prepayments: Prepayment[];
}
export interface PaymentScheduleItem {
    period: number;
    paymentDate: string;
    monthlyPayment: number;
    principal: number;
    interest: number;
    remainingPrincipal: number;
    isPaid: boolean;
}
export interface FixedDebt {
    id: string;
    name: string;
    amount: number;
    description?: string;
    debtDate: string;
    createdAt: string;
    updatedAt: string;
}
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
export interface LoanSummary {
    id: string;
    name: string;
    remainingPrincipal: number;
    progress: number;
    monthlyPayment: number;
    nextPaymentDate: string | null;
    method: RepaymentMethod;
}
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
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface CreateLoanRequest {
    name: string;
    totalAmount: number;
    totalMonths: number;
    method: RepaymentMethod;
    firstPaymentDate: string;
    paymentDay: number;
    initialRate: number;
}
export interface UpdateLoanRequest {
    name?: string;
    totalAmount?: number;
    totalMonths?: number;
    method?: RepaymentMethod;
    firstPaymentDate?: string;
    paymentDay?: number;
    initialRate?: number;
}
export interface CreateFixedDebtRequest {
    name: string;
    amount: number;
    description?: string;
    debtDate: string;
}
export interface AddRateChangeRequest {
    effectiveDate: string;
    annualRate: number;
}
export interface AddPrepaymentRequest {
    paymentDate: string;
    amount: number;
    type: PrepaymentType;
}
//# sourceMappingURL=types.d.ts.map