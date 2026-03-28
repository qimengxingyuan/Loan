import { Router } from 'express';
import { LoanService } from '../services/loanService.js';
import { FixedDebtService } from '../services/fixedDebtService.js';
import { CalculatorService } from '../services/calculatorService.js';
const router = Router();
// 获取预估数据
router.get('/', (req, res) => {
    try {
        const { date } = req.query;
        if (!date || typeof date !== 'string') {
            return res.status(400).json({ success: false, error: 'Date parameter is required' });
        }
        const targetDate = date;
        const loans = LoanService.getAllLoans();
        const fixedDebts = FixedDebtService.getAllFixedDebts();
        let totalRemainingPrincipal = 0;
        const loanForecasts = [];
        for (const loan of loans) {
            const loanWithRelations = LoanService.getLoanById(loan.id);
            if (!loanWithRelations)
                continue;
            const schedule = CalculatorService.generateSchedule(loanWithRelations);
            const remainingPrincipal = CalculatorService.getRemainingPrincipalAtDate(schedule, targetDate);
            // 计算剩余期数和结清日期
            let remainingPeriods = 0;
            let payoffDate = targetDate;
            for (const item of schedule) {
                if (item.paymentDate > targetDate && item.remainingPrincipal > 0) {
                    remainingPeriods++;
                    payoffDate = item.paymentDate;
                }
            }
            totalRemainingPrincipal += remainingPrincipal;
            loanForecasts.push({
                loanId: loan.id,
                loanName: loan.name,
                remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
                remainingPeriods,
                payoffDate,
            });
        }
        const totalFixedDebt = fixedDebts.reduce((sum, debt) => sum + debt.amount, 0);
        const totalDebt = totalRemainingPrincipal + totalFixedDebt;
        const forecastResult = {
            date: targetDate,
            totalRemainingPrincipal: Math.round(totalRemainingPrincipal * 100) / 100,
            totalFixedDebt: Math.round(totalFixedDebt * 100) / 100,
            totalDebt: Math.round(totalDebt * 100) / 100,
            loans: loanForecasts,
            fixedDebts,
        };
        res.json({ success: true, data: forecastResult });
    }
    catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate forecast' });
    }
});
export default router;
//# sourceMappingURL=forecast.js.map