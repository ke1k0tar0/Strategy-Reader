# API Documentation

Complete API reference for the Strategy Reader system.

## Base URL

```
http://localhost:3000      # Development
https://yourdomain.com     # Production
```

## Authentication

Currently, the API is unauthenticated (no API keys required). In production, you may want to add authentication.

## Endpoints

### GET /api/recommendation

Get optimization recommendation for a trading strategy.

#### Request

**Method**: `GET`

**Query Parameters**:

| Parameter         | Required | Type   | Default | Description                                    |
| ----------------- | -------- | ------ | ------- | ---------------------------------------------- |
| `strategy`        | Yes      | string | -       | Strategy identifier (matches "Scope" in sheet) |
| `marketCondition` | No       | string | -       | Market condition filter                        |
| `minPnL`          | No       | number | -       | Minimum PnL threshold                          |
| `minFills`        | No       | number | -       | Minimum fill rate threshold (0-100)            |

#### Example Requests

**Basic Request**

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon"
```

**With Market Condition**

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&marketCondition=Bearish"
```

**With Filters**

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&marketCondition=Bearish&minPnL=2&minFills=80"
```

**JavaScript/Fetch**

```javascript
const response = await fetch(
  "/api/recommendation?strategy=1H%20Horizon&marketCondition=Bearish",
);
const data = await response.json();
console.log(data.data.recommendedParameters);
```

**TypeScript**

```typescript
import type { RecommendationResponse } from "@/src/types/strategy";

const response = await fetch(
  `/api/recommendation?strategy=1H%20Horizon&marketCondition=Bearish`,
);
const { data } = await response.json();
const recommendation: RecommendationResponse = data;
```

#### Response

**Success (HTTP 200)**

```json
{
  "data": {
    "strategy": "1H Horizon",
    "marketCondition": "Bearish",
    "recommendedParameters": {
      "min_ccs": 0.6,
      "max_ccs": 0.65,
      "entry_cap": 250,
      "stop_loss": 0.02
    },
    "confidence": 0.78,
    "expectedPnL": 3.1,
    "expectedFillRate": 87.2,
    "sampleSize": 42,
    "explanation": "This parameter set has been tested 42 times with consistent results. Historically, it has produced an average PnL of 3.10 and a 87.2% fill rate. Under Bearish market conditions, this configuration has proven effective. It outperforms the second-best configuration by approximately 12.5% in overall score. Based on 42 test results, this recommendation has high statistical support.",
    "historicalDataPoints": [
      {
        "id": "2024-01-15-1h-horizon-0",
        "date": "2024-01-15",
        "scope": "1H Horizon",
        "parameterSet": {
          "min_ccs": 0.6,
          "max_ccs": 0.65,
          "entry_cap": 250,
          "stop_loss": 0.02
        },
        "hypothesis": "Test standard config",
        "change": "No change",
        "stopConditions": "Max drawdown 2%",
        "successMetric": "Increase fill rate",
        "duration": "1 hour",
        "marketConditions": "Bearish",
        "fills": 87.5,
        "pnl": 3.25,
        "topGateReasons": "Slippage",
        "verdict": "Success",
        "notes": "Good performance under bearish conditions",
        "score": 0.85
      }
      // ... more data points
    ]
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

**Error (HTTP 400/404/500)**

```json
{
  "error": "No experiments found for strategy: Unknown Strategy",
  "code": "NO_DATA"
}
```

#### Response Fields

**Root Object**

| Field       | Type   | Description         |
| ----------- | ------ | ------------------- |
| `data`      | object | Recommendation data |
| `timestamp` | string | ISO 8601 timestamp  |

**Recommendation Data**

| Field                   | Type                | Description                                     |
| ----------------------- | ------------------- | ----------------------------------------------- |
| `strategy`              | string              | Strategy identifier                             |
| `marketCondition`       | string \| undefined | Market condition used                           |
| `recommendedParameters` | object              | Recommended parameter values                    |
| `confidence`            | number              | Confidence score (0-1)                          |
| `expectedPnL`           | number              | Average expected profit/loss                    |
| `expectedFillRate`      | number              | Expected fill rate (0-100)                      |
| `sampleSize`            | number              | Number of experiments supporting recommendation |
| `explanation`           | string              | Human-readable explanation                      |
| `historicalDataPoints`  | array               | Supporting experiment data                      |

**Parameter Set Object**

```json
{
  "min_ccs": 0.6,
  "max_ccs": 0.65,
  "entry_cap": 250,
  "stop_loss": 0.02
}
```

Keys vary based on your strategy parameters. All values are numbers or strings.

**Historical Data Point (NormalizedExperiment)**

| Field              | Type   | Description                   |
| ------------------ | ------ | ----------------------------- |
| `id`               | string | Unique experiment ID          |
| `date`             | string | Experiment date (YYYY-MM-DD)  |
| `scope`            | string | Strategy identifier           |
| `parameterSet`     | object | Parameters used               |
| `fills`            | number | Fill percentage (0-100)       |
| `pnl`              | number | Profit/loss value             |
| `score`            | number | Calculated optimization score |
| `verdict`          | string | Experiment verdict            |
| `marketConditions` | string | Market condition              |
| `hypothesis`       | string | Original hypothesis           |
| `duration`         | string | Test duration                 |
| ...                |        | All other experiment fields   |

#### Status Codes

| Code | Meaning      | Reason                                 |
| ---- | ------------ | -------------------------------------- |
| 200  | OK           | Recommendation generated successfully  |
| 400  | Bad Request  | Missing strategy or invalid parameters |
| 404  | Not Found    | No experiments found for strategy      |
| 500  | Server Error | Unexpected server error                |

#### Error Codes

| Code                    | Description                             |
| ----------------------- | --------------------------------------- |
| `NO_DATA`               | No experiments found for given filters  |
| `INVALID_PARAMETER`     | Query parameter validation failed       |
| `MISSING_COLUMNS`       | Google Sheet missing required columns   |
| `FETCH_FAILED`          | Failed to fetch from Google Sheets      |
| `RECOMMENDATION_FAILED` | Failed during recommendation generation |
| `UNKNOWN_ERROR`         | Unexpected error occurred               |

---

## Common Use Cases

### Get Recommendation for Strategy

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon"
```

### Get Recommendation for Specific Market Condition

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&marketCondition=Bearish"
```

### Get High-Confidence Recommendations Only

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&minPnL=2"
```

### Filter by Fill Rate

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&minFills=85"
```

### Combined Filters

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon&marketCondition=Bullish&minPnL=1&minFills=80"
```

---

## Rate Limiting

Currently unlimited. In production, consider adding:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705756800
```

---

## CORS Headers

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Caching

Responses are cached for 5 minutes. Cache is cleared:

- When new data is added to Google Sheet
- When application restarts
- Programmatically via `clearExperimentsCache()`

---

## Performance

| Metric              | Typical   | Max               |
| ------------------- | --------- | ----------------- |
| Response Time       | 200-500ms | <3s               |
| Payload Size        | 10-50KB   | 500KB             |
| Concurrent Requests | 100+      | Limited by server |

---

## Examples by Language

### cURL

```bash
curl "http://localhost:3000/api/recommendation?strategy=1H%20Horizon"
```

### JavaScript (Fetch API)

```javascript
const strategy = "1H Horizon";
const marketCondition = "Bearish";

const response = await fetch(
  `/api/recommendation?strategy=${encodeURIComponent(strategy)}&marketCondition=${encodeURIComponent(marketCondition)}`,
);

if (!response.ok) {
  const error = await response.json();
  console.error("Error:", error.error);
  return;
}

const { data } = await response.json();
console.log("Recommended Parameters:", data.recommendedParameters);
console.log("Confidence:", `${(data.confidence * 100).toFixed(1)}%`);
console.log("Expected PnL:", data.expectedPnL);
```

### Python

```python
import requests
import json

strategy = "1H Horizon"
market_condition = "Bearish"

params = {
    "strategy": strategy,
    "marketCondition": market_condition
}

response = requests.get("http://localhost:3000/api/recommendation", params=params)

if response.status_code == 200:
    data = response.json()
    recommendation = data['data']
    print(f"Recommended Parameters: {json.dumps(recommendation['recommendedParameters'], indent=2)}")
    print(f"Confidence: {recommendation['confidence']:.1%}")
else:
    print(f"Error: {response.json()['error']}")
```

### Node.js

```javascript
const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/recommendation?strategy=1H%20Horizon",
  method: "GET",
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    const response = JSON.parse(data);
    console.log(response.data);
  });
});

req.on("error", (error) => console.error(error));
req.end();
```

### Excel/Power BI

```
=WEBSERVICE("http://localhost:3000/api/recommendation?strategy=1H%20Horizon")
```

Then parse the JSON response.

---

## Future Endpoints (Planned)

### POST /api/recommendation/explain

Get detailed explanation for a parameter set.

```bash
curl -X POST http://localhost:3000/api/recommendation/explain \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {"min_ccs": 0.60, "max_ccs": 0.65},
    "strategy": "1H Horizon"
  }'
```

### GET /api/strategies

List all available strategies.

```bash
curl http://localhost:3000/api/strategies
```

### GET /api/market-conditions

List all available market conditions.

```bash
curl http://localhost:3000/api/market-conditions
```

---

## Troubleshooting

**Issue**: `404 Not Found`
**Solution**: Verify the strategy name matches exactly (case-sensitive)

**Issue**: Empty `historicalDataPoints`
**Solution**: Recommendation may be based on only 1 experiment

**Issue**: High-latency response
**Solution**: Data is being fetched from Google Sheets (normal first call)

**Issue**: `401 Unauthorized`
**Solution**: Add authentication before going to production

---

## Support

For API issues:

1. Check query parameters are URL-encoded
2. Verify strategy name matches sheet data
3. Check Google Sheets connection
4. Review error code and message
5. Check server logs for details

---

Last Updated: January 2024
