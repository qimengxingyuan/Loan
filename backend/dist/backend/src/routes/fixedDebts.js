import { Router } from 'express';
import { FixedDebtService } from '../services/fixedDebtService.js';
const router = Router();
// 获取所有固定债务
router.get('/', (req, res) => {
    try {
        const debts = FixedDebtService.getAllFixedDebts();
        res.json({ success: true, data: debts });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch fixed debts' });
    }
});
// 创建固定债务
router.post('/', (req, res) => {
    try {
        const debt = FixedDebtService.createFixedDebt(req.body);
        res.status(201).json({ success: true, data: debt });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create fixed debt' });
    }
});
// 获取单个固定债务
router.get('/:id', (req, res) => {
    try {
        const debt = FixedDebtService.getFixedDebtById(req.params.id);
        if (!debt) {
            return res.status(404).json({ success: false, error: 'Fixed debt not found' });
        }
        res.json({ success: true, data: debt });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch fixed debt' });
    }
});
// 更新固定债务
router.put('/:id', (req, res) => {
    try {
        const debt = FixedDebtService.updateFixedDebt(req.params.id, req.body);
        if (!debt) {
            return res.status(404).json({ success: false, error: 'Fixed debt not found' });
        }
        res.json({ success: true, data: debt });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update fixed debt' });
    }
});
// 删除固定债务
router.delete('/:id', (req, res) => {
    try {
        const success = FixedDebtService.deleteFixedDebt(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Fixed debt not found' });
        }
        res.json({ success: true, data: null });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete fixed debt' });
    }
});
export default router;
//# sourceMappingURL=fixedDebts.js.map