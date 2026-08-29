import { db } from '../database/connection.js';
import { formatLocalDate } from '../utils/date.js';
import { v4 as uuidv4 } from 'uuid';
export class LoanService {
    // 获取所有贷款
    static getAllLoans() {
        const loans = this.getAllLoansWithRelations();
        const today = formatLocalDate();
        return loans.map(loan => ({
            id: loan.id,
            name: loan.name,
            totalAmount: loan.totalAmount,
            totalMonths: loan.totalMonths,
            method: loan.method,
            loanDate: loan.loanDate,
            paymentDay: loan.paymentDay,
            initialRate: loan.initialRate,
            currentRate: this.getCurrentRateFromChanges(loan.rateChanges, loan.initialRate, today),
            minimumPayment: loan.minimumPayment,
            icon: loan.icon,
            createdAt: loan.createdAt,
            updatedAt: loan.updatedAt,
        }));
    }
    // 获取所有贷款及关联数据
    static getAllLoansWithRelations() {
        const loanRows = db.prepare('SELECT * FROM loans ORDER BY created_at DESC').all();
        if (loanRows.length === 0)
            return [];
        const rateChanges = db.prepare('SELECT * FROM rate_changes ORDER BY effective_date').all()
            .map(row => this.mapRowToRateChange(row));
        const prepayments = db.prepare('SELECT * FROM prepayments ORDER BY payment_date').all()
            .map(row => this.mapRowToPrepayment(row));
        const rateChangesByLoan = this.groupByLoanId(rateChanges);
        const prepaymentsByLoan = this.groupByLoanId(prepayments);
        return loanRows.map(row => {
            const loan = this.mapRowToLoan(row);
            return {
                ...loan,
                rateChanges: rateChangesByLoan.get(loan.id) || [],
                prepayments: prepaymentsByLoan.get(loan.id) || [],
            };
        });
    }
    // 获取所有提前还款记录及贷款名称
    static getAllPrepaymentsWithLoan() {
        const rows = db.prepare(`
      SELECT p.*, l.name AS loan_name
      FROM prepayments p
      JOIN loans l ON l.id = p.loan_id
      ORDER BY p.payment_date DESC
    `).all();
        return rows.map(row => ({
            ...this.mapRowToPrepayment(row),
            loanName: row.loan_name,
        }));
    }
    // 获取单个贷款
    static getLoanById(id) {
        const loanRow = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
        if (!loanRow)
            return null;
        const rateChanges = db.prepare('SELECT * FROM rate_changes WHERE loan_id = ? ORDER BY effective_date').all(id)
            .map(row => this.mapRowToRateChange(row));
        const prepayments = db.prepare('SELECT * FROM prepayments WHERE loan_id = ? ORDER BY payment_date').all(id)
            .map(row => this.mapRowToPrepayment(row));
        return {
            ...this.mapRowToLoan(loanRow),
            rateChanges,
            prepayments,
        };
    }
    // 创建贷款
    static createLoan(request) {
        const id = uuidv4();
        const now = new Date().toISOString();
        db.prepare(`
      INSERT INTO loans (id, name, total_amount, total_months, method, loan_date, payment_day, initial_rate, minimum_payment, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, request.name, request.totalAmount, request.totalMonths, request.method, request.loanDate, request.paymentDay, request.initialRate, request.minimumPayment ?? null, request.icon || null, now, now);
        return this.getLoanById(id);
    }
    // 更新贷款
    static updateLoan(id, request) {
        if (!this.getLoanById(id))
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
        values.push(now, id);
        db.prepare(`UPDATE loans SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        return this.getLoanById(id);
    }
    // 删除贷款
    static deleteLoan(id) {
        const result = db.prepare('DELETE FROM loans WHERE id = ?').run(id);
        return result.changes > 0;
    }
    // 添加利率变更
    static addRateChange(loanId, request) {
        const id = uuidv4();
        const now = new Date().toISOString();
        db.prepare(`
      INSERT INTO rate_changes (id, loan_id, effective_date, end_date, annual_rate, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, loanId, request.effectiveDate, request.endDate || null, request.annualRate, now);
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
    static deleteRateChange(loanId, id) {
        const result = db.prepare('DELETE FROM rate_changes WHERE id = ? AND loan_id = ?').run(id, loanId);
        return result.changes > 0;
    }
    // 添加提前还款
    static addPrepayment(loanId, request) {
        const id = uuidv4();
        const now = new Date().toISOString();
        db.prepare(`
      INSERT INTO prepayments (id, loan_id, payment_date, amount, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, loanId, request.paymentDate, request.amount, request.type, now);
        return {
            id,
            loanId,
            paymentDate: request.paymentDate,
            amount: request.amount,
            type: request.type,
            createdAt: now,
        };
    }
    // 更新提前还款
    static updatePrepayment(loanId, id, request) {
        const result = db.prepare(`
      UPDATE prepayments
      SET payment_date = ?, amount = ?, type = ?
      WHERE id = ? AND loan_id = ?
    `).run(request.paymentDate, request.amount, request.type, id, loanId);
        if (result.changes === 0)
            return null;
        const row = db.prepare('SELECT * FROM prepayments WHERE id = ? AND loan_id = ?').get(id, loanId);
        return row ? this.mapRowToPrepayment(row) : null;
    }
    // 删除提前还款
    static deletePrepayment(loanId, id) {
        const result = db.prepare('DELETE FROM prepayments WHERE id = ? AND loan_id = ?').run(id, loanId);
        return result.changes > 0;
    }
    static getCurrentRateFromChanges(rateChanges, initialRate, date) {
        let currentRate = initialRate;
        for (const rc of rateChanges) {
            if (rc.effectiveDate <= date && (!rc.endDate || rc.endDate > date)) {
                currentRate = rc.annualRate;
            }
        }
        return currentRate;
    }
    static groupByLoanId(items) {
        const grouped = new Map();
        for (const item of items) {
            const current = grouped.get(item.loanId);
            if (current) {
                current.push(item);
            }
            else {
                grouped.set(item.loanId, [item]);
            }
        }
        return grouped;
    }
    // 映射数据库行到 Loan 对象
    static mapRowToLoan(row) {
        return {
            id: row.id,
            name: row.name,
            totalAmount: row.total_amount,
            totalMonths: row.total_months,
            method: row.method,
            loanDate: row.loan_date,
            paymentDay: row.payment_day,
            initialRate: row.initial_rate,
            minimumPayment: row.minimum_payment ?? undefined,
            icon: row.icon ?? undefined,
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
            endDate: row.end_date ?? undefined,
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