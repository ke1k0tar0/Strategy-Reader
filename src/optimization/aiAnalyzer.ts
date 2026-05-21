/**
 * AI Analysis Engine
 * Uses Google's Gemini API to analyze parameter relationships and hypotheses
 */

import { NormalizedExperiment, ParameterSet } from "@/src/types/strategy";
import { logger } from "@/src/utils/errors";

export async function generateAIAnalysis(
  experiments: NormalizedExperiment[],
  winningParams: ParameterSet,
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger("warn", "GEMINI_API_KEY is not configured. Skipping AI analysis.");
      return "AI deep analysis is currently unavailable because the Gemini API key is missing from the environment variables.";
    }

    // 1. Strip down the data to save tokens and focus the AI
    const analysisData = experiments.map((exp) => ({
      date: exp.date,
      hypothesis: exp.hypothesis,
      change: exp.change,
      parameters: exp.parameterSet,
      verdict: exp.verdict,
      pnl: exp.pnl,
      fills: `${exp.fills}%`,
    }));

    // 2. Build the context for Gemini
    const prompt = `
      You are an expert Quantitative Trading AI Assistant.
      
      The deterministic math engine has already selected the following parameter configuration as the OPTIMAL choice based on historical PnL and Fill Rates:
      ${JSON.stringify(winningParams, null, 2)}
      
      Below is the historical experiment data for this strategy. Read the human-written 'hypothesis', 'change', and 'verdict' columns alongside the resulting 'parameters'.
      
      Historical Data:
      ${JSON.stringify(analysisData)}
      
      YOUR TASK:
      Write a concise, highly intelligent 2-3 paragraph analysis explaining WHY this specific parameter combination won. 
      Focus heavily on "cross-parameter relationships" (e.g., "Increasing X only works when Y is decreased, as seen in the tests on Date..."). 
      Do not repeat the raw math (I already have that). Provide the deep, qualitative insights that a senior quant researcher would write. Format your response cleanly.
    `;

    // 3. Call the Gemini API via native fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [
              {
                text: "You are a professional, direct, and highly technical quantitative trading assistant. Avoid fluff.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.3, // Low temperature for highly logical, analytical output
            maxOutputTokens: 500,
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
      return "AI deep analysis failed to generate due to an API error.";
    }

    const aiResult = await response.json();
    return aiResult.candidates[0].content.parts[0].text;
  } catch (error) {
    logger("error", "Failed to generate AI analysis", error);
    return "AI deep analysis failed due to a system error.";
  }
}
