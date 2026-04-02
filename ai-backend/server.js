import { GoogleGenAI, Type } from "@google/genai";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          estimatedMacros: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
            },
            required: ["calories", "protein", "carbs", "fats"],
          },
          reason: { type: Type.STRING },
        },
        required: ["title", "ingredients", "estimatedMacros", "reason"],
      },
    },
  },
  required: ["suggestions"],
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

app.post("/api/ai/macro-suggestions", async (req, res) => {
  try {
    const remainingCalories = toNumber(req.body?.remainingCalories);
    const remainingProtein = toNumber(req.body?.remainingProtein);
    const remainingCarbs = toNumber(req.body?.remainingCarbs);
    const remainingFats = toNumber(req.body?.remainingFats);

    const preferredFoods = Array.isArray(req.body?.preferredFoods)
      ? req.body.preferredFoods.filter(Boolean)
      : [];

    const avoidFoods = Array.isArray(req.body?.avoidFoods)
      ? req.body.avoidFoods.filter(Boolean)
      : [];

    if (
      remainingCalories == null ||
      remainingProtein == null ||
      remainingCarbs == null ||
      remainingFats == null
    ) {
      return res.status(400).json({
        message: "Invalid macro input.",
      });
    }

    const prompt = `
You are a nutrition assistant for a mobile macro tracking app.

The user needs practical meal ideas that fit their remaining macros for today.

Remaining calories: ${remainingCalories}
Remaining protein: ${remainingProtein}g
Remaining carbs: ${remainingCarbs}g
Remaining fats: ${remainingFats}g

Preferred foods: ${preferredFoods.length ? preferredFoods.join(", ") : "none"}
Foods to avoid: ${avoidFoods.length ? avoidFoods.join(", ") : "none"}

Rules:
- Return exactly 3 meal suggestions.
- Keep foods realistic and easy to find.
- Do not suggest exotic meals.
- Don't forget to specify serving sizes (in grams)
- Each suggestion must be reasonably close to the remaining macros, but it does NOT need to use all of them exactly.
- Focus on practical single-meal or snack combinations.
- Estimated macros should be approximate but realistic.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.6,
      },
    });

    const text = response.text;

    if (!text) {
      return res.status(502).json({ message: "Empty AI response." });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({
        message: "AI returned invalid JSON.",
        raw: text,
      });
    }

    return res.json(parsed);
  } catch (error) {
    console.error("AI macro suggestions error:", error);
    return res.status(500).json({
      message: "Failed to generate macro suggestions.",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`AI backend running on http://localhost:${port}`);
});
