import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// ─── Detect if page needs Puppeteer ───────────────────────────────────────────
const JS_HEAVY_DOMAINS = [
  'devpost.com', 'mlh.io', 'hackerearth.com',
  'unstop.com', 'dare2compete.com', 'cumulations.com'
];

const needsPuppeteer = (url) => {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return JS_HEAVY_DOMAINS.some(d => host.includes(d));
  } catch {
    return false;
  }
};

// ─── Static scrape via Cheerio ────────────────────────────────────────────────
const scrapeStatic = async (url) => {
  console.log('🔍 Static scrape (Cheerio):', url);
  const { data: html } = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });

  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, noscript, svg, iframe, nav, footer').remove();

  // Extract all text
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  // Extract all links
  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const label = $(el).text().trim();
    if (href && !href.startsWith('#')) {
      try {
        const absolute = new URL(href, url).href;
        links.push({ label, href: absolute });
      } catch { /* skip malformed */ }
    }
  });

  // Extract PDF links
  const pdfLinks = links.filter(l =>
    l.href.toLowerCase().endsWith('.pdf') ||
    l.label.toLowerCase().includes('rulebook') ||
    l.label.toLowerCase().includes('brochure') ||
    l.label.toLowerCase().includes('brief')
  );

  // Extract meta tags
  const meta = {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
  };

  return { text, links, pdfLinks, meta, method: 'cheerio' };
};

// ─── Dynamic scrape via Puppeteer ─────────────────────────────────────────────
const scrapeDynamic = async (url) => {
  console.log('🤖 Dynamic scrape (Puppeteer):', url);
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for late JS rendering
    await new Promise(r => setTimeout(r, 2000));

    const result = await page.evaluate(() => {
      // Remove noise elements
      document.querySelectorAll('script, style, noscript, svg, iframe, nav, footer')
        .forEach(el => el.remove());

      const text = document.body?.innerText?.replace(/\s+/g, ' ').trim() || '';

      const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
        label: a.innerText.trim(),
        href: a.href,
      })).filter(l => l.href && !l.href.startsWith('#'));

      const meta = {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
        ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
      };

      return { text, links, meta };
    });

    const pdfLinks = result.links.filter(l =>
      l.href.toLowerCase().endsWith('.pdf') ||
      l.label.toLowerCase().includes('rulebook') ||
      l.label.toLowerCase().includes('brochure') ||
      l.label.toLowerCase().includes('brief')
    );

    return { ...result, pdfLinks, method: 'puppeteer' };

  } finally {
    if (browser) await browser.close();
  }
};

// ─── Main scrape function ─────────────────────────────────────────────────────
export const scrapeUrl = async (url) => {
  try {
    if (needsPuppeteer(url)) {
      return await scrapeDynamic(url);
    } else {
      try {
        return await scrapeStatic(url);
      } catch (err) {
        console.warn('⚠️  Static scrape failed, falling back to Puppeteer...');
        return await scrapeDynamic(url);
      }
    }
  } catch (err) {
    throw new Error(`❌ Scrape failed for ${url}: ${err.message}`);
  }
};

// ─── Truncate text for LLM (keep within token limits) ────────────────────────
export const truncateForLLM = (text, maxChars = 12000) => {
  if (text.length <= maxChars) return text;
  // Take first 8000 + last 4000 chars (captures header + footer info)
  return text.slice(0, 8000) + '\n\n...[truncated]...\n\n' + text.slice(-4000);
};