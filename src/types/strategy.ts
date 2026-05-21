/**
 * Core type definitions for the Strategy Reader system
 */

export interface StrategyExperiment {
  date: string;
  scope: string;
  parameterSet: Record<string, unknown>;
  hypothesis: string;
  change: string;
  stopConditions: string;
  successMetric: string;
  duration: string;
  marketConditions: string;
  fills: number;
  pnl: number;
  topGateReasons: string;
  verdict: string;
  notes: string;
  rowIndex?: number;
  rawRow?: Record<string, unknown>;
}

export interface NormalizedExperiment extends StrategyExperiment {
  id: string;
  score: number;
}

export interface ParameterSet {
  [key: string]: number | string | boolean;
}

export interface ScoringConfig {
  pnlWeight: number;
  fillsWeight: number;
  riskPenaltyWeight: number;
}

export interface RecommendationResponse {
  strategy: string;
  marketCondition?: string;
  recommendedParameters: ParameterSet;
  confidence: number;
  expectedPnL: number;
  expectedFillRate: number;
  sampleSize: number;
  explanation: string;
  aiExplanation?: string; // <-- NEW FIELD FOR GEMINI INSIGHTS
  historicalDataPoints: NormalizedExperiment[];
}

export interface FilterOptions {
  strategy: string;
  marketCondition?: string;
  date?: string; // <-- New exact date filter added here
  dateRange?: {
    start: string;
    end: string;
  };
  verdict?: string;
  minPnL?: number;
  minFills?: number;
}

export interface RawSheetRow {
  [key: string]: unknown;
}

export interface SheetData {
  experiments: NormalizedExperiment[];
  lastUpdated: Date;
  rowCount: number;
}

export interface ParameterAnalysis {
  parameter: string;
  value: string | number;
  occurrences: number;
  averagePnL: number;
  averageFills: number;
  averageScore: number;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  data: T;
  timestamp: string;
}
