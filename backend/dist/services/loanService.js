import { db } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
export class LoanService {
    // 获取所有贷款
    static getAllLoans() {
        const stmt = db.prepare('SELECT * FROM loans ORDER BY created_at DESC');
        const rows = stmt.all();
        return rows.map(row => this.mapRowToLoan(row));
    }
    // 获取单个贷款
    static getLoanById(id) {
        const loanStmt = db.prepare('SELECT * FROM loans WHERE id = ?');
        const loanRow = loanStmt.get(id);
        if (!loanRow)
            return null;
        const rateChangesStmt = db.prepare('SELECT * FROM rate_changes WHERE loan_id = ? ORDER BY effective_date');
        const rateChanges = rateChangesStmt.all(id);
        const prepaymentsStmt = db.prepare('SELECT * FROM prepayments WHERE loan_id = ? ORDER BY payment_date');
        const prepayments = prepaymentsStmt.all(id);
        return {
            ...this.mapRowToLoan(loanRow),
            rateChanges: rateChanges.map(row => this.mapRowToRateChange(row)),
            prepayments: prepayments.map(row => this.mapRowToPrepayment(row)),
        };
    }
    // 创建贷款
    static createLoan(request) {
        const id = uuidv4();
        const now = new Date().toISOString();
        const stmt = db.prepare(`
      INSERT INTO loans (id, name, total_amount, total_months, method, first_payment_date, payment_day, initial_rate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, request.name, request.totalAmount, request.totalMonths, request.method, request.firstPaymentDate, request.paymentDay, request.initialRate, now, now);
        return this.getLoanById(id);
    }
    // 更新贷款
    static updateLoan(id, request) {
        const loan = this.getLoanById(id);
        if (!loan)
            return null;
        const now = new Date().toISOString();
        const updates = [];
        const values = [];
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
        if (request.firstPaymentDate !== undefined) {
            updates.push('first_payment_date = ?');
            values.push(request.firstPaymentDate);
        }
        if (request.paymentDay !== undefined) {
            updates.push('payment_day = ?');
            values.push(request.paymentDay);
        }
        if (request.initialRate !== undefined) {
            updates.push('initial_rate = ?');
            values.push(request.initialRate);
        }
        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);
        const stmt = db.prepare(`UPDATE loans SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        return this.getLoanById(id);
    }
    // 删除贷款
    static deleteLoan(id) {
        const stmt = db.prepare('DELETE FROM loans WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // 添加利率变更
    static addRateChange(loanId, request) {
        const id = uuidv4();
        const now = new Date().toISOString();
        const stmt = db.prepare(`
      INSERT INTO rate_changes (id, loan_id, effective_date, annual_rate, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(id, loanId, request.effectiveDate, request.annualRate, now);
        return {
            id,
            loanId,
            effectiveDate: request.effectiveDate,
            annualRate: request.annualRate,
            createdAt: now,
        };
    }
    // 删除利率变更
    static deleteRateChange(id) {
        const stmt = db.prepare('DELETE FROM rate_changes WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // 添加提前还款
    static addPrepayment(loanId, request) {
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
    static deletePrepayment(id) {
        const stmt = db.prepare('DELETE FROM prepayments WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // 映射数据库行到 Loan 对象
    static mapRowToLoan(row) {
        return {
            id: row.id,
            name: row.name,
            totalAmount: row.total_amount,
            totalMonths: row.total_months,
            method: row.method,
            firstPaymentDate: row.first_payment_date,
            paymentDay: row.payment_day,
            initialRate: row.initial_rate,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    // 映射数据库行到 RateChange 对象
    static mapRowToRateChange(row) {
        return {
            id: row.id,
            loanId: row.loan_id,
            effectiveDate: row.effective_date,
            annualRate: row.annual_rate,
            createdAt: row.created_at,
        };
    }
    // 映射数据库行到 Prepayment 对象
    static mapRowToPrepayment(row) {
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
//# sourceMappingURL=loanService.js.map