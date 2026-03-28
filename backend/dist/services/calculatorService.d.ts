import { Loan, LoanWithRelations, PaymentScheduleItem } from '../../../shared/types.js';
export declare class CalculatorService {
    static generateSchedule(loan: LoanWithRelations): PaymentScheduleItem[];
    static calculateEqualInstallmentPayment(principal: number, monthlyRate: number, months: number): number;
    private static calculateRemainingMonths;
    private static getNextPaymentDate;
    static getRemainingPrincipalAtDate(schedule: PaymentScheduleItem[], targetDate: string): number;
    static calculateLoanStats(loan: Loan, schedule: PaymentScheduleItem[]): {
        paidPrincipal: number;
        paidInterest: number;
        remainingPrincipal: number;
        progress: number;
        nextPaymentDate: string | null;
        monthlyPayment: number;
    };
}
//# sourceMappingURL=calculatorService.d.ts.map