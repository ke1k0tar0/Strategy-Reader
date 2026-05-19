/**
 * Historical Data Table Component
 * Displays the experiments that support the recommendation
 */

"use client";

import { NormalizedExperiment } from "@/src/types/strategy";

interface HistoricalDataTableProps {
  experiments: NormalizedExperiment[];
}

export function HistoricalDataTable({ experiments }: HistoricalDataTableProps) {
  if (experiments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4">
        Historical Supporting Data
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Market
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                PnL
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Fills
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Score
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Verdict
              </th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp) => (
              <tr
                key={exp.id}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-slate-700">{exp.date}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {exp.marketConditions.substring(0, 20)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-semibold ${
                    exp.pnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {exp.pnl.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">
                  {exp.fills.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-600">
                  {exp.score.toFixed(3)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      exp.verdict.toLowerCase().includes("success")
                        ? "bg-green-100 text-green-800"
                        : exp.verdict.toLowerCase().includes("fail")
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {exp.verdict.substring(0, 12)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
