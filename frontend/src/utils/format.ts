import { RepaymentMethod } from '../types';

export function formatCompactCurrency(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return amount.toFixed(0);
}

export function getMethodLabel(method: string): string {
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
      return '未知方式';
  }
}

