import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import fs from 'fs';

const JS_HEAVY_DOMAINS = [
  'devpost.com', 'mlh.io', 'hackerearth.com',
  'unstop.com', 'dare2compete.com'
];

const needsPuppeteer = (url) => {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return JS_HEAVY_DOMAINS.some(d => host.includes(d));
  } catch { return false; }
};

const findChrome = () => {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) { console.log(`🌐 Using browser: ${p}`); return p; }
  }
  return null;
};

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
  $('script, style, noscript, svg, iframe, nav, footer').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const label = $(el).text().trim();
    if (href && !href.startsWith('#')) {
      try { links.push({ label, href: new URL(href, url).href }); } catch {}
    }
  });
  const pdfLinks = links.filter(l =>
    l.href.toLowerCase().endsWith('.pdf') ||
    l.label.toLowerCase().includes('rulebook') ||
    l.label.toLowerCase().includes('brochure')
  );
  const meta = {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
  };
  return { text, links, pdfLinks, meta, method: 'cheerio' };
};

const scrapeDynamic = async (url) => {
  console.log('🤖 Dynamic scrape (Puppeteer):', url);
  const executablePath = findChrome();
  if (!executablePath) throw new Error('No Chrome/Edge found on this machine');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const result = await page.evaluate(() => {
      document.querySelectorAll('script, style, noscript, svg, iframe, nav, footer')
        .forEach(el => el.remove());
      const text = document.body?.innerText?.replace(/\s+/g, ' ').trim() || '';
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
        label: a.innerText.trim(), href: a.href,
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
      l.label.toLowerCase().includes('brochure')
    );
    return { ...result, pdfLinks, method: 'puppeteer' };
  } finally {
    if (browser) await browser.close();
  }
};

export const scrapeUrl = async (url) => {
  try {
    if (needsPuppeteer(url)) {
      return await scrapeDynamic(url);
    } else {
      try {
        return await scrapeStatic(url);
      } catch {
        console.warn('⚠️  Static failed, falling back to Puppeteer...');
        return await scrapeDynamic(url);
      }
    }
  } catch (err) {
    throw new Error(`❌ Scrape failed for ${url}: ${err.message}`);
  }
};

export const truncateForLLM = (text, maxChars = 12000) => {
  if (text.length <= maxChars) return text;
  return text.slice(0, 8000) + '\n\n...[truncated]...\n\n' + text.slice(-4000);
};
