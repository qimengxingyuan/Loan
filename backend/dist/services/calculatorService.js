import { RepaymentMethod, PrepaymentType, } from '../../../shared/types.js';
export class CalculatorService {
    // 生成还款计划
    static generateSchedule(loan) {
        const schedule = [];
        let remainingPrincipal = loan.totalAmount;
        let currentRate = loan.initialRate;
        let currentPeriod = 1;
        // 排序利率变更和提前还款
        const rateChanges = [...loan.rateChanges].sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
        const prepayments = [...loan.prepayments].sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
        let rateChangeIndex = 0;
        let prepaymentIndex = 0;
        let currentPaymentDate = new Date(loan.firstPaymentDate);
        while (remainingPrincipal > 0.01 && currentPeriod <= loan.totalMonths * 2) {
            const dateStr = currentPaymentDate.toISOString().split('T')[0];
            // 检查利率变更
            while (rateChangeIndex < rateChanges.length &&
                rateChanges[rateChangeIndex].effectiveDate <= dateStr) {
                currentRate = rateChanges[rateChangeIndex].annualRate;
                rateChangeIndex++;
            }
            // 检查提前还款
            let prepaymentAmount = 0;
            let prepaymentType = null;
            while (prepaymentIndex < prepayments.length &&
                prepayments[prepaymentIndex].paymentDate === dateStr) {
                prepaymentAmount += prepayments[prepaymentIndex].amount;
                prepaymentType = prepayments[prepaymentIndex].type;
                prepaymentIndex++;
            }
            // 应用提前还款
            if (prepaymentAmount > 0) {
                remainingPrincipal -= prepaymentAmount;
                if (remainingPrincipal <= 0) {
                    remainingPrincipal = 0;
                    break;
                }
            }
            // 计算当月还款
            const monthlyRate = currentRate / 12;
            let monthlyPayment;
            let principal;
            let interest;
            if (loan.method === RepaymentMethod.EQUAL_INSTALLMENT) {
                // 等额本息
                const remainingMonths = this.calculateRemainingMonths(remainingPrincipal, monthlyRate, loan.totalMonths - currentPeriod + 1);
                if (remainingMonths <= 0) {
                    monthlyPayment = remainingPrincipal * (1 + monthlyRate);
                    interest = remainingPrincipal * monthlyRate;
                    principal = remainingPrincipal;
                }
                else {
                    monthlyPayment = this.calculateEqualInstallmentPayment(remainingPrincipal, monthlyRate, remainingMonths);
                    interest = remainingPrincipal * monthlyRate;
                    principal = monthlyPayment - interest;
                }
            }
            else {
                // 等额本金
                const remainingMonths = loan.totalMonths - currentPeriod + 1;
                principal = remainingPrincipal / remainingMonths;
                interest = remainingPrincipal * monthlyRate;
                monthlyPayment = principal + interest;
            }
            // 确保本金不超过剩余本金
            if (principal > remainingPrincipal) {
                principal = remainingPrincipal;
                monthlyPayment = principal + interest;
            }
            remainingPrincipal -= principal;
            // 检查是否已还（根据当前日期）
            const today = new Date().toISOString().split('T')[0];
            const isPaid = dateStr < today;
            schedule.push({
                period: currentPeriod,
                paymentDate: dateStr,
                monthlyPayment: Math.round(monthlyPayment * 100) / 100,
                principal: Math.round(principal * 100) / 100,
                interest: Math.round(interest * 100) / 100,
                remainingPrincipal: Math.round(Math.max(0, remainingPrincipal) * 100) / 100,
                isPaid,
            });
            // 处理提前还款后的重新计算（缩短期限）
            if (prepaymentAmount > 0 && prepaymentType === PrepaymentType.REDUCE_TERM) {
                // 缩短期限逻辑：保持月供不变，重新计算剩余期数
                // 这里简化处理，继续计算直到还清
            }
            currentPeriod++;
            // 计算下一个月还款日
            currentPaymentDate = this.getNextPaymentDate(currentPaymentDate, loan.paymentDay);
        }
        return schedule;
    }
    // 计算等额本息月供
    static calculateEqualInstallmentPayment(principal, monthlyRate, months) {
        if (monthlyRate === 0) {
            return principal / months;
        }
        return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
    }
    // 计算剩余期数
    static calculateRemainingMonths(principal, monthlyRate, maxMonths) {
        if (monthlyRate === 0) {
            return maxMonths;
        }
        // 简化计算，返回剩余期数
        return maxMonths;
    }
    // 获取下一个月还款日
    static getNextPaymentDate(currentDate, paymentDay) {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        // 处理月末日期问题
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(paymentDay, lastDayOfMonth));
        return nextDate;
    }
    // 获取指定日期的剩余本金
    static getRemainingPrincipalAtDate(schedule, targetDate) {
        for (const item of schedule) {
            if (item.paymentDate > targetDate) {
                return item.remainingPrincipal + item.principal;
            }
        }
        return 0;
    }
    // 计算贷款统计信息
    static calculateLoanStats(loan, schedule) {
        const today = new Date().toISOString().split('T')[0];
        let paidPrincipal = 0;
        let paidInterest = 0;
        let remainingPrincipal = loan.totalAmount;
        let nextPaymentDate = null;
        let monthlyPayment = 0;
        for (const item of schedule) {
            if (item.paymentDate < today) {
                paidPrincipal += item.principal;
                paidInterest += item.interest;
            }
            else {
                if (!nextPaymentDate) {
                    nextPaymentDate = item.paymentDate;
                    monthlyPayment = item.monthlyPayment;
                }
            }
        }
        remainingPrincipal = Math.max(0, loan.totalAmount - paidPrincipal);
        const progress = loan.totalAmount > 0 ? (paidPrincipal / loan.totalAmount) * 100 : 0;
        return {
            paidPrincipal: Math.round(paidPrincipal * 100) / 100,
            paidInterest: Math.round(paidInterest * 100) / 100,
            remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
            progress: Math.round(progress * 100) / 100,
            nextPaymentDate,
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        };
    }
}
//# sourceMappingURL=calculatorService.js.map