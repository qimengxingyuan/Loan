import { db } from '../database/connection.js';
import type {
  FixedDebt,
  CreateFixedDebtRequest,
} from '../../../shared/types.ts';
import { v4 as uuidv4 } from 'uuid';

export class FixedDebtService {
  // 获取所有固定债务
  static getAllFixedDebts(): FixedDebt[] {
    const stmt = db.prepare('SELECT * FROM fixed_debts ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToFixedDebt(row));
  }

  // 获取单个固定债务
  static getFixedDebtById(id: string): FixedDebt | null {
    const stmt = db.prepare('SELECT * FROM fixed_debts WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToFixedDebt(row) : null;
  }

  // 创建固定债务
  static createFixedDebt(request: CreateFixedDebtRequest): FixedDebt {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO fixed_debts (id, name, amount, description, debt_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      request.name,
      request.amount,
      request.description || null,
      request.debtDate,
      now,
      now
    );

    return this.getFixedDebtById(id)!;
  }

  // 更新固定债务
  static updateFixedDebt(id: string, request: Partial<CreateFixedDebtRequest>): FixedDebt | null {
    const debt = this.getFixedDebtById(id);
    if (!debt) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (request.name !== undefined) {
      updates.push('name = ?');
      values.push(request.name);
    }
    if (request.amount !== undefined) {
      updates.push('amount = ?');
      values.push(request.amount);
    }
    if (request.description !== undefined) {
      updates.push('description = ?');
      values.push(request.description);
    }
    if (request.debtDate !== undefined) {
      updates.push('debt_date = ?');
      values.push(request.debtDate);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE fixed_debts SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getFixedDebtById(id)!;
  }

  // 删除固定债务
  static deleteFixedDebt(id: string): boolean {
    const stmt = db.prepare('DELETE FROM fixed_debts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 获取固定债务总额
  static getTotalFixedDebt(): number {
    const stmt = db.prepare('SELECT SUM(amount) as total FROM fixed_debts');
    const row = stmt.get() as any;
    return row.total || 0;
  }

  // 映射数据库行到 FixedDebt 对象
  private static mapRowToFixedDebt(row: any): FixedDebt {
    return {
      id: row.id,
      name: row.name,
      amount: row.amount,
      description: row.description,
      debtDate: row.debt_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
