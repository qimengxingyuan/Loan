import assert from 'node:assert/strict';
import test from 'node:test';
import { CalculatorService } from './calculatorService.js';
import type { LoanWithRelations } from '../../../shared/types.ts';

function createLoan(overrides: Partial<LoanWithRelations> = {}): LoanWithRelations {
  return {
    id: 'loan-1',
    name: '测试贷款',
    totalAmount: 120000,
    totalMonths: 12,
    method: 'equal_installment' as LoanWithRelations['method'],
    loanDate: '2026-01-01',
    paymentDay: 1,
    initialRate: 0.036,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    rateChanges: [],
    prepayments: [],
    ...overrides,
  };
}

test('等本等息按当前利率计算后续利息', () => {
  const schedule = CalculatorService.generateSchedule(createLoan({
    method: 'equal_principal_interest' as LoanWithRelations['method'],
    rateChanges: [{
      id: 'rate-1',
      loanId: 'loan-1',
      effectiveDate: '2026-03-01',
      annualRate: 0.06,
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
  }));

  assert.equal(schedule[0].interest, 360);
  assert.equal(schedule[1].interest, 600);
});

test('同日提前还款减少月供会降低后续等额本金月还本金', () => {
  const schedule = CalculatorService.generateSchedule(createLoan({
    method: 'equal_principal' as LoanWithRelations['method'],
    prepayments: [{
      id: 'prepayment-1',
      loanId: 'loan-1',
      paymentDate: '2026-03-01',
      amount: 60000,
      type: 'reduce_payment',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
  }));

  const marchPayment = schedule.find(item => item.period === 2);
  const aprilPayment = schedule.find(item => item.period === 3);

  assert.equal(marchPayment?.prepayment, 60000);
  assert.equal(marchPayment?.principal, 4545.45);
  assert.equal(aprilPayment?.principal, 4545.45);
});

test('预测日期按时间线返回最后一次已发生还款后的本金', () => {
  const schedule = [
    {
      period: -1,
      paymentDate: '2026-01-15',
      monthlyPayment: 10000,
      principal: 10000,
      interest: 0,
      remainingPrincipal: 110000,
      isPaid: false,
      prepayment: 10000,
      prepaymentType: 'reduce_term' as const,
    },
    {
      period: 1,
      paymentDate: '2026-02-01',
      monthlyPayment: 10000,
      principal: 10000,
      interest: 0,
      remainingPrincipal: 100000,
      isPaid: false,
    },
  ];

  assert.equal(CalculatorService.getRemainingPrincipalAtDate(schedule, '2026-01-20'), 110000);
  assert.equal(CalculatorService.getRemainingPrincipalAtDate(schedule, '2026-02-01'), 100000);
});
