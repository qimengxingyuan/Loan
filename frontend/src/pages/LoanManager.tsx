import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, FileText, ChevronRight, Edit2, Plus, Trash2, Zap, TrendingUp } from 'lucide-react';
import { MobileLayout } from '../components/Layout/MobileLayout';
import { Card } from '../components/UI/Card';
import { Sheet } from '../components/UI/Sheet';
import { SwipeableItem } from '../components/UI/SwipeableItem';
import { DatePicker } from '../components/UI/DatePicker';
import { useLoanStore } from '../stores/loanStore';
import { useFixedDebtStore } from '../stores/fixedDebtStore';
import { usePrepaymentStore } from '../stores/prepaymentStore';
import { RepaymentMethod, PrepaymentType, type RateChange } from '../types';

export default function LoanManager() {
  const { loans, fetchLoans, deleteLoan, createLoan, updateLoan, currentLoan, fetchLoanById, addRateChange, deleteRateChange, error: loanError, loading: loanLoading } = useLoanStore();
  const { fixedDebts, fetchFixedDebts, deleteFixedDebt, createFixedDebt, updateFixedDebt } = useFixedDebtStore();
  const { prepayments, fetchPrepayments, createPrepayment, updatePrepayment, deletePrepayment } = usePrepaymentStore();
  
  const [activeTab, setActiveTab] = useState<'loans' | 'debts' | 'prepayments'>('loans');
  const [showLoanSheet, setShowLoanSheet] = useState(false);
  const [showDebtSheet, setShowDebtSheet] = useState(false);
  const [showPrepaymentSheet, setShowPrepaymentSheet] = useState(false);
  const [showRateChangeSheet, setShowRateChangeSheet] = useState(false);
  
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editingPrepaymentId, setEditingPrepaymentId] = useState<string | null>(null);
  const [editingPrepaymentLoanId, setEditingPrepaymentLoanId] = useState<string | null>(null);
  const [editingRateChangeLoanId, setEditingRateChangeLoanId] = useState<string | null>(null);

  // Loan form state
  const [loanForm, setLoanForm] = useState<{
    name: string;
    totalAmount: string;
    totalMonths: string;
    method: RepaymentMethod;
    loanDate: string;
    paymentDay: string;
    initialRate: string;
    minimumPayment: string;
  }>({
    name: '',
    totalAmount: '',
    totalMonths: '',
    method: RepaymentMethod.EQUAL_INSTALLMENT,
    loanDate: new Date().toISOString().split('T')[0],
    paymentDay: '',
    initialRate: '',
    minimumPayment: ''
  });

  // Debt form state
  const [debtForm, setDebtForm] = useState({
    name: '',
    amount: '',
    description: '',
    debtDate: new Date().toISOString().split('T')[0]
  });

  // Prepayment form state
  const [prepaymentForm, setPrepaymentForm] = useState({
    loanId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    type: PrepaymentType.REDUCE_TERM
  });

  // Rate change form state
  const [rateChangeForm, setRateChangeForm] = useState({
    loanId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    annualRate: ''
  });

  useEffect(() => {
    fetchLoans();
    fetchFixedDebts();
  }, [fetchLoans, fetchFixedDebts]);

  useEffect(() => {
    if (loans.length > 0) {
      fetchPrepayments(loans);
    }
  }, [loans, fetchPrepayments]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toFixed(0);
  };

  const getMethodLabel = (method: RepaymentMethod) => {
    switch (method) {
      case RepaymentMethod.EQUAL_INSTALLMENT:
        return '等额本息';
      case RepaymentMethod.EQUAL_PRINCIPAL:
        return '等额本金';
      case RepaymentMethod.EQUAL_PRINCIPAL_INTEREST:
        return '等本等息';
      case RepaymentMethod.FREE_REPAYMENT:
        return '自由还款';
      default:
        return '等额本息';
    }
  };

  const getPrepaymentTypeLabel = (type: PrepaymentType) => {
    return type === PrepaymentType.REDUCE_TERM ? '缩短期限' : '减少月供';
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateLoanRequest = {
      name: loanForm.name,
      totalAmount: parseFloat(loanForm.totalAmount),
      totalMonths: parseInt(loanForm.totalMonths),
      method: loanForm.method,
      loanDate: loanForm.loanDate,
      paymentDay: parseInt(loanForm.paymentDay),
      initialRate: parseFloat(loanForm.initialRate) / 100,
      minimumPayment: loanForm.minimumPayment ? parseFloat(loanForm.minimumPayment) : undefined
    };

    try {
      if (editingLoanId) {
        await updateLoan(editingLoanId, data);
      } else {
        await createLoan(data);
      }
      
      // 成功后才关闭表单和重置
      setShowLoanSheet(false);
      setEditingLoanId(null);
      setLoanForm({
        name: '',
        totalAmount: '',
        totalMonths: '',
        method: RepaymentMethod.EQUAL_INSTALLMENT,
        loanDate: new Date().toISOString().split('T')[0],
        paymentDay: '',
        initialRate: '',
        minimumPayment: ''
      });
    } catch (err) {
      // 错误已在 store 中处理
      console.error('Failed to create/update loan:', err);
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: debtForm.name,
      amount: parseFloat(debtForm.amount),
      description: debtForm.description,
      debtDate: debtForm.debtDate
    };

    if (editingDebtId) {
      await updateFixedDebt(editingDebtId, data);
    } else {
      await createFixedDebt(data);
    }

    setShowDebtSheet(false);
    setEditingDebtId(null);
    setDebtForm({
      name: '',
      amount: '',
      description: '',
      debtDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleCreatePrepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      paymentDate: prepaymentForm.paymentDate,
      amount: parseFloat(prepaymentForm.amount),
      type: prepaymentForm.type
    };

    if (editingPrepaymentId && editingPrepaymentLoanId) {
      await updatePrepayment(editingPrepaymentLoanId, editingPrepaymentId, data);
    } else {
      await createPrepayment(prepaymentForm.loanId, data);
    }

    setShowPrepaymentSheet(false);
    setEditingPrepaymentId(null);
    setEditingPrepaymentLoanId(null);
    setPrepaymentForm({
      loanId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      type: PrepaymentType.REDUCE_TERM
    });
  };

  const handleEditLoan = (loan: any) => {
    setLoanForm({
      name: loan.name,
      totalAmount: loan.totalAmount.toString(),
      totalMonths: loan.totalMonths.toString(),
      method: loan.method,
      loanDate: loan.loanDate || new Date().toISOString().split('T')[0],
      paymentDay: loan.paymentDay.toString(),
      initialRate: (loan.initialRate * 100).toString(),
      minimumPayment: loan.minimumPayment ? loan.minimumPayment.toString() : ''
    });
    setEditingLoanId(loan.id);
    setShowLoanSheet(true);
  };

  const handleEditDebt = (debt: any) => {
    setDebtForm({
      name: debt.name,
      amount: debt.amount.toString(),
      description: debt.description || '',
      debtDate: debt.debtDate
    });
    setEditingDebtId(debt.id);
    setShowDebtSheet(true);
  };

  const handleEditPrepayment = (prepayment: any) => {
    setPrepaymentForm({
      loanId: prepayment.loanId,
      paymentDate: prepayment.paymentDate,
      amount: prepayment.amount.toString(),
      type: prepayment.type
    });
    setEditingPrepaymentId(prepayment.id);
    setEditingPrepaymentLoanId(prepayment.loanId);
    setShowPrepaymentSheet(true);
  };

  const openNewLoanSheet = () => {
    setEditingLoanId(null);
    setLoanForm({
      name: '',
      totalAmount: '',
      totalMonths: '',
      method: RepaymentMethod.EQUAL_INSTALLMENT,
      loanDate: new Date().toISOString().split('T')[0],
      paymentDay: '',
      initialRate: ''
    });
    setShowLoanSheet(true);
  };

  const openNewDebtSheet = () => {
    setEditingDebtId(null);
    setDebtForm({
      name: '',
      amount: '',
      description: '',
      debtDate: new Date().toISOString().split('T')[0]
    });
    setShowDebtSheet(true);
  };

  const openNewPrepaymentSheet = () => {
    setEditingPrepaymentId(null);
    setEditingPrepaymentLoanId(null);
    setPrepaymentForm({
      loanId: loans.length > 0 ? loans[0].id : '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      type: PrepaymentType.REDUCE_TERM
    });
    setShowPrepaymentSheet(true);
  };

  const handleCreateRateChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      effectiveDate: rateChangeForm.effectiveDate,
      endDate: rateChangeForm.endDate || undefined,
      annualRate: parseFloat(rateChangeForm.annualRate) / 100
    };

    if (editingRateChangeLoanId) {
      await addRateChange(editingRateChangeLoanId, data);
    }

    setShowRateChangeSheet(false);
    setEditingRateChangeLoanId(null);
    setRateChangeForm({
      loanId: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      annualRate: ''
    });
  };

  const openRateChangeSheet = async (loanId: string) => {
    setEditingRateChangeLoanId(loanId);
    setRateChangeForm({
      loanId: loanId,
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      annualRate: ''
    });
    await fetchLoanById(loanId);
    setShowRateChangeSheet(true);
  };

  return (
    <MobileLayout title="贷款管理" showHeader={false}>
      {/* Page Title */}
      <h1 className="text-title-2 font-bold text-[var(--text-primary)] text-center pt-2 pb-2">贷款管理</h1>
      
      {/* Segmented Control */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-[var(--border)] rounded-full p-1">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-full text-body-medium transition-all duration-200 ${
              activeTab === 'loans'
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            贷款 ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('prepayments')}
            className={`px-4 py-2 rounded-full text-body-medium transition-all duration-200 ${
              activeTab === 'prepayments'
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            提前还款 ({prepayments.length})
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`px-4 py-2 rounded-full text-body-medium transition-all duration-200 ${
              activeTab === 'debts'
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            固定债务 ({fixedDebts.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'loans' ? (
          <motion.div
            key="loans"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {loans.length === 0 ? (
              <Card className="py-16 text-center">
                <div className="w-20 h-20 bg-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="text-title-3 font-semibold text-[var(--text-secondary)] mb-2">
                  暂无贷款
                </div>
                <div className="text-caption text-[var(--text-tertiary)] mb-6">
                  点击下方按钮添加您的第一笔贷款
                </div>
                <button
                  onClick={openNewLoanSheet}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-full text-body-medium font-medium"
                >
                  <Plus size={20} />
                  添加贷款
                </button>
              </Card>
            ) : (
              <div className="space-y-3">
                {loans.map((loan, index) => (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SwipeableItem onDelete={() => deleteLoan(loan.id)}>
                      <Card pressable className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                              <Wallet size={24} className="text-[var(--primary)]" />
                            </div>
                            <div>
                              <h3 className="text-body-medium font-semibold text-[var(--text-primary)]">
                                {loan.name}
                              </h3>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] text-small rounded-full">
                                {getMethodLabel(loan.method)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openRateChangeSheet(loan.id); }}
                              className="touch-target text-[var(--text-tertiary)] hover:text-[var(--warning)] transition-colors"
                              title="管理利率"
                            >
                              <TrendingUp size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditLoan(loan); }}
                              className="touch-target text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                              title="编辑贷款"
                            >
                              <Edit2 size={18} />
                            </button>
                            <ChevronRight size={20} className="text-[var(--text-tertiary)]" />
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-small text-[var(--text-secondary)]">贷款总额</div>
                              <div className="text-title-3 font-mono font-semibold text-[var(--primary)]">
                                ¥{formatCurrency(loan.totalAmount)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-small text-[var(--text-secondary)]">期限</div>
                              <div className="text-body-medium font-mono">
                                {loan.totalMonths}个月
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-small text-[var(--text-secondary)]">利率</div>
                              <div className="text-body-medium font-mono text-[var(--accent)]">
                                {((loan.currentRate || loan.initialRate) * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </SwipeableItem>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'prepayments' ? (
          <motion.div
            key="prepayments"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {prepayments.length === 0 ? (
              <Card className="py-16 text-center">
                <div className="w-20 h-20 bg-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="text-title-3 font-semibold text-[var(--text-secondary)] mb-2">
                  暂无提前还款记录
                </div>
                <div className="text-caption text-[var(--text-tertiary)] mb-6">
                  点击下方按钮添加提前还款记录
                </div>
                <button
                  onClick={openNewPrepaymentSheet}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-full text-body-medium font-medium"
                >
                  <Plus size={20} />
                  添加提前还款
                </button>
              </Card>
            ) : (
              <div className="space-y-3">
                {prepayments.map((prepayment, index) => (
                  <motion.div
                    key={prepayment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SwipeableItem onDelete={() => deletePrepayment(prepayment.loanId, prepayment.id)}>
                      <Card pressable className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center">
                              <Zap size={24} className="text-[var(--accent)]" />
                            </div>
                            <div>
                              <h3 className="text-body-medium font-semibold text-[var(--text-primary)]">
                                {prepayment.loanName}
                              </h3>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] text-small rounded-full">
                                {getPrepaymentTypeLabel(prepayment.type)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditPrepayment(prepayment); }}
                              className="touch-target text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deletePrepayment(prepayment.loanId, prepayment.id); }}
                              className="touch-target text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-small text-[var(--text-secondary)]">还款金额</div>
                              <div className="text-title-3 font-mono font-semibold text-[var(--accent)]">
                                ¥{formatCurrency(prepayment.amount)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-small text-[var(--text-secondary)]">还款日期</div>
                              <div className="text-body-medium font-mono">
                                {prepayment.paymentDate}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </SwipeableItem>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="debts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {fixedDebts.length === 0 ? (
              <Card className="py-16 text-center">
                <div className="w-20 h-20 bg-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="text-title-3 font-semibold text-[var(--text-secondary)] mb-2">
                  暂无固定债务
                </div>
                <div className="text-caption text-[var(--text-tertiary)] mb-6">
                  点击下方按钮添加固定债务
                </div>
                <button
                  onClick={openNewDebtSheet}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--success)] text-white rounded-full text-body-medium font-medium"
                >
                  <Plus size={20} />
                  添加债务
                </button>
              </Card>
            ) : (
              <div className="space-y-3">
                {fixedDebts.map((debt, index) => (
                  <motion.div
                    key={debt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SwipeableItem onDelete={() => deleteFixedDebt(debt.id)}>
                      <Card pressable className="relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[var(--warning)]/10 rounded-xl flex items-center justify-center">
                              <FileText size={24} className="text-[var(--warning)]" />
                            </div>
                            <div>
                              <h3 className="text-body-medium font-semibold text-[var(--text-primary)]">
                                {debt.name}
                              </h3>
                              <div className="text-small text-[var(--text-secondary)]">
                                {debt.debtDate}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-title-3 font-mono font-semibold text-[var(--warning)]">
                              ¥{formatCurrency(debt.amount)}
                            </div>
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditDebt(debt); }}
                                className="touch-target text-[var(--text-tertiary)] hover:text-[var(--warning)] transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteFixedDebt(debt.id); }}
                                className="touch-target text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </SwipeableItem>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Button - Capsule Style */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (activeTab === 'loans') openNewLoanSheet();
          else if (activeTab === 'prepayments') openNewPrepaymentSheet();
          else openNewDebtSheet();
        }}
        className="fixed left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full gradient-accent flex items-center gap-2 shadow-lg"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus size={20} className="text-white" />
        <span className="text-white text-body-medium font-medium">
          {activeTab === 'loans' ? '添加贷款' : activeTab === 'prepayments' ? '添加提前还款' : '添加债务'}
        </span>
      </motion.button>

      {/* Add Loan Sheet */}
      <Sheet isOpen={showLoanSheet} onClose={() => setShowLoanSheet(false)} title={editingLoanId ? '编辑贷款' : '添加贷款'} height="full">
        <form onSubmit={handleCreateLoan} className="p-4 space-y-4">
          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">贷款名称</label>
            <input
              type="text"
              value={loanForm.name}
              onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
              className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
              placeholder="例如：房贷、车贷"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">贷款总额(元)</label>
              <input
                type="number"
                value={loanForm.totalAmount}
                onChange={(e) => setLoanForm({ ...loanForm, totalAmount: e.target.value })}
                className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all font-mono"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">期数(月)</label>
              <input
                type="number"
                value={loanForm.totalMonths}
                onChange={(e) => setLoanForm({ ...loanForm, totalMonths: e.target.value })}
                className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all font-mono"
                placeholder="360"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">年化利率(%)</label>
            <input
              type="number"
              step="0.01"
              value={loanForm.initialRate}
              onChange={(e) => setLoanForm({ ...loanForm, initialRate: e.target.value })}
              className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all font-mono"
              placeholder="4.25"
              required
            />
          </div>

          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">还款方式</label>
            <div className="flex gap-3 bg-[var(--background)] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setLoanForm({ ...loanForm, method: RepaymentMethod.EQUAL_INSTALLMENT })}
                className={`flex-1 py-3 rounded-xl text-body-medium transition-all ${
                  loanForm.method === RepaymentMethod.EQUAL_INSTALLMENT
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                等额本息
              </button>
              <button
                type="button"
                onClick={() => setLoanForm({ ...loanForm, method: RepaymentMethod.EQUAL_PRINCIPAL })}
                className={`flex-1 py-3 rounded-xl text-body-medium transition-all ${
                  loanForm.method === RepaymentMethod.EQUAL_PRINCIPAL
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                等额本金
              </button>
              <button
                type="button"
                onClick={() => setLoanForm({ ...loanForm, method: RepaymentMethod.EQUAL_PRINCIPAL_INTEREST })}
                className={`flex-1 py-3 rounded-xl text-body-medium transition-all ${
                  loanForm.method === RepaymentMethod.EQUAL_PRINCIPAL_INTEREST
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                等本等息
              </button>
              <button
                type="button"
                onClick={() => setLoanForm({ ...loanForm, method: RepaymentMethod.FREE_REPAYMENT })}
                className={`flex-1 py-3 rounded-xl text-body-medium transition-all ${
                  loanForm.method === RepaymentMethod.FREE_REPAYMENT
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                自由还款
              </button>
            </div>
          </div>

          {loanForm.method === RepaymentMethod.FREE_REPAYMENT && (
            <div>
              <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">最低还款额(元)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={loanForm.minimumPayment || ''}
                onChange={(e) => setLoanForm({ ...loanForm, minimumPayment: e.target.value })}
                placeholder="请输入每月最低还款额"
                className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all font-mono"
                required={loanForm.method === RepaymentMethod.FREE_REPAYMENT}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <DatePicker
                label="放贷日期"
                value={loanForm.loanDate}
                onChange={(date) => setLoanForm({ ...loanForm, loanDate: date })}
                required
              />
            </div>
            <div>
              <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">还款日(1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={loanForm.paymentDay}
                onChange={(e) => setLoanForm({ ...loanForm, paymentDay: e.target.value })}
                className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all font-mono"
                placeholder="15"
                required
              />
            </div>
          </div>

          {loanError && (
            <div className="p-3 bg-red-50 text-red-500 rounded-xl text-small">
              {loanError}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loanLoading}
              className="w-full py-4 gradient-accent text-white rounded-2xl text-body-medium font-semibold active:scale-[0.98] transition-transform shadow-lg shadow-[var(--accent)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loanLoading ? '处理中...' : (editingLoanId ? '确认修改' : '确认添加')}
            </button>
          </div>
        </form>
      </Sheet>

      {/* Add Prepayment Sheet */}
      <Sheet isOpen={showPrepaymentSheet} onClose={() => setShowPrepaymentSheet(false)} title={editingPrepaymentId ? '编辑提前还款' : '添加提前还款'} height="full">
        <form onSubmit={handleCreatePrepayment} className="p-4 space-y-4">
          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">选择贷款</label>
            <select
              value={prepaymentForm.loanId}
              onChange={(e) => setPrepaymentForm({ ...prepaymentForm, loanId: e.target.value })}
              className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
              required
              disabled={!!editingPrepaymentId}
            >
              <option value="">请选择贷款</option>
              {loans.map(loan => (
                <option key={loan.id} value={loan.id}>{loan.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">还款金额(元)</label>
            <input
              type="number"
              value={prepaymentForm.amount}
              onChange={(e) => setPrepaymentForm({ ...prepaymentForm, amount: e.target.value })}
              className="w-full px-4 py-3.5 bg-[var(--background)] rounded-2xl text-body-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all font-mono"
              placeholder="0.00"
              required
            />
          </div>

          <DatePicker
            label="还款日期"
            value={prepaymentForm.paymentDate}
            onChange={(date) => setPrepaymentForm({ ...prepaymentForm, paymentDate: date })}
            required
          />

          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">还款类型</label>
            <div className="flex gap-3 bg-[var(--background)] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setPrepaymentForm({ ...prepaymentForm, type: PrepaymentType.REDUCE_TERM })}
                className={`flex-1 py-3 rounded-xl text-body-medium transition-all ${
                  prepaymentForm.type === PrepaymentType.REDUCE_TERM
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                缩短期限
              </button>
              <button
                type="button"
                onClick={() => setPrepaymentForm({ ...prepaymentForm, type: PrepaymentType.REDUCE_PAYMENT })}
                className={`flex-1 py-3 rounded-xl text-body-medium transition-all ${
                  prepaymentForm.type === PrepaymentType.REDUCE_PAYMENT
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                减少月供
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 gradient-accent text-white rounded-2xl text-body-medium font-semibold active:scale-[0.98] transition-transform shadow-lg shadow-[var(--accent)]/30"
            >
              {editingPrepaymentId ? '确认修改' : '确认添加'}
            </button>
          </div>
        </form>
      </Sheet>

      {/* Add Debt Sheet */}
      <Sheet isOpen={showDebtSheet} onClose={() => setShowDebtSheet(false)} title={editingDebtId ? '编辑固定债务' : '添加固定债务'} height="full">
        <form onSubmit={handleCreateDebt} className="p-4 space-y-4">
          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">债务名称</label>
            <input
              type="text"
              value={debtForm.name}
              onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--background)] rounded-xl text-body focus:outline-none focus:ring-2 focus:ring-[var(--success)]"
              placeholder="例如：信用卡欠款"
              required
            />
          </div>
          
          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">债务金额</label>
            <input
              type="number"
              value={debtForm.amount}
              onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--background)] rounded-xl text-body focus:outline-none focus:ring-2 focus:ring-[var(--success)]"
              placeholder="金额"
              required
            />
          </div>

          <DatePicker
            label="债务日期"
            value={debtForm.debtDate}
            onChange={(date) => setDebtForm({ ...debtForm, debtDate: date })}
            required
          />

          <div>
            <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">备注（可选）</label>
            <textarea
              value={debtForm.description}
              onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--background)] rounded-xl text-body focus:outline-none focus:ring-2 focus:ring-[var(--success)] resize-none"
              placeholder="添加备注..."
              rows={3}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-[var(--success)] text-white rounded-xl text-body-medium font-semibold active:scale-[0.98] transition-transform"
            >
              {editingDebtId ? '确认修改' : '确认添加'}
            </button>
          </div>
        </form>
      </Sheet>

      {/* Rate Change Management Sheet */}
      <Sheet isOpen={showRateChangeSheet} onClose={() => setShowRateChangeSheet(false)} title="利率管理" height="full">
        <div className="p-4 space-y-4">
          {/* Current Loan Info */}
          {currentLoan && (
            <Card className="bg-[var(--warning)]/5 border-[var(--warning)]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[var(--warning)]/10 rounded-full flex items-center justify-center">
                  <Wallet size={20} className="text-[var(--warning)]" />
                </div>
                <div>
                  <div className="text-body-medium font-semibold">{currentLoan.name}</div>
                  <div className="text-small text-[var(--text-secondary)]">
                    初始利率: {(currentLoan.initialRate * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Existing Rate Changes */}
          <div>
            <h3 className="text-body-medium font-semibold text-[var(--text-primary)] mb-3">已有利率变更</h3>
            {currentLoan?.rateChanges && currentLoan.rateChanges.length > 0 ? (
              <div className="space-y-2">
                {currentLoan.rateChanges.map((rateChange: RateChange) => (
                  <Card key={rateChange.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--warning)]/10 rounded-full flex items-center justify-center">
                          <TrendingUp size={16} className="text-[var(--warning)]" />
                        </div>
                        <div>
                          <div className="text-body-medium font-mono text-[var(--warning)]">
                            {(rateChange.annualRate * 100).toFixed(2)}%
                          </div>
                          <div className="text-small text-[var(--text-secondary)]">
                            {rateChange.effectiveDate} 至 {rateChange.endDate || '结束'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => editingRateChangeLoanId && deleteRateChange(editingRateChangeLoanId, rateChange.id)}
                        className="touch-target text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                <div className="text-small">暂无利率变更记录</div>
                <div className="text-caption text-[var(--text-tertiary)] mt-1">使用下方表单添加新利率</div>
              </div>
            )}
          </div>

          {/* Add New Rate Change Form */}
          <div className="pt-4 border-t border-[var(--border)]">
            <h3 className="text-body-medium font-semibold text-[var(--text-primary)] mb-3">添加新利率</h3>
            <form onSubmit={handleCreateRateChange} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="生效日期"
                  value={rateChangeForm.effectiveDate}
                  onChange={(date) => setRateChangeForm({ ...rateChangeForm, effectiveDate: date })}
                  required
                />
                <DatePicker
                  label="结束日期(可选)"
                  value={rateChangeForm.endDate}
                  onChange={(date) => setRateChangeForm({ ...rateChangeForm, endDate: date })}
                />
              </div>

              <div>
                <label className="block text-caption-medium text-[var(--text-secondary)] mb-2">年化利率(%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rateChangeForm.annualRate}
                  onChange={(e) => setRateChangeForm({ ...rateChangeForm, annualRate: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--background)] rounded-xl text-body focus:outline-none focus:ring-2 focus:ring-[var(--warning)] font-mono"
                  placeholder="例如：3.85"
                  required
                />
                <div className="text-caption text-[var(--text-tertiary)] mt-1">
                  输入新的年化利率百分比，例如 3.85 表示 3.85%
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-[var(--warning)] text-white rounded-xl text-body-medium font-semibold active:scale-[0.98] transition-transform"
                >
                  添加利率变更
                </button>
              </div>
            </form>
          </div>
        </div>
      </Sheet>
    </MobileLayout>
  );
}
