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

    // Pass ALL mandatory tracking data into the AI Context
    const analysisData = experiments.map((exp) => ({
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
      notes: exp.notes || undefined, // Include only if populated
    }));

    const prompt = `
      You are an expert Quantitative Trading AI Optimization Engine.
      Analyze ALL the historical experiment data below for the strategy "${strategyName}".
      
      Data includes comprehensive context for each experiment: Date, Hypothesis, Parameter Changes, Stop Conditions (Capital Safety), Success Metrics, Duration, Market Conditions (Vol Regime), Top Gate Reasons, Verdicts, PnL, and Fill Rates.
      
      Data:
      ${JSON.stringify(analysisData)}
      
      YOUR TASK:
      Analyze all columns, especially how the "Hypothesis", "Stop conditions", and "Market Conditions" interact with the "Parameters" and "Top 3 Gate Reasons".
      Determine the absolute best optimal parameter combination by finding these cross-parameter relationships.
      
      Respond ONLY with a valid JSON object strictly matching this format:
      {
        "recommendedParameters": { "param_key": value },
        "expectedPnL": number (your estimated realistic PnL),
        "expectedFillRate": number (your estimated fill rate percentage, e.g. 85.5),
        "confidence": number (between 0 and 1, representing your confidence in this combo),
        "explanation": "A 2-3 paragraph deep explanation of WHY this combination is optimal, citing specific dates, stop conditions, market regimes, and gate reasons."
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
                text: "You are a quantitative trading JSON API. You evaluate complex data arrays and output strictly valid JSON.",
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
    const jsonText = aiResult.candidates[0].content.parts[0].text;

    return JSON.parse(jsonText);
  } catch (error) {
    logger("error", "Failed to generate AI analysis", error);
    throw error;
  }
}
