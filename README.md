# Trading Strategy Optimization Recommendation Engine

A production-quality MVP web application for analyzing trading strategy experiments and recommending optimal parameter sets.

## Overview

The **Strategy Reader** system reads strategy experiment data from Google Sheets, analyzes historical parameter performance, and recommends the currently optimal parameter configuration for specific market conditions.

### Key Features

- ✅ **Google Sheets Integration**: Reads experiment data directly from Google Sheets API
- ✅ **Parameter Analysis**: Parses JSON parameter snapshots and analyzes performance
- ✅ **Deterministic Scoring**: Weighted scoring algorithm (no ML complexity)
- ✅ **Smart Recommendations**: Identifies best-performing parameter combinations with confidence scores
- ✅ **Clean Dashboard**: Modern React UI for viewing recommendations and historical data
- ✅ **Type-Safe**: Full TypeScript with strict mode enabled
- ✅ **Modular Architecture**: Clean separation of concerns for easy extension

## Tech Stack

### Frontend

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS** (styling)

### Backend

- **Node.js**
- **TypeScript**
- **Next.js API Routes**
- **Google Sheets API**

### Validation & Analytics

- **Zod** (runtime type validation)
- **simple-statistics** (optional, for statistical analysis)

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Dashboard page
│   └── api/
│       └── recommendation/       # API routes
│           └── route.ts         # GET /api/recommendation
│
├── components/                   # React components
│   ├── RecommendationCard.tsx   # Recommendation display
│   ├── HistoricalDataTable.tsx  # Data table
│   ├── FilterControls.tsx       # Filter UI
│   ├── ErrorAlert.tsx           # Error display
│   └── LoadingSkeleton.tsx      # Loading states
│
├── sheets/                       # Google Sheets integration
│   └── googleSheets.ts          # Sheets API client
│
├── parsers/                      # Data parsing
│   └── parameterParser.ts       # JSON parameter parsing
│
├── optimization/                 # Optimization engines
│   ├── filtering.ts             # Data filtering
│   ├── scoring.ts               # Scoring algorithm
│   ├── ranking.ts               # Parameter ranking
│   ├── recommendation.ts        # Recommendation generation
│   └── explanations.ts          # Explanation templates
│
├── types/                        # TypeScript types
│   └── strategy.ts              # Core type definitions
│
├── utils/                        # Utilities
│   ├── data.ts                  # Data transformation
│   ├── errors.ts                # Error handling
│   └── dataLoader.ts            # Data loading pipeline
│
└── styles/
    └── globals.css              # TailwindCSS styles
```

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Google Sheets API** credentials
- **Google Sheet** with experiment data

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Sheets API

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Sheets API**
4. Create a **Service Account**:
   - Go to **Service Accounts**
   - Create a new service account
   - Generate a JSON key
   - Download the key file as `credentials.json`

#### Step 2: Share Your Google Sheet

1. Share your Google Sheet with the service account email address
2. Note the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   ```

### 3. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Path to Google Sheets credentials JSON file
GOOGLE_SHEETS_CREDENTIALS_PATH=credentials.json

# Your Google Sheet ID
GOOGLE_SHEET_ID=your_sheet_id_here

# Sheet range (adjust as needed)
GOOGLE_SHEET_RANGE=Sheet1!A:N

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Prepare Your Google Sheet

Your Google Sheet should have these columns (order doesn't matter):

| Column                           | Description           | Example                            |
| -------------------------------- | --------------------- | ---------------------------------- |
| Date                             | Experiment date       | 2024-01-15                         |
| Scope                            | Strategy identifier   | 1H Horizon                         |
| Parameter Set (JSON snapshot)    | JSON parameters       | {"min_ccs": 0.55, "max_ccs": 0.67} |
| Hypothesis                       | Reason for test       | Test lower entry threshold         |
| Change                           | Description of change | Reduced min_ccs from 0.60 to 0.55  |
| Stop conditions (capital safety) | Risk limits           | Max drawdown 2%                    |
| Success metric                   | Expected outcome      | Increase fill rate                 |
| Duration                         | Test duration         | 1 hour                             |
| Market Conditions (vol regime)   | Market state          | Bearish                            |
| Fills                            | Fill percentage       | 87.5                               |
| PnL                              | Profit/Loss           | 3.25                               |
| Top 3 Gate Reasons               | Main blockers         | Slippage, Timing                   |
| Verdict                          | Test result           | Success                            |
| Notes                            | Additional notes      | Good performance                   |

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

### 6. Build for Production

```bash
npm run build
npm start
```

## API Reference

### GET /api/recommendation

Generates an optimization recommendation for a strategy.

#### Query Parameters

| Parameter         | Required | Type   | Description                                  |
| ----------------- | -------- | ------ | -------------------------------------------- |
| `strategy`        | Yes      | string | Strategy identifier (matches "Scope" column) |
| `marketCondition` | No       | string | Market condition filter                      |
| `minPnL`          | No       | number | Minimum PnL threshold                        |
| `minFills`        | No       | number | Minimum fill rate threshold                  |

#### Example Request

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&marketCondition=Bearish"
```

#### Example Response

```json
{
  "data": {
    "strategy": "1H Horizon",
    "marketCondition": "Bearish",
    "recommendedParameters": {
      "min_ccs": 0.60,
      "max_ccs": 0.65,
      "entry_cap": 250
    },
    "confidence": 0.78,
    "expectedPnL": 3.1,
    "expectedFillRate": 87.2,
    "sampleSize": 42,
    "explanation": "This parameter set has been tested 42 times with consistent results...",
    "historicalDataPoints": [
      {
        "id": "2024-01-15-1h-horizon-0",
        "date": "2024-01-15",
        "scope": "1H Horizon",
        "pnl": 3.25,
        "fills": 88.5,
        "score": 0.85,
        "verdict": "Success",
        ...
      }
    ]
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## Scoring Algorithm

The recommendation engine uses deterministic weighted scoring:

```
score = (normalized_pnl × 0.5) + (normalized_fills × 0.3) - (risk_penalty × 0.2)
```

### Components

- **PnL Component** (50% weight): Profitability of the strategy
- **Fills Component** (30% weight): Order fill rate
- **Risk Penalty** (20% weight): Penalizes low fills and failed verdicts

### Normalization

Values are normalized to 0-1 using min-max normalization across all experiments:

```
normalized_value = (value - min) / (max - min)
```

## Confidence Score

Confidence is calculated from three factors:

- **Frequency** (40%): How many times this parameter set was tested
- **Consistency** (30%): Low variance in results (exponential decay)
- **Performance** (30%): Overall optimization score quality

## Caching

The system implements 5-minute in-memory caching for Google Sheets data to minimize API calls.

To clear the cache programmatically:

```typescript
import { clearExperimentsCache } from "@/src/utils/dataLoader";
clearExperimentsCache();
```

## Error Handling

The system handles:

- Missing or invalid Google Sheets credentials
- Malformed JSON parameter sets
- Missing required columns
- Invalid numeric data
- Empty or incomplete experiments

All errors are logged and returned with descriptive messages to the frontend.

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Development Server with Hot Reload

```bash
npm run dev
```

## Future Enhancements (Not MVP)

Possible future additions:

- PostgreSQL database for persistence
- ML-based prediction models
- Bayesian optimization
- Automated backtesting integration
- Live trading execution
- Multi-user authentication
- Advanced parameter heatmaps
- Real-time websocket updates
- Vector embeddings for notes analysis

## Project Principles

This MVP was built following these principles:

✅ **Simplicity**: No unnecessary abstraction
✅ **Determinism**: Predictable, rule-based logic
✅ **Modularity**: Independent, reusable components
✅ **Readability**: Clear code with helpful comments
✅ **Extensibility**: Easy to add new features
✅ **AI-Friendly**: Clean structure for future ML integration

## Troubleshooting

### "Google Sheets credentials not found"

- Ensure `credentials.json` exists in the project root
- Check `GOOGLE_SHEETS_CREDENTIALS_PATH` in `.env.local`

### "No data found in Google Sheet"

- Verify the sheet ID is correct
- Ensure the sheet contains data with proper headers
- Check that the service account has read access

### "Invalid parameter JSON"

- Verify JSON in "Parameter Set" column is valid
- Malformed rows are skipped with warnings in logs
- Check the browser console for detailed error messages

### "No recommendations found"

- Ensure you have enough experiments for the selected strategy
- Check that "Scope", "Fills", and "PnL" columns have valid data
- Try adjusting filters (remove minPnL/minFills constraints)

## Performance

The system is designed for:

- Up to ~10,000 experiments
- Recommendation generation < 3 seconds
- Lightweight memory usage
- No heavy computation

## Security

- Google Sheets credentials are stored locally (`.env.local`)
- Credentials are not exposed to the frontend
- Only the service account email is stored in code
- Use environment variables for sensitive data

## License

This project is built as a demonstration. Adapt as needed for your use case.

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review the logs in the terminal
3. Verify Google Sheets API setup
4. Ensure all required fields are present in the sheet

---

Built with ❤️ for quantitative trading analysis.
