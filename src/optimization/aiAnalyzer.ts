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
        "GEMINI_API_KEY is not configured.",
        500,
      );
    }

    // Include the unique 'id' so Gemini can map its summaries back to the correct row
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
      
      Data includes comprehensive context for each experiment.
      
      Data:
      ${JSON.stringify(analysisData)}
      
      YOUR TASK:
      1. Determine the absolute best optimal parameter combination.
      2. CRITICAL REQUIREMENT: You MUST extract and output EVERY SINGLE parameter that exists in the historical JSON parameter sets. Do NOT drop, omit, or hide any parameters (e.g., max_notional_usd, specific asset flags, or granular threshold values must all be explicitly included).
      3. Group all recommended parameters into logical top-level sections for the UI (e.g., "Asset Scope", "Risk Management", "CSS Weights (1H)", "Stop Loss Configuration", "General Parameters").
      4. For EVERY experiment provided in the data, summarize it into a classification and a 4-8 word summary.
      
      Respond ONLY with a valid JSON object strictly matching this format:
      {
        "recommendedParameters": {
          "Section Name 1 (e.g. Asset Scope)": {
            "param_key": value,
            "param_key_2": value
          },
          "Section Name 2 (e.g. Risk Management)": {
            "param_key": value
          }
        },
        "expectedPnL": number,
        "expectedFillRate": number,
        "confidence": number,
        "explanation": "A 2-3 paragraph deep explanation of WHY this combination is optimal...",
        "historicalSummaries": {
          "experiment_id_here": {
            "status": "Pass" | "Fail" | "Neutral",
            "summary": "Extremely concise 4-8 word summary of what happened."
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
