import axios from 'axios';

// â”€â”€â”€ Detect if input is a URL or a name â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const detectInputType = (input) => {
  try {
    new URL(input);
    return 'url';
  } catch {
    return 'name';
  }
};

// â”€â”€â”€ Search for hackathon URL by name â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SEARCH_ENGINES = [
  (query) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
];

const extractUrlsFromHtml = (html, query) => {
  // Extract href links that look like hackathon pages
  const urlPattern = /href="(https?:\/\/[^"]+)"/g;
  const matches = [];
  let match;

  const keywords = ['devpost', 'devfolio', 'hackerearth', 'unstop', 'mlh', 'hackathon'];

  while ((match = urlPattern.exec(html)) !== null) {
    const url = match[1];
    // Filter out search engine internal links
    if (
      !url.includes('duckduckgo') &&
      !url.includes('google.com') &&
      !url.includes('bing.com') &&
      !url.includes('ads') &&
      url.length < 200
    ) {
      // Prioritize known hackathon platforms
      const priority = keywords.some(k => url.includes(k)) ? 0 : 1;
      matches.push({ url, priority });
    }
  }

  // Sort by priority (hackathon platforms first)
  matches.sort((a, b) => a.priority - b.priority);

  // Return unique URLs
  return [...new Map(matches.map(m => [m.url, m])).values()]
    .map(m => m.url)
    .slice(0, 5);
};

export const searchHackathonUrl = async (name) => {
  console.log(`ðŸ”Ž Searching for hackathon: "${name}"...`);

  const query = `${name} hackathon site:devpost.com OR site:devfolio.co OR site:hackerearth.com OR site:unstop.com`;

  try {
    const { data: html } = await axios.get(SEARCH_ENGINES[0](query), {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const urls = extractUrlsFromHtml(html, name);

    if (urls.length === 0) {
      throw new Error(`No URLs found for "${name}"`);
    }

    console.log(`âœ… Found ${urls.length} candidate URL(s)`);
    console.log(`ðŸŽ¯ Best match: ${urls[0]}`);

    return urls[0];

  } catch (err) {
    throw new Error(`âŒ Search failed for "${name}": ${err.message}`);
  }
};

// â”€â”€â”€ Main router â€” resolves any input to a URL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const resolveInput = async (input) => {
  const trimmed = input.trim();
  const type = detectInputType(trimmed);

  if (type === 'url') {
    console.log(`ðŸ”— Direct URL detected: ${trimmed}`);
    return trimmed;
  }

  console.log(`ðŸ“ Hackathon name detected: "${trimmed}"`);
  return await searchHackathonUrl(trimmed);
};
