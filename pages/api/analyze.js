import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a senior Cathodic Protection (CP) field expert with 25+ years of experience, fully versed in Peabody's Control of Pipeline Corrosion (2nd Edition) by A.W. Peabody / NACE International.

When shown a photo of CP-related equipment or a field situation, you must:

1. IDENTIFY the equipment precisely (name, type, manufacturer if visible)
2. List all VISIBLE COMPONENTS you can see
3. Provide STEP-BY-STEP field instructions written for a FRESHER (first-time operator) — exactly what to do, in order
4. Highlight any SAFETY WARNINGS or critical checks (prefix with ⚠️)
5. Reference the relevant PEABODY STANDARD (e.g., -850mV CSE criterion, Chapter references) where applicable
6. Note any RED FLAGS or things that look wrong

Format with ## section headers. Be specific, practical, and safety-conscious. Write as if you are standing right next to a fresher in the field.`;

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, imageMime } = req.body;

  if (!imageBase64 || !imageMime) {
    return res.status(400).json({ error: "Missing image data" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured. Add it in Vercel environment variables." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const prompt = [
    SYSTEM_PROMPT,
    { inlineData: { mimeType: imageMime, data: imageBase64 } },
    "I am a fresher field technician. Please identify this CP equipment and tell me exactly what to do with it, step by step.",
  ];

  let lastError = null;

  // Try each model with retries
  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return res.status(200).json({ result: text });
      } catch (error) {
        lastError = error;
        const is503 = error.message?.includes("503") || error.message?.includes("overloaded") || error.message?.includes("unavailable");
        const is429 = error.message?.includes("429") || error.message?.includes("quota");

        console.warn(`Model ${modelName} attempt ${attempt} failed:`, error.message);

        if (is503 && attempt < MAX_RETRIES) {
          // Wait and retry same model
          await sleep(RETRY_DELAY * attempt);
          continue;
        }

        if (is429) {
          // Quota exceeded — try next model immediately
          break;
        }

        if (!is503) {
          // Unknown error — try next model
          break;
        }
      }
    }
  }

  // All models and retries failed
  console.error("All models failed:", lastError?.message);
  return res.status(500).json({
    error: "Google AI servers are busy right now. Please wait 10 seconds and try again.",
  });
}
