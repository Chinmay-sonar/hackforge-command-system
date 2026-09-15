import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { validateStrategy } from './schema.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── System Prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an elite hackathon strategy coach.
You take structured intel about a hackathon and turn it into a concrete, actionable game plan.
You ALWAYS respond with a single valid JSON object — no markdown, no explanation, no backticks.
Be specific and practical. Tailor everything to the actual themes, prizes, judging criteria,
tech stack constraints, dates, and team size provided. Never give generic advice that ignores
the specific details given.`;

// ─── Build strategy prompt from intel JSON ─────────────────────
const buildPrompt = (intel) => `
Here is the structured intel for a hackathon:

${JSON.stringify(intel, null, 2)}

=== INSTRUCTIONS ===
Based on this intel, generate a winning strategy. Return ONLY a valid JSON object with exactly this structure:

{
  "hackathonName": "${intel.name || 'Unknown Hackathon'}",
  "projectIdeas": [
    { "title": "string", "description": "string", "whyItFits": "string", "difficulty": "easy | medium | hard" }
  ],
  "recommendedTechStack": {
    "frontend": ["array of suggestions or []"],
    "backend": ["array of suggestions or []"],
    "aiMl": ["array of suggestions or []"],
    "apisToUse": ["array, prioritize mandatoryAPIs/sponsorTech from intel"],
    "reasoning": "string explaining the stack choice"
  },
  "timeline": [
    { "phase": "string", "duration": "string", "tasks": ["array of strings"] }
  ],
  "teamRoles": [
    { "role": "string", "responsibilities": ["array of strings"] }
  ],
  "riskFactors": ["array of strings"],
  "winningTips": ["array of strings, tied directly to judgingCriteria if present"],
  "generatedAt": "${new Date().toISOString()}",
  "sourceIntelFile": "PLACEHOLDER"
}

Notes:
- Base the timeline on the actual start/end/submissionDeadline dates if present.
- Base teamRoles on teamSize.min/max if present; otherwise assume a team of 4.
- If judgingCriteria is present, make winningTips directly address each criterion.
- Project ideas must relate to the themes array, not generic hackathon ideas.
`;

// ─── Call Groq and parse response ──────────────────────────────
const callGroq = async (prompt, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🧠 Calling Groq for strategy (attempt ${attempt}/${retries})...`);

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 3000,
      });

      const raw = response.choices[0]?.message?.content?.trim();
      if (!raw) throw new Error('Empty response from Groq');

      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      return JSON.parse(cleaned);

    } catch (err) {
      console.warn(`⚠️  Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw new Error(`❌ Groq strategy generation failed after ${retries} attempts: ${err.message}`);
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
};

// ─── Save JSON silently (needed so Action Agent can read it) ───
const saveStrategyJson = (data) => {
  const reportsDir = path.resolve('reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const safeName = (data.hackathonName || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `strategy-${safeName}-${dateStr}.json`;
  const fullPath = path.join(reportsDir, filename);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  return fullPath;
};

// ─── Print full strategy to terminal ───────────────────────────
const printStrategy = (data) => {
  const divider = "─".repeat(60);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`🧭  STRATEGY PLAN — ${data.hackathonName}`);
  console.log(`${"═".repeat(60)}`);

  // Project Ideas
  console.log(`\n💡  PROJECT IDEAS`);
  console.log(divider);
  data.projectIdeas.forEach((idea, i) => {
    const diff = idea.difficulty === 'hard' ? '🔴' : idea.difficulty === 'medium' ? '🟡' : '🟢';
    console.log(`\n  ${i + 1}. ${idea.title}  ${diff} [${idea.difficulty}]`);
    console.log(`     ${idea.description}`);
    console.log(`     ✅ Why it fits: ${idea.whyItFits}`);
  });

  // Tech Stack
  console.log(`\n\n🛠️   RECOMMENDED TECH STACK`);
  console.log(divider);
  const ts = data.recommendedTechStack;
  if (ts.frontend?.length)  console.log(`  Frontend : ${ts.frontend.join(', ')}`);
  if (ts.backend?.length)   console.log(`  Backend  : ${ts.backend.join(', ')}`);
  if (ts.aiMl?.length)      console.log(`  AI / ML  : ${ts.aiMl.join(', ')}`);
  if (ts.apisToUse?.length) console.log(`  APIs     : ${ts.apisToUse.join(', ')}`);
  if (ts.reasoning)         console.log(`\n  📝 ${ts.reasoning}`);

  // Timeline
  console.log(`\n\n📅  TIMELINE`);
  console.log(divider);
  data.timeline.forEach(phase => {
    console.log(`\n  ▸ ${phase.phase}  (${phase.duration})`);
    phase.tasks.forEach(t => console.log(`      - ${t}`));
  });

  // Team Roles
  console.log(`\n\n👥  TEAM ROLES`);
  console.log(divider);
  data.teamRoles.forEach(r => {
    console.log(`\n  ▸ ${r.role}`);
    r.responsibilities.forEach(resp => console.log(`      - ${resp}`));
  });

  // Risk Factors
  console.log(`\n\n⚠️   RISK FACTORS`);
  console.log(divider);
  data.riskFactors.forEach(r => console.log(`  - ${r}`));

  // Winning Tips
  console.log(`\n\n🏆  WINNING TIPS`);
  console.log(divider);
  data.winningTips.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅  Strategy complete — no files saved.`);
  console.log(`    (JSON cached silently for Action Agent pipeline)`);
  console.log(`${"═".repeat(60)}\n`);
};

// ─── Main entry point ───────────────────────────────────────────
export const runStrategyAgent = async (intelJsonPath) => {
  console.log('\n🧭 STRATEGY AGENT ACTIVATED');
  console.log('═'.repeat(60));

  try {
    console.log(`\n📂 STEP 1/3 — Loading intel from ${intelJsonPath}...`);
    const resolvedPath = path.resolve(intelJsonPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Intel file not found: ${resolvedPath}`);
    }
    const intel = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    console.log(`✅ Loaded intel for: ${intel.name || 'Unknown'}`);

    console.log('\n🧠 STEP 2/3 — Generating strategy via Groq LLM...');
    const prompt = buildPrompt(intel);
    const rawStrategy = await callGroq(prompt);
    rawStrategy.sourceIntelFile = resolvedPath;

    console.log('\n✅ STEP 3/3 — Validating and printing strategy...');
    const { valid, data: strategy } = validateStrategy(rawStrategy);
    const finalStrategy = strategy || rawStrategy;
    if (!valid) console.log('ℹ️  Validation warnings above — continuing anyway');

    printStrategy(finalStrategy);

    // Save silently — Action Agent needs this file
    const savedPath = saveStrategyJson(finalStrategy);

    return { success: true, strategy: finalStrategy, savedPath };

  } catch (err) {
    console.error(`\n❌ STRATEGY AGENT FAILED: ${err.message}`);
    return { success: false, error: err.message };
  }
};