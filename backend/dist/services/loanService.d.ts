import { Loan, LoanWithRelations, RateChange, Prepayment, CreateLoanRequest, UpdateLoanRequest, AddRateChangeRequest, AddPrepaymentRequest } from '../../../shared/types.js';
export declare class LoanService {
    static getAllLoans(): Loan[];
    static getLoanById(id: string): LoanWithRelations | null;
    static createLoan(request: CreateLoanRequest): Loan;
    static updateLoan(id: string, request: UpdateLoanRequest): Loan | null;
    static deleteLoan(id: string): boolean;
    static addRateChange(loanId: string, request: AddRateChangeRequest): RateChange;
    static deleteRateChange(id: string): boolean;
    static addPrepayment(loanId: string, request: AddPrepaymentRequest): Prepayment;
    static deletePrepayment(id: string): boolean;
    private static mapRowToLoan;
    private static mapRowToRateChange;
    private static mapRowToPrepayment;
}
//# sourceMappingURL=loanService.d.ts.map