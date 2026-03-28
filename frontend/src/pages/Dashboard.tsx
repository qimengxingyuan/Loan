import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Wallet } from 'lucide-react';
import { MobileLayout } from '../components/Layout/MobileLayout';
import { Card, StatCard } from '../components/UI/Card';
import { ProgressRing, ProgressBar } from '../components/UI/ProgressRing';


import { useDashboardStore } from '../stores/dashboardStore';
import { useLoanStore } from '../stores/loanStore';
import { useFixedDebtStore } from '../stores/fixedDebtStore';
import { RepaymentMethod } from '../types';

export default function Dashboard() {
  const { dashboardData: data, fetchDashboardData: fetchDashboard } = useDashboardStore();
  const { fetchLoans } = useLoanStore();
  const { fetchFixedDebts } = useFixedDebtStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchLoans();
    fetchFixedDebts();
  }, [fetchDashboard, fetchLoans, fetchFixedDebts]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toFixed(0);
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'equal_installment':
        return '等额本息';
      case 'equal_principal':
        return '等额本金';
      case 'equal_principal_interest':
        return '等本等息';
      case 'free_repayment':
        return '自由还款';
      default:
        return '等额本息';
    }
  };

  return (
    <MobileLayout title="贷款管家" showHeader={false}>
      {/* Page Title */}
      <h1 className="text-title-2 font-bold text-[var(--text-primary)] text-center pt-2 pb-2">贷款管家</h1>
      
      {/* Stats Carousel */}
      <div className="mb-10">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 snap-x snap-mandatory">
          <div className="snap-center shrink-0 w-[85%]">
            <StatCard
              label="总负债"
              value={formatCurrency(data?.totalDebt || 0)}
              unit="元"
              color="primary"
            />
          </div>
          <div className="snap-center shrink-0 w-[85%]">
            <StatCard
              label="剩余本金"
              value={formatCurrency(data?.totalRemainingPrincipal || 0)}
              unit="元"
              color="accent"
            />
          </div>
          <div className="snap-center shrink-0 w-[85%]">
            <StatCard
              label="已还本金"
              value={formatCurrency(data?.totalPaidPrincipal || 0)}
              unit="元"
              color="success"
            />
          </div>
          <div className="snap-center shrink-0 w-[85%]">
            <StatCard
              label="已还利息"
              value={formatCurrency(data?.totalPaidInterest || 0)}
              unit="元"
              color="warning"
            />
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <div className="flex items-center gap-6">
          <ProgressRing progress={data?.overallProgress || 0} size={110} strokeWidth={12}>
            <div className="text-center">
              <div className="text-[26px] font-bold text-[var(--accent)] font-mono leading-none">
                {data?.overallProgress.toFixed(1)}%
              </div>
              <div className="text-small text-[var(--text-secondary)] mt-1">已还进度</div>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <div className="text-caption text-[var(--text-secondary)] mb-2 font-medium">整体还款进度</div>
            <ProgressBar progress={data?.overallProgress || 0} height={8} showLabel={false} />
            <div className="flex justify-between mt-4 text-small">
              <div>
                <div className="text-caption text-[var(--text-secondary)] mb-0.5">已还总额</div>
                <div className="text-body-medium font-mono text-[var(--success)] font-semibold">
                  ¥{formatCurrency((data?.totalPaidPrincipal || 0) + (data?.totalPaidInterest || 0))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-caption text-[var(--text-secondary)] mb-0.5">剩余应还</div>
                <div className="text-body-medium font-mono text-[var(--primary)] font-semibold">
                  ¥{formatCurrency(data?.totalRemainingPrincipal || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loan List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)]">我的贷款</h2>
          <span className="px-3 py-1 bg-[var(--primary)]/5 rounded-full text-caption text-[var(--text-secondary)] font-medium">
            共 {data?.loans?.length || 0} 笔
          </span>
        </div>

        {(data?.loans?.length || 0) === 0 ? (
          <Card className="py-12 text-center">
            <div className="w-16 h-16 bg-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet size={28} className="text-[var(--text-tertiary)]" />
            </div>
            <div className="text-body-medium text-[var(--text-secondary)] mb-2">暂无贷款</div>
            <div className="text-caption text-[var(--text-tertiary)]">
              请前往"贷款管理"页面添加您的第一笔贷款
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {data?.loans?.map((loan, index) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card pressable className="relative overflow-hidden" onClick={() => navigate(`/details?loanId=${loan.id}`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[18px] font-semibold text-[var(--text-primary)] tracking-tight">
                        {loan.name}
                      </h3>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] text-[12px] font-medium rounded-md">
                        {getMethodLabel(loan.method)}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                      <ChevronRight size={18} className="text-[var(--text-tertiary)]" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <ProgressBar progress={loan.progress || 0} height={6} showLabel={true} />
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <div>
                      <div className="text-[13px] text-[var(--text-secondary)] mb-1">剩余本金</div>
                      <div className="text-[17px] font-mono font-semibold text-[var(--primary)]">
                        ¥{formatCurrency(loan.remainingPrincipal || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-[var(--text-secondary)] mb-1">月供</div>
                      <div className="text-[17px] font-mono font-semibold text-[var(--text-primary)]">
                        ¥{formatCurrency(loan.monthlyPayment || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-[var(--text-secondary)] mb-1">下次还款</div>
                      <div className="text-[15px] font-medium text-[var(--accent)] bg-[var(--accent)]/5 px-2 py-0.5 rounded-md inline-block">
                        {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).getMonth() + 1 + '月' : '-'}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Debts */}
      {(data?.fixedDebts?.length || 0) > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">固定债务</h2>
            <span className="px-3 py-1 bg-[var(--primary)]/5 rounded-full text-caption text-[var(--text-secondary)] font-medium">
              共 {data?.fixedDebts?.length || 0} 笔
            </span>
          </div>
          <div className="space-y-2">
            {data?.fixedDebts?.map((debt) => (
              <Card key={debt.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--warning)]/10 rounded-full flex items-center justify-center">
                      <Wallet size={18} className="text-[var(--warning)]" />
                    </div>
                    <div>
                      <div className="text-body-medium font-medium">{debt.name}</div>
                      <div className="text-small text-[var(--text-secondary)]">
                        {debt.debtDate}
                      </div>
                    </div>
                  </div>
                  <div className="text-body-medium font-mono font-semibold text-[var(--warning)]">
                    ¥{formatCurrency(debt.amount)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}




    </MobileLayout>
  );
}
