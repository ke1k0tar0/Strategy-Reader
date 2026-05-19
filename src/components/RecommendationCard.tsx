/**
 * Recommendation Card Component
 * Displays the recommended parameters and key metrics
 */

"use client";

import { RecommendationResponse } from "@/src/types/strategy";

interface RecommendationCardProps {
  recommendation: RecommendationResponse;
  loading?: boolean;
}

export function RecommendationCard({
  recommendation,
  loading = false,
}: RecommendationCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Recommended Parameters
        </h2>
        {recommendation.marketCondition && (
          <p className="text-slate-600">
            Market Condition: {recommendation.marketCondition}
          </p>
        )}
      </div>

      {/* Parameters Grid */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-semibold text-slate-700">
                Parameter
              </th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(recommendation.recommendedParameters).map(
              ([key, value]) => (
                <tr
                  key={key}
                  className="border-b border-slate-100 hover:bg-slate-100"
                >
                  <td className="py-2 px-3 text-slate-700">{key}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {typeof value === "number" ? value.toFixed(4) : value}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Expected PnL</div>
          <div className="text-2xl font-bold text-green-600">
            {recommendation.expectedPnL.toFixed(2)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Expected Fill Rate</div>
          <div className="text-2xl font-bold text-blue-600">
            {recommendation.expectedFillRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Confidence Score</div>
          <div className="text-2xl font-bold text-purple-600">
            {(recommendation.confidence * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Sample Size</div>
          <div className="text-2xl font-bold text-orange-600">
            {recommendation.sampleSize}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-800 mb-2">Analysis</h3>
        <p className="text-slate-700 leading-relaxed">
          {recommendation.explanation}
        </p>
      </div>
    </div>
  );
}
