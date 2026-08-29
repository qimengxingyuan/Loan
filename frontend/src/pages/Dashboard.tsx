import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Wallet } from 'lucide-react';
import { MobileLayout } from '../components/Layout/MobileLayout';
import { Card, StatCard } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressRing';


import { useDashboardStore } from '../stores/dashboardStore';
import { formatCompactCurrency, getMethodLabel } from '../utils/format';

export default function Dashboard() {
  const { dashboardData: data, fetchDashboardData: fetchDashboard } = useDashboardStore();
  const navigate = useNavigate();
  const paidPrincipal = data?.totalPaidPrincipal || 0;
  const paidInterest = data?.totalPaidInterest || 0;
  const remainingPrincipal = data?.totalRemainingPrincipal || 0;
  const distributionTotal = paidPrincipal + paidInterest + remainingPrincipal;
  const paidPrincipalRatio = distributionTotal > 0 ? (paidPrincipal / distributionTotal) * 100 : 0;
  const paidInterestRatio = distributionTotal > 0 ? (paidInterest / distributionTotal) * 100 : 0;
  const remainingPrincipalRatio = distributionTotal > 0 ? (remainingPrincipal / distributionTotal) * 100 : 0;

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <MobileLayout title="贷款管家" showHeader={false}>
      {/* Page Title */}
      <h1 className="text-title-2 font-bold text-[var(--text-primary)] text-center pt-2 pb-2">贷款管家</h1>
      
      {/* Stats Carousel */}
      <div className="mb-10">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0">
          <div className="snap-center shrink-0 w-[85%] md:w-auto">
            <StatCard
              label="总负债"
              value={formatCompactCurrency(data?.totalDebt || 0)}
              unit="元"
              color="primary"
            />
          </div>
          <div className="snap-center shrink-0 w-[85%] md:w-auto">
            <StatCard
              label="剩余本金"
              value={formatCompactCurrency(data?.totalRemainingPrincipal || 0)}
              unit="元"
              color="accent"
            />
          </div>
          <div className="snap-center shrink-0 w-[85%] md:w-auto">
            <StatCard
              label="已还本金"
              value={formatCompactCurrency(data?.totalPaidPrincipal || 0)}
              unit="元"
              color="success"
            />
          </div>
          <div className="snap-center shrink-0 w-[85%] md:w-auto">
            <StatCard
              label="已还利息"
              value={formatCompactCurrency(data?.totalPaidInterest || 0)}
              unit="元"
              color="warning"
            />
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-caption text-[var(--text-secondary)] font-medium">还款明细分布</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[32px] font-bold text-[var(--accent)] font-mono leading-none">
                  {(data?.overallProgress || 0).toFixed(1)}%
                </span>
                <span className="text-small text-[var(--text-secondary)]">本金已还</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-caption text-[var(--text-secondary)]">总计</div>
              <div className="text-body-medium font-mono font-semibold text-[var(--text-primary)]">
                ¥{formatCompactCurrency(distributionTotal)}
              </div>
            </div>
          </div>

          <div className="mb-5 h-4 w-full overflow-hidden rounded-full bg-[var(--border)]">
            {distributionTotal > 0 ? (
              <div className="flex h-full w-full">
                <motion.div
                  className="h-full bg-[var(--success)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${paidPrincipalRatio}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
                <motion.div
                  className="h-full bg-[var(--warning)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${paidInterestRatio}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.08 }}
                />
                <motion.div
                  className="h-full bg-[var(--text-tertiary)]/35"
                  initial={{ width: 0 }}
                  animate={{ width: `${remainingPrincipalRatio}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.16 }}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-[var(--success)]/8 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-small text-[var(--text-secondary)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
                已还本金
              </div>
              <div className="font-mono text-body-medium font-semibold text-[var(--text-primary)]">
                ¥{formatCompactCurrency(paidPrincipal)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--warning)]/8 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-small text-[var(--text-secondary)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--warning)]" />
                已还利息
              </div>
              <div className="font-mono text-body-medium font-semibold text-[var(--text-primary)]">
                ¥{formatCompactCurrency(paidInterest)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-small text-[var(--text-secondary)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--text-tertiary)]/45" />
                剩余应还本金
              </div>
              <div className="font-mono text-body-medium font-semibold text-[var(--primary)]">
                ¥{formatCompactCurrency(remainingPrincipal)}
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
                      <div className="flex items-center gap-2">
                        {loan.icon ? (
                          <div className="w-8 h-8 bg-[var(--background)] rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border)] shrink-0">
                            <img src={loan.icon} alt="Icon" className="w-5 h-5 object-contain" />
                          </div>
                        ) : null}
                        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
                          {loan.name}
                        </h3>
                      </div>
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
                        ¥{formatCompactCurrency(loan.remainingPrincipal || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-[var(--text-secondary)] mb-1">月供</div>
                      <div className="text-[17px] font-mono font-semibold text-[var(--text-primary)]">
                        ¥{formatCompactCurrency(loan.monthlyPayment || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-[var(--text-secondary)] mb-1">下次还款</div>
                      <div className="text-[15px] font-medium text-[var(--accent)] bg-[var(--accent)]/5 px-2 py-0.5 rounded-md inline-block">
                        {loan.nextPaymentDate ? `${Number(loan.nextPaymentDate.slice(5, 7))}月` : '-'}
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
                    ¥{formatCompactCurrency(debt.amount)}
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
