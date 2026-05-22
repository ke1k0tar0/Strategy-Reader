/**
 * AI Analysis Engine
 * Uses Google's Gemini API to act as the sole optimization engine
 */

import { NormalizedExperiment } from "@/src/types/strategy";
import { logger, AppError } from "@/src/utils/errors";

export async function generateAIAnalysis(
  experiments: NormalizedExperiment[],
  strategyName: string,
): Promise<any> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new AppError(
        "API_KEY_MISSING",
        "GEMINI_API_KEY is not configured in environment variables.",
        500,
      );
    }

    const analysisData = experiments.map((exp) => ({
      id: exp.id,
      date: exp.date,
      hypothesis: exp.hypothesis,
      change: exp.change,
      stopConditions: exp.stopConditions,
      successMetric: exp.successMetric,
      duration: exp.duration,
      marketConditions: exp.marketConditions,
      topGateReasons: exp.topGateReasons,
      verdict: exp.verdict,
      parameters: exp.parameterSet,
      pnl: exp.pnl,
      fills: `${exp.fills}%`,
      notes: exp.notes || undefined,
    }));

    const prompt = `
      You are an expert Quantitative Trading AI Optimization Engine.
      Analyze ALL the historical experiment data below for the strategy "${strategyName}".
      
      Data:
      ${JSON.stringify(analysisData)}
      
      YOUR TASK:
      1. Determine the absolute best optimal parameter combination.
      2. CRITICAL OPTIMIZATION GOAL: Your primary objective is MAXIMIZING PROFITABILITY AND EXECUTION. You must synthesize the historical data to recommend a parameter set that results in a strong, positive "Expected Session PnL" and a high "Expected Fill Rate". Do not recommend configurations that lead to net losses or zero fills.
      3. CRITICAL REQUIREMENT: Extract EVERY SINGLE parameter found in the historical JSON. Do not omit anything.
      4. UI ARCHITECT REQUIREMENT: You must group the recommended parameters into exact trading platform UI panels. 
         - Create logical top-level keys like "Execution & Direction", "Sizing", "Circuit Breaker & Session Risk", "Stop-Loss Exit", "Take-Profit Exit", "CSS Weights", etc.
         - If the strategy has nested phases (like "Phase Gates"), you MUST create nested sub-objects (e.g., "Phase Gates": { "Early Phase": {...}, "Mid Phase": {...} }).
      5. For EVERY experiment provided in the data, summarize it into a classification (Pass/Fail/Neutral) and a 4-8 word summary.
      
      Respond ONLY with a valid JSON object strictly matching this format:
      {
        "recommendedParameters": {
          "Asset Scope": { "BTC": true, "ETH": true },
          "Sizing": { "Sizing mode": "Fixed", "Assumed edge": 0.03 },
          "Phase Gates": {
             "Early Phase": { "Start offset (sec)": 900, "Min CSS": 0.6 },
             "Late Phase": { "Start offset (sec)": 3000 }
          }
        },
        "expectedPnL": number,
        "expectedFillRate": number,
        "confidence": number,
        "explanation": "A 2-3 paragraph deep explanation of WHY this combination is optimal...",
        "historicalSummaries": {
          "experiment_id_here": {
            "status": "Pass" | "Fail" | "Neutral",
            "summary": "Extremely concise 4-8 word summary."
          }
        }
      }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [
              {
                text: "You evaluate complex data arrays and output strictly valid JSON.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      logger("error", "Gemini API call failed", {
        status: response.status,
        error: errText,
      });
      throw new AppError(
        "AI_ERROR",
        "Failed to retrieve AI analysis.",
        500,
        errText,
      );
    }

    const aiResult = await response.json();
    return JSON.parse(aiResult.candidates[0].content.parts[0].text);
  } catch (error) {
    logger("error", "Failed to generate AI analysis", error);
    throw error;
  }
}
