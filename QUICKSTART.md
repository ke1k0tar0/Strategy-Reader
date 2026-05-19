# Quick Start Guide

Get the Strategy Reader running in 5 minutes.

## Prerequisites

- Node.js 18+
- Google Account with Google Sheets access
- Google Cloud Project with Sheets API enabled

## Steps

### 1. Clone and Install

```bash
cd "d:\Projects\Strategy Reader"
npm install
```

### 2. Set Up Google Sheets API (5 minutes)

#### A. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **Google Sheets API**
4. Create a **Service Account**:
   - Navigation: APIs & Services → Service Accounts
   - Click "Create Service Account"
   - Name: "strategy-reader"
   - Click "Create and Continue"
5. Create JSON Key:
   - Select your service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON"
   - A file will download automatically

#### B. Place Credentials

```bash
# Move the downloaded file to project root
cp ~/Downloads/strategy-reader-*.json credentials.json
```

### 3. Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Add these column headers in the first row:

```
Date | Scope | Parameter Set (JSON snapshot) | Hypothesis | Change | Stop conditions (capital safety) | Success metric | Duration | Market Conditions (vol regime) | Fills | PnL | Top 3 Gate Reasons | Verdict | Notes
```

4. Add your experiment data (see example below)
5. Copy the Sheet ID from the URL

### 4. Configure Environment

Create `.env.local`:

```env
GOOGLE_SHEETS_CREDENTIALS_PATH=credentials.json
GOOGLE_SHEET_ID=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P
GOOGLE_SHEET_RANGE=Sheet1!A:N
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Replace `GOOGLE_SHEET_ID` with your actual sheet ID.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Example Data

Add this to your Google Sheet:

| Date       | Scope      | Parameter Set                                        | Hypothesis            | Change            | Market Conditions | Fills | PnL  | Verdict |
| ---------- | ---------- | ---------------------------------------------------- | --------------------- | ----------------- | ----------------- | ----- | ---- | ------- |
| 2024-01-15 | 1H Horizon | {"min_ccs": 0.55, "max_ccs": 0.67, "entry_cap": 242} | Test lower threshold  | Reduced min_ccs   | Bearish           | 85.5  | 2.35 | Success |
| 2024-01-16 | 1H Horizon | {"min_ccs": 0.60, "max_ccs": 0.65, "entry_cap": 250} | Standard config       | No change         | Bearish           | 87.2  | 3.10 | Success |
| 2024-01-17 | 1H Horizon | {"min_ccs": 0.70, "max_ccs": 0.80, "entry_cap": 200} | Test higher threshold | Increased min_ccs | Bullish           | 65.0  | 1.50 | Poor    |

**Note:** Make sure parameters are valid JSON in the "Parameter Set" column.

## Share Sheet with Service Account

1. Copy the service account email from `credentials.json` (the `client_email` field)
2. Open your Google Sheet
3. Click "Share"
4. Paste the service account email
5. Give "Viewer" access
6. Click "Share"

## Try It Out

1. Open [http://localhost:3000](http://localhost:3000)
2. Select a strategy from the dropdown
3. Click "Get Recommendation"
4. View the optimization results

## Troubleshooting

### "Credentials not found"

- Ensure `credentials.json` is in the project root
- Check file name is exactly `credentials.json`

### "Sheet ID invalid"

- Copy the ID from the URL between `/d/` and `/edit`
- Example: `https://docs.google.com/spreadsheets/d/ABC123/edit` → ID is `ABC123`

### "No data found"

- Verify the sheet has headers in the first row
- Ensure data starts in row 2
- Check that "Date", "Scope", "Parameter Set", "Fills", and "PnL" columns exist

### "Invalid JSON in parameters"

- Check that JSON in "Parameter Set" column is valid
- Use a JSON validator: [jsonlint.com](https://www.jsonlint.com)
- Example valid JSON: `{"param1": 0.5, "param2": 100}`

## Next Steps

- ✅ Customize the scoring algorithm in `src/optimization/scoring.ts`
- ✅ Add more filter options in `src/components/FilterControls.tsx`
- ✅ Customize the explanation engine in `src/optimization/explanations.ts`
- ✅ Deploy to production with `npm run build && npm start`

## Documentation

- Full setup: See [README.md](README.md)
- API reference: See [README.md#api-reference](README.md#api-reference)
- Architecture: See [README.md#project-structure](README.md#project-structure)

---

Questions? Check the main README.md or troubleshooting section.
