# Expense Request Bot

[日本語版はこちら](README.ja.md)

A Discord bot for club/circle expense requests.  
Submit expense forms via slash command, and approvers can approve or reject with buttons.

---

## Tech Stack

| | |
|---|---|
| Language | TypeScript |
| Discord | discord.js v14 |
| Temporary DB | SQLite (better-sqlite3) |
| Ledger | Google Spreadsheet (googleapis) |
| Auth | Google Service Account |

---

## Directory Structure

```
expense-bot/
├── src/
│   ├── index.ts          # Entry point
│   ├── expense.ts        # Command, modal, button handlers
│   └── services/
│       ├── database.ts   # SQLite CRUD
│       └── sheets.ts     # Spreadsheet writer
├── credentials.json      # Google service account key (place manually)
├── .env                  # Environment variables (create manually)
├── package.json
└── tsconfig.json
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord bot token |
| `SPREADSHEET_ID` | The ID in the spreadsheet URL: `/d/【here】/edit` |
| `APPROVAL_ROLE_ID` | Role ID with approval permission (numeric) |
| `GUILD_ID` | *(Dev only)* Guild ID for instant command registration |

### 3. Google API setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Sheets API** and **Google Drive API**
3. Create a service account → download the JSON key → place it as `credentials.json`
4. Share the target spreadsheet with the service account's `client_email` as **Editor**

### 4. Spreadsheet headers

Manually add the following headers in row 1.

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Applied At | Applicant | Amount | Purpose | Receipt | Status | Approver | Approved At |

### 5. Discord Developer Portal

Go to Bot > **Privileged Gateway Intents** and enable `MESSAGE CONTENT INTENT`.

---

## Running the Bot

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

---

## How It Works

1. Run `/request` in any channel
2. Fill in the amount and purpose in the form
3. A prompt appears asking you to attach a receipt image or PDF (skippable)
4. An expense embed is posted to the channel
5. A member with the approval role clicks **Approve** or **Reject**
   - Approve → recorded in the spreadsheet, embed turns green
   - Reject → not recorded, embed turns red

### Viewing the SQLite database

**CLI:**
```bash
sqlite3 expense.db
SELECT * FROM expenses;
.quit
```

**GUI:** [DB Browser for SQLite](https://sqlitebrowser.org/)

---

## Notes

- Slash commands via global registration can take up to 1 hour to appear. Set `GUILD_ID` in `.env` for instant registration during development.
- Buttons remain functional after bot restarts (Persistent View).
- `expense.db` is created automatically on first launch — no manual setup needed.

## Receipt File Storage

Receipt files are uploaded to `files.c-lab.works`, a privately operated file storage service, not a commercially managed or officially supported system. Availability and long-term data retention are not guaranteed. Set `FILES_API_KEY` in `.env` to enable uploads.
