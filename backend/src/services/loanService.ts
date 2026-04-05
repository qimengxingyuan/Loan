import { db } from '../database/connection.js';
import type {
  Loan,
  LoanWithRelations,
  RateChange,
  Prepayment,
  CreateLoanRequest,
  UpdateLoanRequest,
  AddRateChangeRequest,
  AddPrepaymentRequest,
} from '../../../shared/types.ts';
import { v4 as uuidv4 } from 'uuid';

export class LoanService {
  // 获取所有贷款
  static getAllLoans(): Loan[] {
    const stmt = db.prepare('SELECT * FROM loans ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    const loans = rows.map(row => this.mapRowToLoan(row));
    
    // 为每个贷款计算当前适用利率
    const today = new Date().toISOString().split('T')[0];
    for (const loan of loans) {
      const currentRate = this.getCurrentRate(loan.id, loan.initialRate, today);
      (loan as any).currentRate = currentRate;
    }
    
    return loans;
  }
  
  // 获取指定日期的适用利率
  private static getCurrentRate(loanId: string, initialRate: number, date: string): number {
    const rateChangesStmt = db.prepare('SELECT * FROM rate_changes WHERE loan_id = ? ORDER BY effective_date');
    const rateChanges = rateChangesStmt.all(loanId) as any[];
    
    let currentRate = initialRate;
    for (const rc of rateChanges) {
      // 如果利率生效日期小于等于指定日期，且没有结束日期或结束日期大于指定日期
      if (rc.effective_date <= date) {
        if (!rc.end_date || rc.end_date > date) {
          currentRate = rc.annual_rate;
        }
      }
    }
    
    return currentRate;
  }

  // 获取单个贷款
  static getLoanById(id: string): LoanWithRelations | null {
    const loanStmt = db.prepare('SELECT * FROM loans WHERE id = ?');
    const loanRow = loanStmt.get(id) as any;
    
    if (!loanRow) return null;

    const rateChangesStmt = db.prepare('SELECT * FROM rate_changes WHERE loan_id = ? ORDER BY effective_date');
    const rateChanges = rateChangesStmt.all(id) as any[];

    const prepaymentsStmt = db.prepare('SELECT * FROM prepayments WHERE loan_id = ? ORDER BY payment_date');
    const prepayments = prepaymentsStmt.all(id) as any[];

    return {
      ...this.mapRowToLoan(loanRow),
      rateChanges: rateChanges.map(row => this.mapRowToRateChange(row)),
      prepayments: prepayments.map(row => this.mapRowToPrepayment(row)),
    };
  }

  // 创建贷款
  static createLoan(request: CreateLoanRequest): Loan {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO loans (id, name, total_amount, total_months, method, loan_date, payment_day, initial_rate, minimum_payment, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      request.name,
      request.totalAmount,
      request.totalMonths,
      request.method,
      request.loanDate,
      request.paymentDay,
      request.initialRate,
      request.minimumPayment || null,
      request.icon || null,
      now,
      now
    );

    return this.getLoanById(id)!;
  }

  // 更新贷款
  static updateLoan(id: string, request: UpdateLoanRequest): Loan | null {
    const loan = this.getLoanById(id);
    if (!loan) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (request.name !== undefined) {
      updates.push('name = ?');
      values.push(request.name);
    }
    if (request.totalAmount !== undefined) {
      updates.push('total_amount = ?');
      values.push(request.totalAmount);
    }
    if (request.totalMonths !== undefined) {
      updates.push('total_months = ?');
      values.push(request.totalMonths);
    }
    if (request.method !== undefined) {
      updates.push('method = ?');
      values.push(request.method);
    }
    if (request.loanDate !== undefined) {
      updates.push('loan_date = ?');
      values.push(request.loanDate);
    }
    if (request.paymentDay !== undefined) {
      updates.push('payment_day = ?');
      values.push(request.paymentDay);
    }
    if (request.initialRate !== undefined) {
      updates.push('initial_rate = ?');
      values.push(request.initialRate);
    }
    if (request.minimumPayment !== undefined) {
      updates.push('minimum_payment = ?');
      values.push(request.minimumPayment);
    }
    if (request.icon !== undefined) {
      updates.push('icon = ?');
      values.push(request.icon);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE loans SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getLoanById(id)!;
  }

  // 删除贷款
  static deleteLoan(id: string): boolean {
    const stmt = db.prepare('DELETE FROM loans WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 添加利率变更
  static addRateChange(loanId: string, request: AddRateChangeRequest): RateChange {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO rate_changes (id, loan_id, effective_date, end_date, annual_rate, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, loanId, request.effectiveDate, request.endDate || null, request.annualRate, now);

    return {
      id,
      loanId,
      effectiveDate: request.effectiveDate,
      endDate: request.endDate,
      annualRate: request.annualRate,
      createdAt: now,
    };
  }

  // 删除利率变更
  static deleteRateChange(id: string): boolean {
    const stmt = db.prepare('DELETE FROM rate_changes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 添加提前还款
  static addPrepayment(loanId: string, request: AddPrepaymentRequest): Prepayment {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO prepayments (id, loan_id, payment_date, amount, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, loanId, request.paymentDate, request.amount, request.type, now);

    return {
      id,
      loanId,
      paymentDate: request.paymentDate,
      amount: request.amount,
      type: request.type,
      createdAt: now,
    };
  }

  // 删除提前还款
  static deletePrepayment(id: string): boolean {
    const stmt = db.prepare('DELETE FROM prepayments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 映射数据库行到 Loan 对象
  private static mapRowToLoan(row: any): Loan {
    return {
      id: row.id,
      name: row.name,
      totalAmount: row.total_amount,
      totalMonths: row.total_months,
      method: row.method,
      loanDate: row.loan_date,
      paymentDay: row.payment_day,
      initialRate: row.initial_rate,
      minimumPayment: row.minimum_payment,
      icon: row.icon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // 映射数据库行到 RateChange 对象
  private static mapRowToRateChange(row: any): RateChange {
    return {
      id: row.id,
      loanId: row.loan_id,
      effectiveDate: row.effective_date,
      endDate: row.end_date,
      annualRate: row.annual_rate,
      createdAt: row.created_at,
    };
  }

  // 映射数据库行到 Prepayment 对象
  private static mapRowToPrepayment(row: any): Prepayment {
    return {
      id: row.id,
      loanId: row.loan_id,
      paymentDate: row.payment_date,
      amount: row.amount,
      type: row.type,
      createdAt: row.created_at,
    };
  }
}
