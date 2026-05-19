/**
 * Core type definitions for the Strategy Reader system
 */

/**
 * Raw strategy experiment from Google Sheets
 */
export interface StrategyExperiment {
  date: string;
  scope: string; // Strategy identifier
  parameterSet: Record<string, unknown>; // Parsed JSON
  hypothesis: string;
  change: string;
  stopConditions: string;
  successMetric: string;
  duration: string;
  marketConditions: string; // vol regime
  fills: number; // percentage
  pnl: number; // profit and loss
  topGateReasons: string;
  verdict: string;
  notes: string;
  // Additional computed fields
  rowIndex?: number;
  rawRow?: Record<string, unknown>;
}

/**
 * Normalized strategy experiment after parsing
 */
export interface NormalizedExperiment extends StrategyExperiment {
  id: string; // Generated ID from date + scope + index
  score: number; // Computed optimization score
}

/**
 * Parameter set configuration
 */
export interface ParameterSet {
  [key: string]: number | string | boolean;
}

/**
 * Scoring configuration
 */
export interface ScoringConfig {
  pnlWeight: number;
  fillsWeight: number;
  riskPenaltyWeight: number;
}

/**
 * Recommendation response
 */
export interface RecommendationResponse {
  strategy: string;
  marketCondition?: string;
  recommendedParameters: ParameterSet;
  confidence: number; // 0-1
  expectedPnL: number;
  expectedFillRate: number; // 0-100
  sampleSize: number; // Number of experiments used
  explanation: string;
  historicalDataPoints: NormalizedExperiment[];
}

/**
 * Filtering options
 */
export interface FilterOptions {
  strategy: string;
  marketCondition?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  verdict?: string;
  minPnL?: number;
  minFills?: number;
}

/**
 * Raw row from Google Sheets
 */
export interface RawSheetRow {
  [key: string]: unknown;
}

/**
 * Parsed sheet data
 */
export interface SheetData {
  experiments: NormalizedExperiment[];
  lastUpdated: Date;
  rowCount: number;
}

/**
 * Parameter analysis result
 */
export interface ParameterAnalysis {
  parameter: string;
  value: string | number;
  occurrences: number;
  averagePnL: number;
  averageFills: number;
  averageScore: number;
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * API Success response
 */
export interface ApiSuccessResponse<T> {
  data: T;
  timestamp: string;
}
