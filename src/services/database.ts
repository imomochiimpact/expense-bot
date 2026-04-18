import { encrypt, decrypt } from './crypto';

const BASE_URL = 'https://files.c-lab.works/api';

function getApiKey(): string {
  const key = process.env.FILES_API_KEY;
  if (!key) throw new Error('FILES_API_KEY が設定されていません');
  return key;
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

interface FileListItem {
  id: string;
  tags: string;
}

// SQLite廃止につき no-op
export function initDb(): void {}

export async function insertExpense(data: InsertData): Promise<void> {
  const payload = JSON.stringify({
    message_id: data.message_id,
    channel_id: data.channel_id,
    applicant:  encrypt(data.applicant),
    amount:     encrypt(data.amount),
    purpose:    encrypt(data.purpose),
    image_url:  data.image_url ? encrypt(data.image_url) : null,
    applied_at: data.applied_at,
  });

  const form = new FormData();
  form.append('file', new Blob([payload], { type: 'application/json' }), 'expense.json');
  form.append('description', `expense:${data.message_id}`);
  form.append('tags', `expense,msgid:${data.message_id},status:審査中`);

  const res = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    headers: { 'X-API-Key': getApiKey() },
    body: form,
  });

  if (!res.ok) throw new Error(`申請データの保存に失敗しました (${res.status})`);
}

export async function getExpenseByMessage(messageId: string): Promise<Expense | undefined> {
  const listRes = await fetch(`${BASE_URL}/files?tags=msgid:${messageId}`, {
    headers: { 'X-API-Key': getApiKey() },
  });

  if (!listRes.ok) return undefined;

  const files = (await listRes.json()) as FileListItem[];
  if (files.length === 0) return undefined;

  const file = files[0];
  const tags = file.tags.split(',');
  const status    = tags.find(t => t.startsWith('status:'))?.slice('status:'.length) ?? '審査中';
  const sheetRowStr = tags.find(t => t.startsWith('sheetrow:'))?.slice('sheetrow:'.length);
  const sheet_row = sheetRowStr ? parseInt(sheetRowStr, 10) : null;

  const fileRes = await fetch(`${BASE_URL}/files/${file.id}`, {
    headers: { 'X-API-Key': getApiKey() },
  });

  if (!fileRes.ok) return undefined;

  const raw = JSON.parse(await fileRes.text());

  return {
    id: 0,
    message_id: raw.message_id,
    channel_id: raw.channel_id,
    applicant:  decrypt(raw.applicant),
    amount:     decrypt(raw.amount),
    purpose:    decrypt(raw.purpose),
    image_url:  raw.image_url ? decrypt(raw.image_url) : null,
    applied_at: raw.applied_at,
    status,
    sheet_row,
  };
}

export async function updateStatus(messageId: string, status: string, sheetRow?: number): Promise<void> {
  const listRes = await fetch(`${BASE_URL}/files?tags=msgid:${messageId}`, {
    headers: { 'X-API-Key': getApiKey() },
  });

  if (!listRes.ok) throw new Error(`申請データの検索に失敗しました (${listRes.status})`);

  const files = (await listRes.json()) as FileListItem[];
  if (files.length === 0) throw new Error(`申請データが見つかりません: ${messageId}`);

  const fileId = files[0].id;
  const newTags = sheetRow !== undefined
    ? `expense,msgid:${messageId},status:${status},sheetrow:${sheetRow}`
    : `expense,msgid:${messageId},status:${status}`;

  const patchRes = await fetch(`${BASE_URL}/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'X-API-Key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tags: newTags }),
  });

  if (!patchRes.ok) throw new Error(`ステータス更新に失敗しました (${patchRes.status})`);
}
