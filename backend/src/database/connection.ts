import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/loans.db');

const dbInstance: Database.Database = new Database(dbPath);
export const db = dbInstance;

// 启用外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化数据库表
export function initDatabase(): void {
  // 检查是否需要迁移（删除 first_payment_date 列、更新 CHECK 约束或添加 minimum_payment 列）
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(loans)`).all() as any[];
    const hasFirstPaymentDate = tableInfo.some(col => col.name === 'first_payment_date');
    const hasMinimumPayment = tableInfo.some(col => col.name === 'minimum_payment');
    
    // 检查 method 列的 CHECK 约束是否需要更新
    const methodCol = tableInfo.find(col => col.name === 'method');
    const needsCheckConstraintUpdate = methodCol && !methodCol.dflt_value?.includes('free_repayment');
    
    if (hasFirstPaymentDate || needsCheckConstraintUpdate || !hasMinimumPayment) {
      console.log('Migrating database: updating schema...');
      // SQLite 不支持直接修改 CHECK 约束，需要创建新表并复制数据
      db.exec(`
        BEGIN TRANSACTION;
        CREATE TABLE loans_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          total_amount REAL NOT NULL,
          total_months INTEGER NOT NULL,
          method TEXT NOT NULL CHECK(method IN ('equal_installment', 'equal_principal', 'equal_principal_interest', 'free_repayment')),
          loan_date TEXT NOT NULL DEFAULT '',
          payment_day INTEGER NOT NULL CHECK(payment_day BETWEEN 1 AND 31),
          initial_rate REAL NOT NULL,
          minimum_payment REAL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        INSERT INTO loans_new (id, name, total_amount, total_months, method, loan_date, payment_day, initial_rate, minimum_payment, created_at, updated_at)
        SELECT id, name, total_amount, total_months, method, COALESCE(loan_date, ''), payment_day, initial_rate, NULL, created_at, updated_at FROM loans;
        DROP TABLE loans;
        ALTER TABLE loans_new RENAME TO loans;
        COMMIT;
      `);
      console.log('Database migration completed');
    }
  } catch (e) {
    console.log('Migration check skipped:', e);
  }

  // 贷款表
  db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      total_months INTEGER NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('equal_installment', 'equal_principal', 'equal_principal_interest', 'free_repayment')),
      loan_date TEXT NOT NULL,
      payment_day INTEGER NOT NULL CHECK(payment_day BETWEEN 1 AND 31),
      initial_rate REAL NOT NULL,
      minimum_payment REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // 尝试添加 loan_date 列（如果表已存在且没有该列）
  try {
    db.exec(`ALTER TABLE loans ADD COLUMN loan_date TEXT NOT NULL DEFAULT ''`);
  } catch (e) {
    // 忽略列已存在的错误
  }

  // 尝试添加 minimum_payment 列（如果表已存在且没有该列）
  try {
    db.exec(`ALTER TABLE loans ADD COLUMN minimum_payment REAL`);
  } catch (e) {
    // 忽略列已存在的错误
  }

  // 利率变更表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_changes (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      end_date TEXT,
      annual_rate REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    )
  `);

  // 尝试添加 end_date 列（如果表已存在且没有该列）
  try {
    db.exec(`ALTER TABLE rate_changes ADD COLUMN end_date TEXT`);
  } catch (e) {
    // 忽略列已存在的错误
  }

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
