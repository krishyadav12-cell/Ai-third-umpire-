import { GoogleGenAI, Type } from "@google/genai";
import { DecisionResult, Verdict } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      description: "The umpire's final decision: OUT, NOT OUT, or UNCLEAR",
      enum: ["OUT", "NOT OUT", "UNCLEAR"],
    },
    dismissal_type: {
      type: Type.STRING,
      description: "The type of dismissal analyzed",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence level from 0 to 100",
    },
    reason: {
      type: Type.STRING,
      description: "Detailed reason for the verdict",
    },
    ball_tracking: {
      type: Type.STRING,
      description: "Description of the ball's trajectory",
    },
    advice: {
      type: Type.STRING,
      description: "Additional advice or observations",
    },
  },
  required: ["verdict", "dismissal_type", "confidence", "reason", "ball_tracking"],
};

export async function analyzeDismissal(
  imageBase64: string,
  appealType: string,
  context?: string
): Promise<Partial<DecisionResult>> {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `You are a cricket Third Umpire. Analyze the image for a ${appealType} dismissal.
    ${context ? `Additional context from the field: ${context}` : ""}
    Look closely at the ball position, stumps, bat, and players.
    Return your verdict in JSON format.`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(",")[1], // Remove data:image/jpeg;base64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        systemInstruction: "You are a cricket Third Umpire. Analyze the image for dismissal. Return only JSON with: verdict, dismissal_type, confidence, reason, ball_tracking, advice.",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
}
