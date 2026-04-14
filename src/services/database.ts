import Database from 'better-sqlite3';
import { encrypt, decrypt } from './crypto';

const db = new Database('expense.db');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT    UNIQUE NOT NULL,
      channel_id TEXT    NOT NULL,
      applicant  TEXT    NOT NULL,
      amount     TEXT    NOT NULL,
      purpose    TEXT    NOT NULL,
      image_url  TEXT,
      applied_at TEXT    NOT NULL,
      status     TEXT    DEFAULT '審査中',
      sheet_row  INTEGER
    )
  `);
}

export interface Expense {
  id: number;
  message_id: string;
  channel_id: string;
  applicant: string;
  amount: string;
  purpose: string;
  image_url: string | null;
  applied_at: string;
  status: string;
  sheet_row: number | null;
}

type InsertData = Omit<Expense, 'id' | 'status' | 'sheet_row'>;

// 暗号化して保存
export function insertExpense(data: InsertData): void {
  db.prepare(`
    INSERT INTO expenses (message_id, channel_id, applicant, amount, purpose, image_url, applied_at)
    VALUES (@message_id, @channel_id, @applicant, @amount, @purpose, @image_url, @applied_at)
  `).run({
    ...data,
    applicant: encrypt(data.applicant),
    amount:    encrypt(data.amount),
    purpose:   encrypt(data.purpose),
    image_url: data.image_url ? encrypt(data.image_url) : null,
  });
}

// 復号して返す
export function getExpenseByMessage(messageId: string): Expense | undefined {
  const row = db.prepare('SELECT * FROM expenses WHERE message_id = ?').get(messageId) as Expense | undefined;
  if (!row) return undefined;
  return decryptRow(row);
}

export function updateStatus(messageId: string, status: string, sheetRow?: number): void {
  db.prepare('UPDATE expenses SET status = ?, sheet_row = ? WHERE message_id = ?')
    .run(status, sheetRow ?? null, messageId);
}

function decryptRow(row: Expense): Expense {
  return {
    ...row,
    applicant: decrypt(row.applicant),
    amount:    decrypt(row.amount),
    purpose:   decrypt(row.purpose),
    image_url: row.image_url ? decrypt(row.image_url) : null,
  };
}
