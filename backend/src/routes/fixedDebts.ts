import { Router } from 'express';
import { FixedDebtService } from '../services/fixedDebtService.js';
import type { ApiResponse } from '../../../shared/types.ts';

const router = Router();

// 获取所有固定债务
router.get('/', (req, res) => {
  try {
    const debts = FixedDebtService.getAllFixedDebts();
    res.json({ success: true, data: debts } as ApiResponse<typeof debts>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch fixed debts' } as ApiResponse<never>);
  }
});

// 创建固定债务
router.post('/', (req, res) => {
  try {
    const debt = FixedDebtService.createFixedDebt(req.body);
    res.status(201).json({ success: true, data: debt } as ApiResponse<typeof debt>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create fixed debt' } as ApiResponse<never>);
  }
});

// 获取单个固定债务
router.get('/:id', (req, res) => {
  try {
    const debt = FixedDebtService.getFixedDebtById(req.params.id);
    if (!debt) {
      return res.status(404).json({ success: false, error: 'Fixed debt not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: debt } as ApiResponse<typeof debt>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch fixed debt' } as ApiResponse<never>);
  }
});

// 更新固定债务
router.put('/:id', (req, res) => {
  try {
    const debt = FixedDebtService.updateFixedDebt(req.params.id, req.body);
    if (!debt) {
      return res.status(404).json({ success: false, error: 'Fixed debt not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: debt } as ApiResponse<typeof debt>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update fixed debt' } as ApiResponse<never>);
  }
});

// 删除固定债务
router.delete('/:id', (req, res) => {
  try {
    const success = FixedDebtService.deleteFixedDebt(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Fixed debt not found' } as ApiResponse<never>);
    }
    res.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete fixed debt' } as ApiResponse<never>);
  }
});

export default router;
