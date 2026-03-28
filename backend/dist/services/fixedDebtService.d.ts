import { FixedDebt, CreateFixedDebtRequest } from '../../../shared/types.js';
export declare class FixedDebtService {
    static getAllFixedDebts(): FixedDebt[];
    static getFixedDebtById(id: string): FixedDebt | null;
    static createFixedDebt(request: CreateFixedDebtRequest): FixedDebt;
    static updateFixedDebt(id: string, request: Partial<CreateFixedDebtRequest>): FixedDebt | null;
    static deleteFixedDebt(id: string): boolean;
    static getTotalFixedDebt(): number;
    private static mapRowToFixedDebt;
}
//# sourceMappingURL=fixedDebtService.d.ts.map