import { Router } from 'express';
import { LoanService } from '../services/loanService.js';
import { CalculatorService } from '../services/calculatorService.js';
import type { ApiResponse } from '../../../shared/types.ts';

const router = Router();

// 获取所有贷款
router.get('/', (req, res) => {
  try {
    const loans = LoanService.getAllLoans();
    res.json({ success: true, data: loans } as ApiResponse<typeof loans>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch loans' } as ApiResponse<never>);
  }
});

// 创建贷款
router.post('/', (req, res) => {
  try {
    console.log('Creating loan with data:', req.body);
    const loan = LoanService.createLoan(req.body);
    res.status(201).json({ success: true, data: loan } as ApiResponse<typeof loan>);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ success: false, error: `Failed to create loan: ${error instanceof Error ? error.message : 'Unknown error'}` } as ApiResponse<never>);
  }
});

// 获取单个贷款
router.get('/:id', (req, res) => {
  try {
    const loan = LoanService.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: loan } as ApiResponse<typeof loan>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch loan' } as ApiResponse<never>);
  }
});

// 更新贷款
router.put('/:id', (req, res) => {
  try {
    const loan = LoanService.updateLoan(req.params.id, req.body);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: loan } as ApiResponse<typeof loan>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update loan' } as ApiResponse<never>);
  }
});

// 删除贷款
router.delete('/:id', (req, res) => {
  try {
    const success = LoanService.deleteLoan(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Loan not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete loan' } as ApiResponse<never>);
  }
});

// 获取贷款还款计划
router.get('/:id/schedule', (req, res) => {
  try {
    const loan = LoanService.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' } as ApiResponse<never>);
    }
    const schedule = CalculatorService.generateSchedule(loan);
    res.json({ success: true, data: schedule } as ApiResponse<typeof schedule>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate schedule' } as ApiResponse<never>);
  }
});

// 添加利率变更
router.post('/:id/rate-changes', (req, res) => {
  try {
    const loan = LoanService.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' } as ApiResponse<never>);
    }
    const rateChange = LoanService.addRateChange(req.params.id, req.body);
    res.status(201).json({ success: true, data: rateChange } as ApiResponse<typeof rateChange>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add rate change' } as ApiResponse<never>);
  }
});

// 删除利率变更
router.delete('/:id/rate-changes/:rateChangeId', (req, res) => {
  try {
    const success = LoanService.deleteRateChange(req.params.rateChangeId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Rate change not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete rate change' } as ApiResponse<never>);
  }
});

// 添加提前还款
router.post('/:id/prepayments', (req, res) => {
  try {
    const loan = LoanService.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' } as ApiResponse<never>);
    }
    const prepayment = LoanService.addPrepayment(req.params.id, req.body);
    res.status(201).json({ success: true, data: prepayment } as ApiResponse<typeof prepayment>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add prepayment' } as ApiResponse<never>);
  }
});

// 删除提前还款
router.delete('/:id/prepayments/:prepaymentId', (req, res) => {
  try {
    const success = LoanService.deletePrepayment(req.params.prepaymentId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Prepayment not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete prepayment' } as ApiResponse<never>);
  }
});

export default router;
