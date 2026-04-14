import { google } from 'googleapis';

interface AppendData {
  applied_at: string;
  applicant: string;
  amount: string;
  purpose: string;
  image_url: string | null;
  approver: string;
  approved_at: string;
}

export async function appendExpense(data: AppendData): Promise<number> {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.SPREADSHEET_ID!;

  const row = [
    data.applied_at,
    data.applicant,
    data.amount,
    data.purpose,
    data.image_url ?? '',
    '承認済み',
    data.approver,
    data.approved_at,
  ];

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  // 書き込んだ行番号を返す（例: "Sheet1!A5:H5" → 5）
  const updatedRange = response.data.updates?.updatedRange ?? '';
  const match = updatedRange.match(/:(?:[A-Z]+)(\d+)$/);
  return match ? parseInt(match[1]) : 0;
}
