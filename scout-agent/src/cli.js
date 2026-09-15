#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import { fetchPageText } from './fetchContent.js';
import { extractHackathonInfo } from './extract.js';

const url = process.argv[2];

if (!url) {
  console.error('Usage: npm run scout -- <hackathon-url>');
  process.exit(1);
}

try {
  // eslint-disable-next-line no-new
  new URL(url);
} catch {
  console.error(`"${url}" is not a valid URL.`);
  process.exit(1);
}

try {
  await main(url);
} catch (err) {
  console.error(`[Scout] Failed: ${err.message}`);
  process.exit(1);
}

async function main(targetUrl) {
  console.log(`[Scout] Fetching ${targetUrl} ...`);
  const pageText = await fetchPageText(targetUrl);
  console.log(`[Scout] Got ${pageText.length} characters of page text. Extracting with Gemini (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'})...`);

  const result = await extractHackathonInfo(pageText, targetUrl);

  const outDir = path.resolve('scout-output');
  await fs.mkdir(outDir, { recursive: true });
  const slug = new URL(targetUrl).hostname.replace(/[^a-z0-9.-]/gi, '-');
  const outPath = path.join(outDir, `${slug}-${Date.now()}.json`);
  await fs.writeFile(outPath, JSON.stringify(result, null, 2));

  console.log(`[Scout] Done. Wrote ${outPath}`);
  console.log(`[Scout] Extraction confidence: ${result.extractionConfidence}`);
  if (result.missingInfoNotes.length > 0) {
    console.log(`[Scout] Missing info noted by the model:`);
    for (const note of result.missingInfoNotes) {
      console.log(`  - ${note}`);
    }
  }
}
