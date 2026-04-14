const BASE_URL = 'https://files.c-lab.works/api';

function getApiKey(): string {
  const key = process.env.FILES_API_KEY;
  if (!key) throw new Error('FILES_API_KEY が .env に設定されていません');
  return key;
}

interface UploadResult {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
}

/**
 * Discord CDN のURLからファイルを取得し、files.c-lab.works にアップロードする。
 * 成功したらダウンロードURLを返す。
 */
export async function uploadReceipt(
  discordUrl: string,
  fileName: string,
  mimeType: string,
  description: string,
): Promise<string> {
  // Discord CDN から一時ダウンロード
  const fileRes = await fetch(discordUrl);
  if (!fileRes.ok) throw new Error(`Discord CDNからのダウンロード失敗: ${fileRes.status}`);
  const fileBuffer = await fileRes.arrayBuffer();

  // multipart/form-data でアップロード
  const form = new FormData();
  form.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);
  form.append('description', description);

  const res = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    headers: { 'X-API-Key': getApiKey() },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ファイルアップロード失敗 (${res.status}): ${text}`);
  }

  const data = (await res.json()) as UploadResult;
  return `${BASE_URL}/files/${data.id}`;
}
