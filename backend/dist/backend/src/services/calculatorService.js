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
        // 计算首次还款日期
        const loanDateObj = new Date(loan.loanDate);
        let firstPaymentDate = new Date(loanDateObj);
        firstPaymentDate.setDate(loan.paymentDay);
        // 如果设置的还款日在放贷日之前，或者就是当天，推到下个月
        if (firstPaymentDate <= loanDateObj) {
            firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
        }
        let currentPaymentDate = firstPaymentDate;
        // 用于计算利息的上一期计息日期
        let lastInterestDate = loanDateObj;
        // 记录原始总期数
        const originalTotalMonths = loan.totalMonths;
        // 记录是否已经处理过提前还款（用于缩短期限时保持月供不变）
        let hasPrepayment = false;
        let lastMonthlyPayment = 0;
        // 记录是否处于缩短期限模式（一旦设置，后续月份保持月供不变）
        let isReduceTermMode = false;
        // 记录是否处于等额本金减少月供模式
        let isReducePaymentMode = false;
        // 记录等额本金的固定月供本金
        const equalPrincipalMonthlyPrincipal = loan.totalAmount / loan.totalMonths;
        // 记录等本等息的固定月供本金和利息
        const equalPrincipalInterestMonthlyPrincipal = loan.totalAmount / loan.totalMonths;
        const equalPrincipalInterestMonthlyInterest = loan.totalAmount * (loan.initialRate / 12);
        // 记录自由还款的最低还款额
        const freeRepaymentMinimumPayment = loan.method === 'free_repayment'
            ? (loan.minimumPayment || this.calculateEqualInstallmentPayment(loan.totalAmount, loan.initialRate / 12, loan.totalMonths * 2))
            : 0;
        // 提前还款期数计数器（用于生成唯一的负数期数）
        let prepaymentPeriodCounter = 0;
        // 计算贷款结束日期（用于利率区间计算）
        const loanEndDate = new Date(loanDateObj);
        loanEndDate.setMonth(loanEndDate.getMonth() + loan.totalMonths);
        while (remainingPrincipal > 0.01 && currentPeriod <= originalTotalMonths * 2) {
            const dateStr = currentPaymentDate.toISOString().split('T')[0];
            // 检查利率变更 - 获取当前适用的利率
            while (rateChangeIndex < rateChanges.length &&
                rateChanges[rateChangeIndex].effectiveDate <= dateStr) {
                currentRate = rateChanges[rateChangeIndex].annualRate;
                rateChangeIndex++;
            }
            // 检查提前还款 - 匹配当期内的提前还款
            let prepaymentAmount = 0;
            let prepaymentType = null;
            let prepaymentDate = null;
            while (prepaymentIndex < prepayments.length) {
                const pDate = prepayments[prepaymentIndex].paymentDate;
                // 提前还款日期应该小于等于当前还款日期，且大于上一期还款日期
                const prevPaymentDate = currentPeriod === 1 ? loan.loanDate : schedule[schedule.length - 1]?.paymentDate;
                if (pDate <= dateStr && (!prevPaymentDate || pDate > prevPaymentDate)) {
                    prepaymentAmount += prepayments[prepaymentIndex].amount;
                    prepaymentType = prepayments[prepaymentIndex].type;
                    prepaymentDate = pDate;
                    prepaymentIndex++;
                }
                else {
                    break;
                }
            }
            const monthlyRate = currentRate / 12;
            // 如果有提前还款且提前还款日不等于正常还款日，需要单独处理
            if (prepaymentAmount > 0 && prepaymentDate && prepaymentDate !== dateStr) {
                // 银行算法：提前还款当天扣款 = 提前还款本金 + 该本金从上一还款日到提前还款日的利息
                const prepaymentDateObj = new Date(prepaymentDate);
                const daysSinceLastPayment = Math.max(0, Math.round((prepaymentDateObj.getTime() - lastInterestDate.getTime()) / (1000 * 60 * 60 * 24)));
                const daysInMonth = new Date(lastInterestDate.getFullYear(), lastInterestDate.getMonth() + 1, 0).getDate();
                // 计算提前还款当天适用的利率（可能和当前还款日不同）
                let prepaymentRate = loan.initialRate;
                for (const rc of rateChanges) {
                    if (rc.effectiveDate <= prepaymentDate) {
                        prepaymentRate = rc.annualRate;
                    }
                    else {
                        break;
                    }
                }
                const prepaymentMonthlyRate = prepaymentRate / 12;
                // 提前还款本金在提前还款日之前产生的利息
                const prepaymentInterest = prepaymentAmount * prepaymentMonthlyRate * (daysSinceLastPayment / daysInMonth);
                // 添加提前还款记录（提前还款不占用期数编号，使用递减的负数确保唯一性）
                prepaymentPeriodCounter--;
                const today = new Date().toISOString().split('T')[0];
                schedule.push({
                    period: prepaymentPeriodCounter, // 提前还款使用负数，不占用正常期数
                    paymentDate: prepaymentDate,
                    monthlyPayment: Number((prepaymentAmount + prepaymentInterest).toFixed(2)),
                    principal: Number(prepaymentAmount.toFixed(2)),
                    interest: Number(prepaymentInterest.toFixed(2)),
                    remainingPrincipal: Number((remainingPrincipal - prepaymentAmount).toFixed(2)),
                    isPaid: prepaymentDate < today,
                    prepayment: Number(prepaymentAmount.toFixed(2)),
                    prepaymentType: prepaymentType || 'reduce_term',
                    annualRate: Number(prepaymentRate.toFixed(4)),
                });
                // 扣除提前还款本金
                remainingPrincipal -= prepaymentAmount;
                hasPrepayment = true;
                // 设置提前还款模式标志
                if (prepaymentType === 'reduce_term') {
                    isReduceTermMode = true;
                }
                else {
                    isReducePaymentMode = true;
                }
                // 继续处理正常还款（如果提前还款日和正常还款日不同）
                if (remainingPrincipal > 0.01) {
                    // 注意：这里不需要增加 currentPeriod，因为循环末尾会增加
                    // 提前还款本身不占用期数，所以7月1日的还款应该使用当前的 currentPeriod
                    let monthlyPayment;
                    let principal;
                    let interest;
                    if (loan.method === 'equal_installment') {
                        const remainingMonths = originalTotalMonths - currentPeriod + 1;
                        if (prepaymentType === 'reduce_term') {
                            // 缩短期限：保持月供不变
                            if (lastMonthlyPayment > 0) {
                                monthlyPayment = lastMonthlyPayment;
                            }
                            else {
                                // 第一次提前还款，还没有lastMonthlyPayment，需要计算
                                monthlyPayment = this.calculateEqualInstallmentPayment(remainingPrincipal, monthlyRate, remainingMonths);
                            }
                            isReduceTermMode = true;
                        }
                        else if (isReduceTermMode && lastMonthlyPayment > 0) {
                            // 已经处于缩短期限模式，保持月供不变
                            monthlyPayment = lastMonthlyPayment;
                        }
                        else {
                            // 正常计算或减少月供：重新计算月供
                            monthlyPayment = this.calculateEqualInstallmentPayment(remainingPrincipal, monthlyRate, remainingMonths);
                        }
                        lastMonthlyPayment = monthlyPayment;
                        // 7月1日计算的是整个6月份的利息，基于新的本金（已扣除提前还款）
                        // 计息周期仍然是从上个月的还款日到当前还款日
                        interest = this.calculateSegmentedInterest(lastInterestDate, currentPaymentDate, remainingPrincipal, rateChanges, loan.initialRate, loanEndDate);
                        principal = monthlyPayment - interest;
                        if (principal > remainingPrincipal) {
                            principal = remainingPrincipal;
                            monthlyPayment = principal + interest;
                        }
                    }
                    else if (loan.method === 'equal_principal') {
                        // 等额本金
                        const remainingMonths = originalTotalMonths - currentPeriod + 1;
                        if (prepaymentType === 'reduce_term' || (!prepaymentType && !isReducePaymentMode)) {
                            // 缩短期限：保持每月本金不变，会提前结清贷款
                            principal = equalPrincipalMonthlyPrincipal;
                        }
                        else {
                            // 减少月供：重新计算每月本金
                            principal = remainingPrincipal / remainingMonths;
                        }
                        // 7月1日计算的是整个6月份的利息，基于新的本金（已扣除提前还款）
                        // 计息周期仍然是从上个月的还款日到当前还款日
                        interest = this.calculateSegmentedInterest(lastInterestDate, currentPaymentDate, remainingPrincipal, rateChanges, loan.initialRate, loanEndDate);
                        monthlyPayment = principal + interest;
                    }
                    else if (loan.method === 'equal_principal_interest') {
                        // 等本等息
                        const remainingMonths = originalTotalMonths - currentPeriod + 1;
                        // 等本等息：每月本金和利息都固定（基于原始贷款金额）
                        principal = equalPrincipalInterestMonthlyPrincipal;
                        interest = equalPrincipalInterestMonthlyInterest;
                        // 最后一期可能需要调整
                        if (principal > remainingPrincipal) {
                            principal = remainingPrincipal;
                        }
                        monthlyPayment = principal + interest;
                    }
                    else {
                        // 自由还款（北京公积金模式）
                        // 计算当期利息（分段计算，支持利率变更，使用自由还款特殊规则）
                        interest = this.calculateFreeRepaymentSegmentedInterest(lastInterestDate, currentPaymentDate, remainingPrincipal, rateChanges, loan.initialRate, loanEndDate);
                        // 自由还款：使用最低还款额，但优先还利息
                        const minimumPrincipal = Math.max(0, freeRepaymentMinimumPayment - interest);
                        principal = minimumPrincipal;
                        // 确保不超过剩余本金
                        if (principal > remainingPrincipal) {
                            principal = remainingPrincipal;
                        }
                        monthlyPayment = principal + interest;
                    }
                    remainingPrincipal -= principal;
                    const today = new Date().toISOString().split('T')[0];
                    schedule.push({
                        period: currentPeriod,
                        paymentDate: dateStr,
                        monthlyPayment: Number(monthlyPayment.toFixed(2)),
                        principal: Number(principal.toFixed(2)),
                        interest: Number(interest.toFixed(2)),
                        remainingPrincipal: Number(Math.max(0, remainingPrincipal).toFixed(2)),
                        isPaid: dateStr < today,
                        annualRate: Number(currentRate.toFixed(4)),
                    });
                }
            }
            else {
                // 正常还款计算（没有提前还款或提前还款日与正常还款日相同）
                let monthlyPayment;
                let principal;
                let interest;
                if (prepaymentAmount > 0) {
                    remainingPrincipal -= prepaymentAmount;
                    hasPrepayment = true;
                }
                if (loan.method === 'equal_installment') {
                    const remainingMonths = originalTotalMonths - currentPeriod + 1;
                    if (remainingPrincipal <= 0) {
                        monthlyPayment = prepaymentAmount || 0;
                        interest = 0;
                        principal = prepaymentAmount || 0;
                    }
                    else {
                        if (prepaymentAmount > 0 && prepaymentType === 'reduce_term') {
                            // 提前还款且缩短期限
                            if (lastMonthlyPayment > 0) {
                                monthlyPayment = lastMonthlyPayment;
                            }
                            else {
                                monthlyPayment = this.calculateEqualInstallmentPayment(remainingPrincipal, monthlyRate, remainingMonths);
                            }
                            isReduceTermMode = true;
                        }
                        else if (isReduceTermMode && lastMonthlyPayment > 0) {
                            // 已经处于缩短期限模式，保持月供不变
                            monthlyPayment = lastMonthlyPayment;
                        }
                        else {
                            monthlyPayment = this.calculateEqualInstallmentPayment(remainingPrincipal, monthlyRate, remainingMonths);
                        }
                        lastMonthlyPayment = monthlyPayment;
                        // 使用分段利息计算，支持当月跨越多个利率区间
                        interest = this.calculateSegmentedInterest(lastInterestDate, currentPaymentDate, remainingPrincipal, rateChanges, loan.initialRate, loanEndDate);
                        principal = monthlyPayment - interest;
                        if (principal > remainingPrincipal) {
                            principal = remainingPrincipal;
                            monthlyPayment = principal + interest;
                        }
                    }
                }
                else if (loan.method === 'equal_principal') {
                    if (remainingPrincipal <= 0) {
                        monthlyPayment = prepaymentAmount || 0;
                        interest = 0;
                        principal = prepaymentAmount || 0;
                    }
                    else {
                        const remainingMonths = originalTotalMonths - currentPeriod + 1;
                        if (isReducePaymentMode) {
                            // 减少月供模式：重新计算每月本金
                            principal = Math.min(remainingPrincipal / remainingMonths, remainingPrincipal);
                        }
                        else {
                            // 缩短期限或正常还款：保持每月本金不变
                            principal = Math.min(equalPrincipalMonthlyPrincipal, remainingPrincipal);
                        }
                        // 使用分段利息计算，支持当月跨越多个利率区间
                        interest = this.calculateSegmentedInterest(lastInterestDate, currentPaymentDate, remainingPrincipal, rateChanges, loan.initialRate, loanEndDate);
                        monthlyPayment = principal + interest;
                    }
                }
                else if (loan.method === 'equal_principal_interest') {
                    // 等本等息
                    if (remainingPrincipal <= 0) {
                        monthlyPayment = prepaymentAmount || 0;
                        interest = 0;
                        principal = prepaymentAmount || 0;
                    }
                    else {
                        // 等本等息：每月本金和利息都固定（基于原始贷款金额）
                        principal = Math.min(equalPrincipalInterestMonthlyPrincipal, remainingPrincipal);
                        interest = equalPrincipalInterestMonthlyInterest;
                        monthlyPayment = principal + interest;
                    }
                }
                else {
                    // 自由还款（北京公积金模式）
                    if (remainingPrincipal <= 0) {
                        monthlyPayment = prepaymentAmount || 0;
                        interest = 0;
                        principal = prepaymentAmount || 0;
                    }
                    else {
                        // 计算当期利息（分段计算，支持利率变更，使用自由还款特殊规则）
                        interest = this.calculateFreeRepaymentSegmentedInterest(lastInterestDate, currentPaymentDate, remainingPrincipal, rateChanges, loan.initialRate, loanEndDate);
                        // 自由还款：使用最低还款额，但优先还利息
                        const minimumPrincipal = Math.max(0, freeRepaymentMinimumPayment - interest);
                        principal = Math.min(minimumPrincipal, remainingPrincipal);
                        monthlyPayment = principal + interest;
                    }
                }
                remainingPrincipal -= principal;
                const today = new Date().toISOString().split('T')[0];
                const scheduleItem = {
                    period: currentPeriod,
                    paymentDate: dateStr,
                    monthlyPayment: Number(monthlyPayment.toFixed(2)),
                    principal: Number(principal.toFixed(2)),
                    interest: Number(interest.toFixed(2)),
                    remainingPrincipal: Number(Math.max(0, remainingPrincipal).toFixed(2)),
                    isPaid: dateStr < today,
                    annualRate: Number(currentRate.toFixed(4)),
                };
                if (prepaymentAmount > 0) {
                    scheduleItem.prepayment = Number(prepaymentAmount.toFixed(2));
                    scheduleItem.prepaymentType = prepaymentType || 'reduce_term';
                }
                schedule.push(scheduleItem);
            }
            // 更新下一期的计息基准日期
            lastInterestDate = new Date(currentPaymentDate);
            currentPeriod++;
            // 计算下一个月还款日
            currentPaymentDate = this.getNextPaymentDate(currentPaymentDate, loan.paymentDay);
            // 如果剩余本金为0，结束循环
            if (remainingPrincipal <= 0.01) {
                break;
            }
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
    // 获取下一个月还款日
    static getNextPaymentDate(currentDate, paymentDay) {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        // 处理月末日期问题
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(paymentDay, lastDayOfMonth));
        return nextDate;
    }
    // 计算分段利息，支持当月跨越多个利率区间
    static calculateSegmentedInterest(startDate, endDate, principal, rateChanges, initialRate, loanEndDate) {
        let totalInterest = 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        // 构建完整的利率区间列表（基于贷款期限）
        const ratePeriods = [];
        // 找到贷款开始日期（用于构建完整的利率区间）
        const loanStartDate = new Date(Math.min(start.getTime(), rateChanges.length > 0 ? new Date(rateChanges[0].effectiveDate).getTime() : start.getTime()));
        // 添加初始利率区间（从贷款开始到第一个利率变更）
        if (rateChanges.length > 0) {
            const firstChange = rateChanges[0];
            ratePeriods.push({
                startDate: new Date(loanStartDate),
                endDate: new Date(firstChange.effectiveDate),
                rate: initialRate
            });
            // 添加中间的利率区间
            for (let i = 0; i < rateChanges.length; i++) {
                const currentChange = rateChanges[i];
                const nextChange = rateChanges[i + 1];
                ratePeriods.push({
                    startDate: new Date(currentChange.effectiveDate),
                    endDate: nextChange ? new Date(nextChange.effectiveDate) : loanEndDate,
                    rate: currentChange.annualRate
                });
            }
        }
        else {
            // 没有利率变更，只有初始利率
            ratePeriods.push({
                startDate: new Date(loanStartDate),
                endDate: loanEndDate,
                rate: initialRate
            });
        }
        // 计算每个利率区间与当前计息周期的交集
        for (const period of ratePeriods) {
            // 计算区间交集
            const intersectStart = new Date(Math.max(start.getTime(), period.startDate.getTime()));
            const intersectEnd = new Date(Math.min(end.getTime(), period.endDate.getTime()));
            if (intersectStart < intersectEnd) {
                // 计算交集天数（包括起始日，不包括结束日）
                const days = Math.max(0, Math.round((intersectEnd.getTime() - intersectStart.getTime()) / (1000 * 60 * 60 * 24)));
                if (days > 0) {
                    // 获取该月总天数（用于计算日利率）
                    const daysInMonth = new Date(intersectStart.getFullYear(), intersectStart.getMonth() + 1, 0).getDate();
                    const monthlyRate = period.rate / 12;
                    // 计算该区间的利息
                    const segmentInterest = principal * monthlyRate * (days / daysInMonth);
                    totalInterest += segmentInterest;
                }
            }
        }
        return totalInterest;
    }
    // 计算自由还款模式的分段利息（不包括起始日，包括结束日）
    static calculateFreeRepaymentSegmentedInterest(startDate, endDate, principal, rateChanges, initialRate, loanEndDate) {
        let totalInterest = 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        // 构建完整的利率区间列表（基于贷款期限）
        const ratePeriods = [];
        // 找到贷款开始日期（用于构建完整的利率区间）
        const loanStartDate = new Date(Math.min(start.getTime(), rateChanges.length > 0 ? new Date(rateChanges[0].effectiveDate).getTime() : start.getTime()));
        // 添加初始利率区间（从贷款开始到第一个利率变更）
        if (rateChanges.length > 0) {
            const firstChange = rateChanges[0];
            ratePeriods.push({
                startDate: new Date(loanStartDate),
                endDate: new Date(firstChange.effectiveDate),
                rate: initialRate
            });
            // 添加中间的利率区间
            for (let i = 0; i < rateChanges.length; i++) {
                const currentChange = rateChanges[i];
                const nextChange = rateChanges[i + 1];
                ratePeriods.push({
                    startDate: new Date(currentChange.effectiveDate),
                    endDate: nextChange ? new Date(nextChange.effectiveDate) : loanEndDate,
                    rate: currentChange.annualRate
                });
            }
        }
        else {
            // 没有利率变更，只有初始利率
            ratePeriods.push({
                startDate: new Date(loanStartDate),
                endDate: loanEndDate,
                rate: initialRate
            });
        }
        // 计算每个利率区间与当前计息周期的交集
        for (const period of ratePeriods) {
            // 计算区间交集
            const intersectStart = new Date(Math.max(start.getTime(), period.startDate.getTime()));
            const intersectEnd = new Date(Math.min(end.getTime(), period.endDate.getTime()));
            if (intersectStart < intersectEnd) {
                // 自由还款模式：不包括起始日，包括结束日
                // 对于第一个区间（旧利率）：从start的下一天到min(利率变更日-1, end)
                // 对于后续区间（新利率）：从max(利率变更日, start的下一天)到end
                let days;
                // 检查是否是第一个区间（旧利率区间）
                if (intersectStart.getTime() === start.getTime()) {
                    // 第一个区间：不包括起始日
                    // 天数 = intersectEnd - intersectStart（不包括起始日）
                    // 如果intersectEnd是利率变更日，则不包括这一天（留给新利率）
                    const isRateChangeDate = rateChanges.some(rc => {
                        const rcDate = new Date(rc.effectiveDate);
                        return rcDate.getFullYear() === intersectEnd.getFullYear() &&
                            rcDate.getMonth() === intersectEnd.getMonth() &&
                            rcDate.getDate() === intersectEnd.getDate();
                    });
                    if (isRateChangeDate) {
                        // 到利率变更日的前一天（不包括起始日，不包括利率变更日）
                        days = Math.max(0, Math.round((intersectEnd.getTime() - intersectStart.getTime()) / (1000 * 60 * 60 * 24)) - 1);
                    }
                    else {
                        // 到intersectEnd（不包括起始日，包括intersectEnd）
                        days = Math.max(0, Math.round((intersectEnd.getTime() - intersectStart.getTime()) / (1000 * 60 * 60 * 24)));
                    }
                }
                else {
                    // 后续区间（新利率）：包括起始日（利率变更日），包括结束日
                    days = Math.max(0, Math.round((intersectEnd.getTime() - intersectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                }
                if (days > 0) {
                    // 获取该月总天数（用于计算日利率）
                    const daysInMonth = new Date(intersectStart.getFullYear(), intersectStart.getMonth() + 1, 0).getDate();
                    const monthlyRate = period.rate / 12;
                    // 计算该区间的利息
                    const segmentInterest = principal * monthlyRate * (days / daysInMonth);
                    totalInterest += segmentInterest;
                }
            }
        }
        return totalInterest;
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
        let totalPrepayment = 0;
        let remainingPrincipal = loan.totalAmount;
        let nextPaymentDate = null;
        let monthlyPayment = 0;
        for (const item of schedule) {
            if (item.paymentDate < today) {
                paidPrincipal += item.principal;
                paidInterest += item.interest;
                if (item.prepayment) {
                    totalPrepayment += item.prepayment;
                }
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
            paidPrincipal: Number(paidPrincipal.toFixed(2)),
            paidInterest: Number(paidInterest.toFixed(2)),
            remainingPrincipal: Number(remainingPrincipal.toFixed(2)),
            progress: Number(progress.toFixed(2)),
            nextPaymentDate,
            monthlyPayment: Number(monthlyPayment.toFixed(2)),
            totalPrepayment: Number(totalPrepayment.toFixed(2)),
        };
    }
}
//# sourceMappingURL=calculatorService.js.map