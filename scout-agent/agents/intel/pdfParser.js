import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const downloadPdf = async (url) => {
  console.log('📄 Downloading PDF:', url);
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  return Buffer.from(response.data);
};

const extractPdfText = async (buffer) => {
  const data = await pdfParse(buffer);
  return { text: data.text.replace(/\s+/g, ' ').trim(), pages: data.numpages };
};

export const parsePdfFromUrl = async (url) => {
  try {
    const buffer = await downloadPdf(url);
    const { text, pages } = await extractPdfText(buffer);
    console.log(`✅ PDF parsed — ${pages} page(s), ${text.length} chars extracted`);
    return { success: true, url, pages, text: text.slice(0, 8000) };
  } catch (err) {
    console.warn(`⚠️  PDF parse failed for ${url}: ${err.message}`);
    return { success: false, url, text: '', error: err.message };
  }
};

export const parseAllPdfs = async (pdfLinks = []) => {
  if (pdfLinks.length === 0) return '';
  console.log(`📚 Found ${pdfLinks.length} PDF(s) to parse...`);
  const results = await Promise.allSettled(
    pdfLinks.slice(0, 3).map(link => parsePdfFromUrl(link.href))
  );
  const texts = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => `\n\n--- PDF: ${r.value.url} ---\n${r.value.text}`);
  return texts.join('\n');
};
