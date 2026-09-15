import * as cheerio from 'cheerio';

const MAX_CHARS = 18000; // keeps the Gemini prompt well within context limits
const MIN_USABLE_CHARS = 400; // below this, assume the page is JS-rendered or blocked

/**
 * Fetches a URL and returns cleaned, visible page text suitable for an LLM prompt.
 * Tries a plain fetch + cheerio parse first (fast, no browser needed). If that
 * yields too little text — a strong signal the page is a JS-rendered SPA —
 * it falls back to Puppeteer, if installed.
 *
 * @param {string} url
 * @returns {Promise<string>} cleaned page text, capped at MAX_CHARS
 */
export async function fetchPageText(url) {
  const staticHtml = await fetchStatic(url);
  let text = extractVisibleText(staticHtml);

  if (text.length < MIN_USABLE_CHARS) {
    console.warn(
      `[Scout] Static fetch only yielded ${text.length} characters — page may be JS-rendered. Trying Puppeteer...`
    );
    try {
      const renderedHtml = await fetchWithPuppeteer(url);
      const renderedText = extractVisibleText(renderedHtml);
      if (renderedText.length > text.length) {
        text = renderedText;
      }
    } catch (err) {
      console.warn(`[Scout] Puppeteer fallback skipped: ${err.message}`);
    }
  }

  if (text.length < MIN_USABLE_CHARS) {
    throw new Error(
      `Only extracted ${text.length} characters of usable text from ${url}. ` +
        `The page may require JavaScript rendering, login, or may be blocking automated requests.`
    );
  }

  return text.slice(0, MAX_CHARS);
}

/**
 * @param {string} url
 * @returns {Promise<string>} raw HTML
 */
async function fetchStatic(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; HackForgeScout/1.0; +https://github.com/) Node-fetch',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }

  return res.text();
}

/**
 * Strips non-content elements and returns flattened, whitespace-normalized body text.
 * @param {string} html
 * @returns {string}
 */
function extractVisibleText(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, nav, footer, iframe, [aria-hidden="true"]').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

/**
 * Lazily loads Puppeteer only when needed, so a static-only install never pays
 * the Chromium download cost. Throws a clear, actionable error if it's missing.
 * @param {string} url
 * @returns {Promise<string>} rendered HTML
 */
async function fetchWithPuppeteer(url) {
  let puppeteer;
  try {
    ({ default: puppeteer } = await import('puppeteer'));
  } catch {
    throw new Error('puppeteer is not installed. Run "npm install puppeteer" to enable JS-rendering fallback.');
  }

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}
