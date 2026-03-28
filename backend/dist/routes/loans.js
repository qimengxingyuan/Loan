import { Router } from 'express';
import { LoanService } from '../services/loanService.js';
import { CalculatorService } from '../services/calculatorService.js';
const router = Router();
// 获取所有贷款
router.get('/', (req, res) => {
    try {
        const loans = LoanService.getAllLoans();
        res.json({ success: true, data: loans });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch loans' });
    }
});
// 创建贷款
router.post('/', (req, res) => {
    try {
        const loan = LoanService.createLoan(req.body);
        res.status(201).json({ success: true, data: loan });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create loan' });
    }
});
// 获取单个贷款
router.get('/:id', (req, res) => {
    try {
        const loan = LoanService.getLoanById(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, error: 'Loan not found' });
        }
        res.json({ success: true, data: loan });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch loan' });
    }
});
// 更新贷款
router.put('/:id', (req, res) => {
    try {
        const loan = LoanService.updateLoan(req.params.id, req.body);
        if (!loan) {
            return res.status(404).json({ success: false, error: 'Loan not found' });
        }
        res.json({ success: true, data: loan });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update loan' });
    }
});
// 删除贷款
router.delete('/:id', (req, res) => {
    try {
        const success = LoanService.deleteLoan(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Loan not found' });
        }
        res.json({ success: true, data: null });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete loan' });
    }
});
// 获取贷款还款计划
router.get('/:id/schedule', (req, res) => {
    try {
        const loan = LoanService.getLoanById(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, error: 'Loan not found' });
        }
        const schedule = CalculatorService.generateSchedule(loan);
        res.json({ success: true, data: schedule });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate schedule' });
    }
});
// 添加利率变更
router.post('/:id/rate-changes', (req, res) => {
    try {
        const loan = LoanService.getLoanById(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, error: 'Loan not found' });
        }
        const rateChange = LoanService.addRateChange(req.params.id, req.body);
        res.status(201).json({ success: true, data: rateChange });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add rate change' });
    }
});
// 删除利率变更
router.delete('/:id/rate-changes/:rateChangeId', (req, res) => {
    try {
        const success = LoanService.deleteRateChange(req.params.rateChangeId);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Rate change not found' });
        }
        res.json({ success: true, data: null });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete rate change' });
    }
});
// 添加提前还款
router.post('/:id/prepayments', (req, res) => {
    try {
        const loan = LoanService.getLoanById(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, error: 'Loan not found' });
        }
        const prepayment = LoanService.addPrepayment(req.params.id, req.body);
        res.status(201).json({ success: true, data: prepayment });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add prepayment' });
    }
});
// 删除提前还款
router.delete('/:id/prepayments/:prepaymentId', (req, res) => {
    try {
        const success = LoanService.deletePrepayment(req.params.prepaymentId);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Prepayment not found' });
        }
        res.json({ success: true, data: null });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete prepayment' });
    }
});
export default router;
//# sourceMappingURL=loans.js.map