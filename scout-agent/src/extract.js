import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { hackathonInfoSchema } from './schema.js';

// gemini-2.0-flash was shut down June 1, 2026 — do not use it.
// gemini-2.5-flash is the current free-tier model with full structured-output support.
// Override with GEMINI_MODEL if you want to try gemini-3-flash-preview or a future model.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_ATTEMPTS = 2;

const responseJsonSchema = toGeminiJsonSchema(hackathonInfoSchema);

/**
 * Calls Gemini to extract structured hackathon info from raw page text.
 * Validates the response against hackathonInfoSchema before returning it —
 * a schema-constrained response is guaranteed to be syntactically valid JSON,
 * but NOT guaranteed to be semantically correct, so we still validate.
 *
 * @param {string} pageText - cleaned text from fetchPageText()
 * @param {string} sourceUrl
 * @returns {Promise<z.infer<typeof hackathonInfoSchema>>}
 */
export async function extractHackathonInfo(pageText, sourceUrl) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Copy .env.example to .env and add a key from https://aistudio.google.com/apikey'
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(pageText, sourceUrl);

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema,
          temperature: 0.2, // extraction should be consistent, not creative
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response (no text field).');
      }

      const parsedJson = JSON.parse(text);
      const validated = hackathonInfoSchema.parse({ ...parsedJson, sourceUrl });
      return validated;
    } catch (err) {
      lastError = err;
      console.error(`[Scout] Extraction attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`);
    }
  }

  throw new Error(`Scout could not extract valid structured data after ${MAX_ATTEMPTS} attempts: ${lastError.message}`);
}

/**
 * @param {string} pageText
 * @param {string} sourceUrl
 * @returns {string}
 */
function buildPrompt(pageText, sourceUrl) {
  return `You are extracting structured hackathon information from raw scraped webpage text.

Rules:
- Only use information that is actually present in the text below. Do not invent dates, prize amounts, rules, or judging criteria.
- If a field is not present on the page, use null for single values or an empty array for lists.
- Record anything important you could NOT find in missingInfoNotes (e.g. "no judging criteria listed", "submission deadline not on this page").
- Set extractionConfidence to "low" if this page looks like a landing/marketing page that links elsewhere for the real rules.

SOURCE URL: ${sourceUrl}

PAGE TEXT:
"""
${pageText}
"""`;
}

/**
 * Converts the Zod schema to the JSON Schema shape Gemini expects, stripping
 * the top-level $schema key (Gemini ignores it, but no reason to send it).
 * @param {z.ZodTypeAny} schema
 */
function toGeminiJsonSchema(schema) {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema);
  return jsonSchema;
}
