import { resolveInput }  from './router.js';
import { scrapeUrl }     from './scraper.js';
import { parseAllPdfs }  from './pdfParser.js';
import { extractIntel }  from './extractor.js';
import { validateIntel } from './validator.js';
import { printReport, saveReport } from './reporter.js';

export const runIntelAgent = async (input) => {
  console.log('\n🕵️  INTEL AGENT ACTIVATED');
  console.log('═'.repeat(60));
  try {
    console.log('\n📡 STEP 1/5 — Resolving input...');
    const url = await resolveInput(input);

    console.log('\n🌐 STEP 2/5 — Scraping page...');
    const { text, pdfLinks, meta, method } = await scrapeUrl(url);
    console.log(`✅ Scraped via ${method} — ${text.length} chars extracted`);

    console.log('\n📄 STEP 3/5 — Parsing PDFs...');
    const pdfText = await parseAllPdfs(pdfLinks);
    if (pdfText) console.log(`✅ PDF text extracted — ${pdfText.length} chars`);
    else console.log('ℹ️  No PDFs found');

    console.log('\n🧠 STEP 4/5 — Extracting intel via Groq LLM...');
    const rawIntel = await extractIntel(text, pdfText, url);

    console.log('\n✅ STEP 5/5 — Validating and generating report...');
    const { valid, data: intel } = validateIntel(rawIntel);
    const finalIntel = intel || rawIntel;

    printReport(finalIntel);
    const savedPath = saveReport(finalIntel);
    return { success: true, intel: finalIntel, savedPath };

  } catch (err) {
    console.error(`\n❌ INTEL AGENT FAILED: ${err.message}`);
    return { success: false, error: err.message };
  }
};
