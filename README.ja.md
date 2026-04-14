# 経費申請Bot

[English version here](README.md)

Discord のチャンネル内で使う、サークル向け経費申請Bot。  
スラッシュコマンドで申請フォームを表示し、承認者がボタンで承認/却下する。

---

## 技術スタック

| 要素 | 選択 |
|------|------|
| 言語 | TypeScript |
| Discord連携 | discord.js v14 |
| 一時DB | SQLite（better-sqlite3） |
| 台帳 | Google Spreadsheet（googleapis） |
| 認証 | Google サービスアカウント |

---

## ディレクトリ構成

```
expense-bot/
├── src/
│   ├── index.ts          # エントリーポイント・Bot起動
│   ├── expense.ts        # コマンド・モーダル・ボタン処理
│   └── services/
│       ├── database.ts   # SQLite CRUD
│       └── sheets.ts     # スプレッドシート追記
├── credentials.json      # Google サービスアカウントキー（要配置）
├── .env                  # 環境変数（要作成）
├── package.json
└── tsconfig.json
```

---

## セットアップ

### 1. パッケージインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、値を入力する。

```bash
cp .env.example .env
```

| 変数名 | 内容 |
|--------|------|
| `DISCORD_TOKEN` | BotのDiscordトークン |
| `SPREADSHEET_ID` | スプレッドシートURL中の `/d/【ここ】/edit` の部分 |
| `APPROVAL_ROLE_ID` | 承認権限を持つロールのID（数字） |
| `GUILD_ID` | 開発時のみ設定。ギルド登録で即時反映される |

### 3. Google API の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. **Google Sheets API** と **Google Drive API** を有効化
3. サービスアカウントを作成 → JSON キーをダウンロード → `credentials.json` として配置
4. 対象スプレッドシートをサービスアカウントの `client_email` に **編集者** として共有

### 4. スプレッドシートのヘッダー設定

1行目に以下のヘッダーを手動で追加する。

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 申請日時 | 申請者 | 金額 | 用途・目的 | 領収書 | ステータス | 承認者 | 承認日時 |

### 5. Discord Developer Portal の設定

Bot > **Privileged Gateway Intents** にて `MESSAGE CONTENT INTENT` を ON にする。

---

## 起動

### 開発時

```bash
npm run dev
```

### 本番時

```bash
npm run build
npm start
```

---

## 使い方

1. チャンネルで `/request` を実行
2. フォームに金額・用途を入力して送信
3. 領収書（画像・PDF）を添付するよう案内が表示される（スキップ可）
4. チャンネルに申請Embedが投稿される
5. 承認ロールを持つメンバーが **承認** または **却下** ボタンを押す
   - 承認 → スプレッドシートに記録・Embedが緑色に
   - 却下 → スプレッドシートに記録なし・Embedが赤色に

### SQLの確認方法

**コマンドライン:**
```bash
sqlite3 expense.db
SELECT * FROM expenses;
.quit
```

**GUI:** [DB Browser for SQLite](https://sqlitebrowser.org/) — Excelのように表形式で閲覧・編集できる

---

## 注意事項

- スラッシュコマンドの反映には初回起動後、最大1時間かかる場合がある。開発時は `GUILD_ID` を設定すると即時反映される。
- Bot を再起動してもボタンは引き続き機能する（Persistent View）。
- `expense.db` はBot起動時に自動生成されるため、事前の設定・作成は不要。

## 領収書ファイルの保存先

領収書ファイルは `files.c-lab.works` にアップロードされる。これは個人が運営する非公式のファイル置き場であり、商用サービスや公式サポートのある基盤ではない。長期的なデータ保持や稼働保証はない。利用するには `.env` に `FILES_API_KEY` を設定すること。
