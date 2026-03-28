import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/loans.db');
const dbInstance = new Database(dbPath);
export const db = dbInstance;
// 启用外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// 初始化数据库表
export function initDatabase() {
    // 贷款表
    db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      total_months INTEGER NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('equal_installment', 'equal_principal')),
      first_payment_date TEXT NOT NULL,
      payment_day INTEGER NOT NULL CHECK(payment_day BETWEEN 1 AND 31),
      initial_rate REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
    // 利率变更表
    db.exec(`
    CREATE TABLE IF NOT EXISTS rate_changes (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      annual_rate REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    )
  `);
    // 提前还款表
    db.exec(`
    CREATE TABLE IF NOT EXISTS prepayments (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('reduce_term', 'reduce_payment')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    )
  `);
    // 固定债务表
    db.exec(`
    CREATE TABLE IF NOT EXISTS fixed_debts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      debt_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
    // 创建索引
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rate_changes_loan_id ON rate_changes(loan_id);
    CREATE INDEX IF NOT EXISTS idx_rate_changes_effective_date ON rate_changes(effective_date);
    CREATE INDEX IF NOT EXISTS idx_prepayments_loan_id ON prepayments(loan_id);
    CREATE INDEX IF NOT EXISTS idx_prepayments_payment_date ON prepayments(payment_date);
  `);
    console.log('Database initialized successfully');
}
//# sourceMappingURL=connection.js.map