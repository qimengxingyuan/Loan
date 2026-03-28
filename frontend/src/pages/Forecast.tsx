import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Clock } from 'lucide-react';
import { MobileLayout } from '../components/Layout/MobileLayout';
import { Card } from '../components/UI/Card';
import { ProgressRing } from '../components/UI/ProgressRing';
import { DatePicker } from '../components/UI/DatePicker';
import { useDashboardStore } from '../stores/dashboardStore';

export default function Forecast() {
  const { forecastData, dashboardData, fetchForecast } = useDashboardStore();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // 默认设置为1年后
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    setSelectedDate(oneYearLater.toISOString().split('T')[0]);
  }, []);

  const handleSearch = () => {
    if (selectedDate) {
      fetchForecast(selectedDate);
      setHasSearched(true);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toFixed(0);
  };

  const quickDates = [
    { label: '1年后', months: 12 },
    { label: '3年后', months: 36 },
    { label: '5年后', months: 60 },
  ];

  const setQuickDate = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const currentDebt = dashboardData?.totalDebt || 0;
  const forecastDebt = forecastData?.totalDebt || 0;
  const debtReduction = currentDebt - forecastDebt;
  const reductionPercent = currentDebt > 0 ? (debtReduction / currentDebt) * 100 : 0;

  return (
    <MobileLayout title="负债预估" showHeader={false}>
      {/* Page Title */}
      <h1 className="text-title-2 font-bold text-[var(--text-primary)] text-center pt-2 pb-2">负债预估</h1>
      
      {/* Date Selector */}
      <Card className="mb-4">
        <div className="text-caption-medium text-[var(--text-secondary)] mb-3">选择预估日期</div>
        
        {/* Date Picker */}
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          min={new Date().toISOString().split('T')[0]}
          className="mb-4"
        />

        {/* Quick Date Buttons */}
        <div className="flex gap-2 mb-4">
          {quickDates.map((item) => (
            <button
              key={item.label}
              onClick={() => setQuickDate(item.months)}
              className="flex-1 py-2 px-3 bg-[var(--background)] rounded-lg text-caption-medium text-[var(--text-secondary)] active:bg-[var(--accent)]/10 active:text-[var(--accent)] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full py-4 gradient-accent text-white rounded-xl text-body-medium font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <TrendingUp size={20} />
          查询预估
        </button>
      </Card>

      {/* Results */}
      {hasSearched && forecastData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main Result Card */}
          <Card className="mb-4 text-center py-6">
            <div className="text-caption text-[var(--text-secondary)] mb-2">
              {selectedDate} 预估总负债
            </div>
            <div className="text-display font-bold text-[var(--primary)] font-mono mb-2">
              ¥{formatCurrency(forecastDebt)}
            </div>
            <div className="flex items-center justify-center gap-2">
              {debtReduction > 0 ? (
                <>
                  <span className="text-small text-[var(--success)]">
                    较当前减少 ¥{formatCurrency(debtReduction)}
                  </span>
                  <span className="px-2 py-0.5 bg-[var(--success)]/10 text-[var(--success)] text-small rounded-full">
                    -{reductionPercent.toFixed(1)}%
                  </span>
                </>
              ) : (
                <span className="text-small text-[var(--text-secondary)]">
                  当前总负债 ¥{formatCurrency(currentDebt)}
                </span>
              )}
            </div>
          </Card>

          {/* Debt Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="text-center">
              <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wallet size={24} className="text-[var(--primary)]" />
              </div>
              <div className="text-caption text-[var(--text-secondary)] mb-1">贷款剩余</div>
              <div className="text-title-2 font-bold text-[var(--primary)] font-mono">
                ¥{formatCurrency(forecastData.totalRemainingPrincipal)}
              </div>
            </Card>
            <Card className="text-center">
              <div className="w-12 h-12 bg-[var(--warning)]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock size={24} className="text-[var(--warning)]" />
              </div>
              <div className="text-caption text-[var(--text-secondary)] mb-1">固定债务</div>
              <div className="text-title-2 font-bold text-[var(--warning)] font-mono">
                ¥{formatCurrency(forecastData.totalFixedDebt)}
              </div>
            </Card>
          </div>

          {/* Loan Details */}
          {forecastData.loans.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-title-3 font-semibold text-[var(--text-primary)]">
                  贷款预估详情
                </h3>
                <span className="text-caption text-[var(--text-secondary)]">
                  {forecastData.loans.length} 笔贷款
                </span>
              </div>

              <div className="space-y-3">
                {forecastData.loans.map((loan, index) => (
                  <motion.div
                    key={loan.loanId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-body-medium font-semibold text-[var(--text-primary)]">
                          {loan.loanName}
                        </h4>
                        <span className="text-caption text-[var(--text-secondary)]">
                          剩 {loan.remainingPeriods} 期
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <ProgressRing
                          progress={Math.max(0, Math.min(100, (1 - loan.remainingPeriods / 360) * 100))}
                          size={60}
                          strokeWidth={6}
                          color="var(--accent)"
                        >
                          <div className="text-center">
                            <div className="text-small font-bold text-[var(--accent)] font-mono">
                              {Math.round((1 - loan.remainingPeriods / 360) * 100)}%
                            </div>
                          </div>
                        </ProgressRing>
                        <div className="flex-1">
                          <div className="text-caption text-[var(--text-secondary)] mb-1">剩余本金</div>
                          <div className="text-title-2 font-bold text-[var(--primary)] font-mono">
                            ¥{formatCurrency(loan.remainingPrincipal)}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 text-small text-[var(--text-secondary)]">
                          <Clock size={14} />
                          <span>预计结清日期: </span>
                          <span className="text-[var(--text-primary)] font-medium">
                            {loan.payoffDate}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Fixed Debts */}
          {forecastData.fixedDebts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-title-3 font-semibold text-[var(--text-primary)]">
                  固定债务
                </h3>
                <span className="text-caption text-[var(--text-secondary)]">
                  {forecastData.fixedDebts.length} 笔
                </span>
              </div>

              <div className="space-y-2">
                {forecastData.fixedDebts.map((debt) => (
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
        </motion.div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <Card className="py-16 text-center">
          <div className="w-20 h-20 bg-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} className="text-[var(--text-tertiary)]" />
          </div>
          <div className="text-title-3 font-semibold text-[var(--text-secondary)] mb-2">
            查看未来负债
          </div>
          <div className="text-caption text-[var(--text-tertiary)]">
            选择日期并点击查询，预估您的未来负债情况
          </div>
        </Card>
      )}

    </MobileLayout>
  );
}
