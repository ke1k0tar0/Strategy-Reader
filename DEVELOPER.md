# Developer Guide

Comprehensive guide for extending and maintaining the Strategy Reader system.

## Architecture Overview

The system follows a clean, modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js React)                 │
│  Dashboard → Filters → API Calls → Recommendation Display   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────────┐
│                   API Layer (Route Handler)                 │
│              /api/recommendation (GET)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│            Data Loading & Caching (5-min TTL)               │
│  loadExperimentsWithCache() → NormalizedExperiment[]        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Optimization Pipeline                          │
│  Filter → Score → Group → Rank → Generate Recommendation   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│          External Data Source (Google Sheets API)           │
│  Read experiments → Parse JSON → Normalize → Score          │
└─────────────────────────────────────────────────────────────┘
```

## Module Breakdown

### 1. Sheets Module (`src/sheets/`)

**Responsibility**: Google Sheets API integration

**Key Functions**:

- `fetchSheetData()`: Fetch raw data from Google Sheets
- `getSheetExperiments()`: Get structured experiment data with column mapping

**Important Notes**:

- Handles authentication with Google Sheets API
- Builds column mapping from headers
- Validates required columns exist
- Throws `AppError` on failure

**To extend**:

- Add caching layer (currently minimal)
- Support multiple sheet ranges
- Add incremental sync (only new rows)

```typescript
// Example: Add row validation
function validateRow(row: RawSheetRow): boolean {
  return row["date"] && row["scope"] && row["fills"] !== undefined;
}
```

### 2. Parsers Module (`src/parsers/`)

**Responsibility**: Data parsing and transformation

**Key Functions**:

- `parseParameterJSON()`: Parse JSON parameter sets
- `flattenParameters()`: Flatten nested objects
- `getParameterKeys()`: Extract all parameter keys
- `compareParameterSets()`: Detect parameter changes
- `getParameterStats()`: Calculate parameter statistics

**Important Notes**:

- Handles malformed JSON gracefully
- Validates parameter types
- Supports nested parameter structures

**To extend**:

- Add parameter validation schema
- Support parameter inheritance
- Add parameter aliases
- Track parameter change history

```typescript
// Example: Add parameter validation
const paramSchema = z.object({
  min_ccs: z.number().min(0).max(1),
  max_ccs: z.number().min(0).max(1),
  entry_cap: z.number().positive(),
});

function validateParameters(params: ParameterSet): boolean {
  try {
    paramSchema.parse(params);
    return true;
  } catch {
    return false;
  }
}
```

### 3. Optimization Module (`src/optimization/`)

**Responsibility**: Core optimization algorithms

#### 3a. Filtering (`filtering.ts`)

Filters experiments based on criteria:

- Strategy (required)
- Market condition
- Date range
- Verdict
- Minimum PnL/Fills

**To extend**:

- Add parameter value filters
- Add hypothesis filtering
- Add duration filters
- Add custom filter predicates

#### 3b. Scoring (`scoring.ts`)

Converts outcomes to comparable scores using weighted formula:

```
score = (pnl × 0.5) + (fills × 0.3) - (risk × 0.2)
```

**Key Functions**:

- `calculateExperimentScore()`: Score single experiment
- `scoreExperiments()`: Score all experiments with normalization

**To customize scoring**:

```typescript
// Edit DEFAULT_SCORING_CONFIG
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  pnlWeight: 0.6, // Increase profit weight
  fillsWeight: 0.2, // Decrease fill weight
  riskPenaltyWeight: 0.2, // Keep risk penalty
};
```

**To extend**:

- Add volatility component
- Add sharpe ratio calculation
- Add drawdown penalty
- Add execution speed component

#### 3c. Ranking (`ranking.ts`)

Ranks parameter combinations by performance.

**Key Functions**:

- `groupByParameterSet()`: Group experiments by parameters
- `calculateParameterCombinationStats()`: Calculate aggregate stats
- `rankParameterCombinations()`: Sort by performance
- `findSimilarCombinations()`: Find similar parameters within tolerance
- `calculateConfidence()`: Calculate recommendation confidence

**Ranking Logic**:

1. Primary: Average score (descending)
2. Secondary: Average PnL (descending)
3. Tertiary: Occurrences (descending)

**To extend**:

- Add custom ranking criteria
- Support weighted parameter similarity
- Add novelty bonus (prefer recently tested)
- Add stability scoring (low variance)

```typescript
// Example: Add stability bonus
function rankWithStability(
  stats: ParameterCombinationStats[],
): ParameterCombinationStats[] {
  return stats.sort((a, b) => {
    const scoreA = a.averageScore + calculateStability(a);
    const scoreB = b.averageScore + calculateStability(b);
    return scoreB - scoreA;
  });
}
```

#### 3d. Recommendation (`recommendation.ts`)

Generates final recommendations.

**Pipeline**:

1. Filter experiments by strategy/market
2. Score all experiments
3. Group by parameter set
4. Calculate stats
5. Rank combinations
6. Select top result
7. Generate explanation
8. Format response

**To extend**:

- Support multi-objective optimization (Pareto frontier)
- Add A/B testing recommendations
- Support parameter ranges instead of exact matches
- Add sensitivity analysis

#### 3e. Explanations (`explanations.ts`)

Generates human-readable explanations.

**Current Features**:

- Template-based explanations
- Performance analysis
- Comparative analysis
- Risk assessment

**To extend**:

- Add LLM integration for better explanations
- Generate parameter tuning suggestions
- Explain individual parameter impacts
- Generate trend analysis

```typescript
// Example: Better PnL explanation
function explainPnLTrend(experiments: NormalizedExperiment[]): string {
  const sorted = experiments.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const trend =
    sorted[sorted.length - 1].pnl > sorted[0].pnl ? "improving" : "declining";
  return `PnL trend is ${trend} over the tested period.`;
}
```

### 4. Types Module (`src/types/`)

**Responsibility**: TypeScript type definitions

All types are in `strategy.ts`:

- `StrategyExperiment`: Raw experiment from sheet
- `NormalizedExperiment`: Experiment with score and ID
- `RecommendationResponse`: API response format
- `FilterOptions`: Filtering parameters

**Best Practice**: Keep types in sync with actual data structures.

### 5. Utils Module (`src/utils/`)

#### `errors.ts`

- Custom `AppError` class
- `handleError()` error formatter
- `logger()` logging utility

#### `data.ts`

- Data transformation functions
- Column normalization
- JSON parsing
- Number formatting

#### `dataLoader.ts`

- Data loading pipeline
- In-memory caching (5-minute TTL)
- Complete experiment loading

**To extend caching**:

```typescript
// Add Redis caching
import redis from "redis";

const redisClient = redis.createClient();

export async function loadExperimentsWithCache(): Promise<
  NormalizedExperiment[]
> {
  const cached = await redisClient.get("experiments");
  if (cached) return JSON.parse(cached);

  const data = await loadAllExperiments();
  await redisClient.setex("experiments", 300, JSON.stringify(data)); // 5 min TTL
  return data;
}
```

## Adding New Features

### Example 1: Add Parameter Importance Analysis

```typescript
// src/optimization/parameterImportance.ts

export function calculateParameterImportance(
  experiments: NormalizedExperiment[],
): Record<string, number> {
  const importance: Record<string, number> = {};

  // For each parameter, calculate correlation with score
  const allParams = getParameterKeys(experiments.map((e) => e.parameterSet));

  allParams.forEach((param) => {
    const values = experiments.map((e) => ({
      param: e.parameterSet[param],
      score: e.score,
    }));

    // Calculate correlation
    importance[param] = calculateCorrelation(values);
  });

  return importance;
}
```

### Example 2: Add Backtesting API

```typescript
// src/api/backtest/route.ts

export async function POST(request: NextRequest) {
  const { parameters, startDate, endDate } = await request.json();

  // Call external backtesting service
  const results = await callBacktestingService(parameters, startDate, endDate);

  return NextResponse.json({ data: results });
}
```

### Example 3: Customize Scoring

```typescript
// In src/optimization/scoring.ts

// Add volatility component
function calculateVolatilityPenalty(
  experiments: NormalizedExperiment[],
): number {
  const pnls = experiments.map((e) => e.pnl);
  const mean = pnls.reduce((a, b) => a + b) / pnls.length;
  const variance =
    pnls.reduce((sum, v) => sum + (v - mean) ** 2, 0) / pnls.length;
  return Math.sqrt(variance);
}

// Update scoring function
export function calculateExperimentScore(experiment, config, normalized) {
  // ... existing code ...
  const volatilityPenalty = calculateVolatilityPenalty([experiment]) * 0.1;
  return score - volatilityPenalty;
}
```

## Testing

### Manual Testing

```bash
# Test API endpoint
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon"

# Test with market condition
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&marketCondition=Bearish"
```

### Debug Mode

Add logging:

```typescript
import { logger } from "@/src/utils/errors";

logger("info", "Processing experiments", { count: experiments.length });
logger("warn", "Skipping invalid row", { rowIndex: 5 });
logger("error", "Failed to fetch sheet", error);
```

## Performance Optimization

### 1. Caching Strategy

Current: 5-minute in-memory TTL

Optimize for production:

- Use Redis for distributed caching
- Implement incremental sync
- Cache by strategy + market condition

### 2. Large Dataset Handling

For > 10,000 experiments:

- Add pagination to historical data
- Use streaming responses
- Implement lazy loading

### 3. Computation

For slow scoring:

- Parallelize scoring with worker threads
- Pre-compute daily summaries
- Cache parameter combination stats

## Security Considerations

1. **Credentials**: Never commit `credentials.json`
2. **API Keys**: Use environment variables only
3. **Data Validation**: Always validate external data
4. **Error Messages**: Don't expose internal details in API responses
5. **CORS**: Configure appropriately for production

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

Production `.env` should have:

- Real Google Sheets credentials
- Production API URL
- Error tracking service
- Monitoring/logging service

### Monitoring

Add monitoring for:

- API response times
- Error rates
- Cache hit ratios
- Google Sheets API quotas

## Common Tasks

### Update Scoring Weights

1. Edit `src/optimization/scoring.ts`
2. Modify `DEFAULT_SCORING_CONFIG`
3. Restart dev server

### Add New Column to Sheet

1. Add column to Google Sheet
2. Add to column mapping in `googleSheets.ts`
3. Update type definition if needed
4. Restart server

### Clear Cache

```bash
# In browser console (if you add a debug endpoint):
fetch('/api/cache/clear', { method: 'POST' })
```

Or programmatically:

```typescript
import { clearExperimentsCache } from "@/src/utils/dataLoader";
clearExperimentsCache();
```

## Debugging Tips

### 1. Check Raw Data

Add temporary logging in `dataLoader.ts`:

```typescript
const experiments = await loadAllExperiments();
console.log(JSON.stringify(experiments[0], null, 2));
```

### 2. Monitor API Calls

In browser DevTools → Network tab, check:

- Request parameters
- Response status
- Response data structure

### 3. Validate JSON

Test parameter JSON in console:

```javascript
JSON.parse('{"min_ccs": 0.55, "max_ccs": 0.67}');
```

### 4. Check Sheet Access

Test in Node REPL:

```bash
node
> const { getSheetExperiments } = require('./src/sheets/googleSheets');
> getSheetExperiments().then(data => console.log(data.headers))
```

## Code Style

- Use TypeScript strict mode
- Use async/await (not promises)
- Add JSDoc comments for public functions
- Keep functions small and focused
- Use descriptive variable names
- Avoid deeply nested code

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Zod Documentation](https://zod.dev)

---

Questions? Check the main README.md or create an issue in your project repository.
