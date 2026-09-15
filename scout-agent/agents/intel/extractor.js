import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { truncateForLLM } from './scraper.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// â”€â”€â”€ System Prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SYSTEM_PROMPT = `You are an elite hackathon intelligence analyst. 
Your job is to extract structured information from raw hackathon webpage text.
You ALWAYS respond with a single valid JSON object â€” no markdown, no explanation, no backticks.
If a field is not found, use null for strings, [] for arrays, and "unknown" for enums.
Be precise, thorough, and never hallucinate information not present in the text.`;

// â”€â”€â”€ Build extraction prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildPrompt = (rawText, pdfText, url) => `
Extract all hackathon intelligence from the following content scraped from: ${url}

=== WEBPAGE CONTENT ===
${truncateForLLM(rawText, 10000)}

${pdfText ? `=== PDF CONTENT ===\n${pdfText}` : ''}

=== INSTRUCTIONS ===
Return ONLY a valid JSON object with exactly this structure:

{
  "name": "string â€” official hackathon name",
  "tagline": "string or null â€” short tagline",
  "dates": {
    "start": "string or null â€” start date",
    "end": "string or null â€” end date",
    "submissionDeadline": "string or null",
    "registrationDeadline": "string or null"
  },
  "location": {
    "type": "online | offline | hybrid | unknown",
    "place": "string or null â€” city/venue if offline"
  },
  "themes": ["array of track or theme names"],
  "prizes": [
    { "position": "string", "reward": "string" }
  ],
  "eligibility": {
    "whoCanParticipate": "string or null",
    "restrictions": ["array of restriction strings"]
  },
  "teamSize": {
    "min": number or null,
    "max": number or null
  },
  "submissionRequirements": ["array of what must be submitted"],
  "judgingCriteria": [
    { "criterion": "string", "weight": "string or null" }
  ],
  "techStack": {
    "mandatoryAPIs": ["array or []"],
    "suggestedTools": ["array or []"],
    "sponsorTech": ["array or []"]
  },
  "importantLinks": {
    "register": "url or null",
    "submitProject": "url or null",
    "discord": "url or null",
    "devpost": "url or null",
    "others": ["array of other relevant urls"]
  },
  "rawSummary": "3-5 sentence summary of what this hackathon is about, who should join, and what makes it unique",
  "scrapedAt": "${new Date().toISOString()}",
  "sourceUrl": "${url}"
}`;

// â”€â”€â”€ Call Groq and parse response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const callGroq = async (prompt, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`ðŸ§  Calling Groq (attempt ${attempt}/${retries})...`);

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // low temp = more precise extraction
        max_tokens: 2000,
      });

      const raw = response.choices[0]?.message?.content?.trim();
      if (!raw) throw new Error('Empty response from Groq');

      // Strip any accidental markdown fences
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      return JSON.parse(cleaned);

    } catch (err) {
      console.warn(`âš ï¸  Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw new Error(`âŒ Groq extraction failed after ${retries} attempts: ${err.message}`);
      await new Promise(r => setTimeout(r, 1500 * attempt)); // backoff
    }
  }
};

// â”€â”€â”€ Main extractor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const extractIntel = async (rawText, pdfText = '', url) => {
  console.log('âš¡ Extracting hackathon intel via Groq...');
  const prompt = buildPrompt(rawText, pdfText, url);
  const extracted = await callGroq(prompt);
  console.log('âœ… Intel extracted successfully');
  return extracted;
};
