import { Router } from 'express';
import { LoanService } from '../services/loanService.js';
import { FixedDebtService } from '../services/fixedDebtService.js';
import { CalculatorService } from '../services/calculatorService.js';
const router = Router();
// 获取大盘数据
router.get('/', (req, res) => {
    try {
        const loans = LoanService.getAllLoans();
        const fixedDebts = FixedDebtService.getAllFixedDebts();
        let totalRemainingPrincipal = 0;
        let totalPaidPrincipal = 0;
        let totalPaidInterest = 0;
        const loanSummaries = [];
        for (const loan of loans) {
            const loanWithRelations = LoanService.getLoanById(loan.id);
            if (!loanWithRelations)
                continue;
            const schedule = CalculatorService.generateSchedule(loanWithRelations);
            const stats = CalculatorService.calculateLoanStats(loan, schedule);
            totalRemainingPrincipal += stats.remainingPrincipal;
            totalPaidPrincipal += stats.paidPrincipal;
            totalPaidInterest += stats.paidInterest;
            loanSummaries.push({
                id: loan.id,
                name: loan.name,
                remainingPrincipal: stats.remainingPrincipal,
                progress: stats.progress,
                monthlyPayment: stats.monthlyPayment,
                nextPaymentDate: stats.nextPaymentDate,
                method: loan.method,
            });
        }
        const totalFixedDebt = fixedDebts.reduce((sum, debt) => sum + debt.amount, 0);
        const totalDebt = totalRemainingPrincipal + totalFixedDebt;
        const totalPaid = totalPaidPrincipal + totalPaidInterest;
        const overallProgress = totalPaid > 0
            ? (totalPaidPrincipal / (totalPaidPrincipal + totalRemainingPrincipal)) * 100
            : 0;
        const dashboardData = {
            totalRemainingPrincipal: Math.round(totalRemainingPrincipal * 100) / 100,
            totalFixedDebt: Math.round(totalFixedDebt * 100) / 100,
            totalDebt: Math.round(totalDebt * 100) / 100,
            totalPaidPrincipal: Math.round(totalPaidPrincipal * 100) / 100,
            totalPaidInterest: Math.round(totalPaidInterest * 100) / 100,
            overallProgress: Math.round(overallProgress * 100) / 100,
            loans: loanSummaries,
            fixedDebts,
        };
        res.json({ success: true, data: dashboardData });
    }
    catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
    }
});
export default router;
//# sourceMappingURL=dashboard.js.map