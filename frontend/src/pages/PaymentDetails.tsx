import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Calendar, CheckCircle2, Landmark, ChevronRight, Zap } from 'lucide-react';
import { MobileLayout } from '../components/Layout/MobileLayout';
import { Card } from '../components/UI/Card';
import { Sheet } from '../components/UI/Sheet';
import { ProgressBar } from '../components/UI/ProgressRing';
import { useLoanStore } from '../stores/loanStore';
import type { PaymentScheduleItem } from '../types';
import { loanApi } from '../services/api';

type FilterType = 'all' | 'paid' | 'unpaid';

export default function PaymentDetails() {
  const { loans, fetchLoans } = useLoanStore();
  const [searchParams] = useSearchParams();
  const urlLoanId = searchParams.get('loanId');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(urlLoanId || '');
  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showLoanSelector, setShowLoanSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    if (loans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(loans[0].id);
    }
  }, [loans, selectedLoanId]);

  useEffect(() => {
    if (urlLoanId && loans.some(l => l.id === urlLoanId)) {
      setSelectedLoanId(urlLoanId);
    }
  }, [urlLoanId, loans]);

  useEffect(() => {
    if (selectedLoanId) {
      fetchSchedule(selectedLoanId);
    }
  }, [selectedLoanId]);

  const fetchSchedule = async (loanId: string) => {
    setLoading(true);
    try {
      const response = await loanApi.getSchedule(loanId);
      if (response.success && response.data) {
        setSchedule(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLoan = useMemo(() => {
    return loans.find(l => l.id === selectedLoanId);
  }, [loans, selectedLoanId]);

  const filteredSchedule = useMemo(() => {
    switch (filter) {
      case 'paid':
        return schedule.filter(item => item.isPaid);
      case 'unpaid':
        return schedule.filter(item => !item.isPaid);
      default:
        return schedule;
    }
  }, [schedule, filter]);

  const stats = useMemo(() => {
    // 只统计正常还款（排除提前还款记录，period > 0 的是正常还款，period < 0 的是提前还款）
    const normalPayments = schedule.filter(s => s.period > 0);
    const paid = normalPayments.filter(s => s.isPaid);
    const unpaid = normalPayments.filter(s => !s.isPaid);
    // 已还/待还的提前还款记录
    const paidPrepayments = schedule.filter(s => s.period < 0 && s.isPaid);
    
    // 已还本金（正常还款本金 + 提前还款本金）
    const paidPrincipal = paid.reduce((sum, s) => sum + s.principal, 0) 
      + paidPrepayments.reduce((sum, s) => sum + (s.prepayment || 0), 0);
    // 已还利息（正常还款利息 + 提前还款利息）
    const paidInterest = paid.reduce((sum, s) => sum + s.interest, 0)
      + paidPrepayments.reduce((sum, s) => sum + s.interest, 0);
    // 剩余本金（取最后一个已还记录的剩余本金，或第一个未还记录的剩余本金+本金）
    const remainingPrincipal = paid.length > 0 
      ? paid[paid.length - 1].remainingPrincipal 
      : (unpaid.length > 0 ? unpaid[0].remainingPrincipal + unpaid[0].principal : 0);
    
    return {
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      paidPrincipal,
      paidInterest,
      remainingPrincipal,
      progress: normalPayments.length > 0 ? (paid.length / normalPayments.length) * 100 : 0,
    };
  }, [schedule]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 用于统计卡片的金额格式化（保留整数）
  const formatCurrencyInteger = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const groupByYear = (items: PaymentScheduleItem[]) => {
    const groups: { [key: string]: PaymentScheduleItem[] } = {};
    items.forEach(item => {
      const year = item.paymentDate.substring(0, 4);
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    // 按年份从小到大排序
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const groupedSchedule = groupByYear(filteredSchedule);

   useEffect(() => {
     // 默认只展开当前年份及以后的年份，历史年份折叠
     if (groupedSchedule.length > 0) {
       const currentYear = new Date().getFullYear().toString();
       const initialExpandedState: Record<string, boolean> = {};
       groupedSchedule.forEach(([year]) => {
         initialExpandedState[year] = year >= currentYear;
       });
       setExpandedYears(initialExpandedState);
     }
   }, [schedule]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  return (
    <MobileLayout title="还款明细" showHeader={false}>
      {/* Page Title */}
      <h1 className="text-title-2 font-bold text-[var(--text-primary)] text-center pt-2 pb-2">还款明细</h1>
      
      {/* Loan Selector */}
      <div className="mb-4">
        <button
          onClick={() => setShowLoanSelector(true)}
          className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
              <Landmark size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <div className="text-caption text-[var(--text-secondary)]">当前贷款</div>
              <div className="text-body-medium font-semibold text-[var(--text-primary)]">
                {selectedLoan?.name || '选择贷款'}
              </div>
            </div>
          </div>
          <ChevronDown size={20} className="text-[var(--text-tertiary)]" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="text-center">
          <div className="text-caption text-[var(--text-secondary)] mb-1">已还期数</div>
          <div className="text-title-2 font-bold text-[var(--success)] font-mono">{stats.paidCount}</div>
          <div className="text-small text-[var(--text-tertiary)]">期</div>
        </Card>
        <Card className="text-center">
          <div className="text-caption text-[var(--text-secondary)] mb-1">待还期数</div>
          <div className="text-title-2 font-bold text-[var(--warning)] font-mono">{stats.unpaidCount}</div>
          <div className="text-small text-[var(--text-tertiary)]">期</div>
        </Card>
      </div>

      {/* Progress */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption-medium text-[var(--text-secondary)]">还款进度</span>
          <span className="text-body-medium font-mono font-semibold text-[var(--accent)]">
            {stats.progress.toFixed(1)}%
          </span>
        </div>
        <ProgressBar progress={stats.progress} height={8} />
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 bg-[var(--success)]/5 rounded-lg">
            <div className="text-caption text-[var(--text-secondary)] mb-1">已还本金</div>
            <div className="text-body-small font-mono font-semibold text-[var(--success)]">
              ¥{formatCurrencyInteger(stats.paidPrincipal)}
            </div>
          </div>
          <div className="text-center p-2 bg-[var(--primary)]/5 rounded-lg">
            <div className="text-caption text-[var(--text-secondary)] mb-1">已付利息</div>
            <div className="text-body-small font-mono font-semibold text-[var(--primary)]">
              ¥{formatCurrencyInteger(stats.paidInterest)}
            </div>
          </div>
          <div className="text-center p-2 bg-[var(--warning)]/5 rounded-lg">
            <div className="text-caption text-[var(--text-secondary)] mb-1">待还本金</div>
            <div className="text-body-small font-mono font-semibold text-[var(--warning)]">
              ¥{formatCurrencyInteger(stats.remainingPrincipal)}
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { key: 'all', label: '全部', count: stats.paidCount + stats.unpaidCount },
          { key: 'paid', label: '已还', count: stats.paidCount },
          { key: 'unpaid', label: '待还', count: stats.unpaidCount }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as FilterType)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-body-medium transition-all ${
              filter === tab.key
                ? 'bg-[var(--accent)] text-white'
                : 'bg-white text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
            <span className={`ml-1 text-small ${filter === tab.key ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-caption text-[var(--text-secondary)]">加载中...</div>
        </div>
      ) : filteredSchedule.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="w-16 h-16 bg-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-[var(--text-tertiary)]" />
          </div>
          <div className="text-body-medium text-[var(--text-secondary)]">暂无还款记录</div>
        </Card>
      ) : (
        <div>
          {groupedSchedule.map(([year, items]) => (
            <div key={year} className={expandedYears[year] ? 'mb-4' : 'mb-1'}>
              <div className="sticky top-0 z-10 py-1">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-4 py-3 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-body-large font-bold text-[var(--text-primary)]">{year}年</span>
                    <span className="px-2 py-0.5 bg-[var(--primary)]/10 rounded-full text-caption font-medium text-[var(--primary)]">
                      {items.filter(i => i.period > 0).length} 期
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedYears[year] ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} className="text-[var(--text-secondary)]" />
                  </motion.div>
                </button>
              </div>
              <motion.div 
                initial={false}
                animate={{ 
                  height: expandedYears[year] ? 'auto' : 0,
                  opacity: expandedYears[year] ? 1 : 0,
                  overflow: expandedYears[year] ? 'visible' : 'hidden'
                }}
                className="space-y-3 pl-2 border-l-2 border-[var(--border)] ml-4 mt-2"
              >
                {items.map((item, index) => (
                  <motion.div
                    key={item.period}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-[27px] top-6 w-3 h-3 rounded-full bg-[var(--background)] border-2 z-10 ${item.isPaid ? 'border-[var(--success)] bg-[var(--success)]' : 'border-[var(--primary)]'}`}></div>
                    
                    <Card className={`relative ${item.isPaid ? 'opacity-70 bg-gray-50/50' : ''} ${item.prepayment ? 'border-2 border-[var(--accent)]/30' : ''}`}>
                      <div className="flex items-center gap-4">
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              {item.period > 0 && (
                                <span className="text-caption-medium text-[var(--text-secondary)]">
                                  第 {item.period} 期
                                </span>
                              )}
                              {item.period < 0 && (
                                <span className="text-caption-medium text-[var(--accent)]">
                                  提前还款
                                </span>
                              )}
                              <div className="text-body-medium font-medium">
                                {item.paymentDate}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-title-3 font-mono font-bold text-[var(--text-primary)]">
                                ¥{formatCurrency(item.monthlyPayment)}
                              </div>
                              <div className={`text-small ${item.isPaid ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                                {item.isPaid ? '已还清' : '待还款'}
                              </div>
                            </div>
                          </div>

                          {/* 提前还款标识 */}
                          {item.prepayment && (
                            <div className="mb-3 p-2 bg-[var(--accent)]/10 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Zap size={16} className="text-[var(--accent)]" />
                                <span className="text-small font-medium text-[var(--accent)]">
                                  提前还款: ¥{formatCurrency(item.prepayment)}
                                </span>
                                <span className="text-caption text-[var(--text-secondary)]">
                                  ({item.prepaymentType === 'reduce_term' ? '缩短期限' : '减少月供'})
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-4 text-small flex-wrap">
                            <div>
                              <span className="text-[var(--text-secondary)]">本金: </span>
                              <span className="font-mono">¥{formatCurrency(item.principal)}</span>
                            </div>
                            <div>
                              <span className="text-[var(--text-secondary)]">利息: </span>
                              <span className="font-mono">¥{formatCurrency(item.interest)}</span>
                            </div>
                            {item.annualRate !== undefined && (
                              <div>
                                <span className="text-[var(--text-secondary)]">利率: </span>
                                <span className="font-mono text-[var(--accent)]">{(item.annualRate * 100).toFixed(2)}%</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-2 pt-2 border-t border-[var(--border)]">
                            <div className="flex justify-between text-small">
                              <span className="text-[var(--text-secondary)]">剩余本金</span>
                              <span className="font-mono font-medium">¥{formatCurrency(item.remainingPrincipal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Loan Selector Modal */}
      <Sheet
        isOpen={showLoanSelector}
        onClose={() => setShowLoanSelector(false)}
        title="选择贷款"
        height="half"
      >
        <div className="p-4 space-y-3">
          {loans.map((loan) => (
            <button
              key={loan.id}
              onClick={() => {
                setSelectedLoanId(loan.id);
                setShowLoanSelector(false);
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
                selectedLoanId === loan.id
                  ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)]'
                  : 'bg-[var(--background)] border-2 border-transparent'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedLoanId === loan.id ? 'bg-[var(--accent)]' : 'bg-white shadow-sm'
              }`}>
                <Landmark size={24} className={selectedLoanId === loan.id ? 'text-white' : 'text-[var(--text-secondary)]'} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-body-medium font-semibold">{loan.name}</div>
                <div className="text-small text-[var(--text-secondary)] mt-1">
                  ¥{formatCurrency(loan.totalAmount)} · {loan.totalMonths}个月
                </div>
              </div>
              {selectedLoanId === loan.id && (
                <CheckCircle2 size={22} className="text-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      </Sheet>
    </MobileLayout>
  );
}
