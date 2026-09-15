# Scout

The first HackForge agent. Give it a hackathon URL, it scrapes the page and
uses the Gemini API to pull out structured info: theme, dates, judging
criteria, rules, required tech/APIs, submission requirements, and prizes.

Real LLM call, schema-validated output, no mocks.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and paste in a key from https://aistudio.google.com/apikey
```

## Run

```bash
npm run scout -- https://your-hackathon-site.com
```

Output is written to `scout-output/<hostname>-<timestamp>.json` and a summary
prints to the console, including the model's own confidence rating and a list
of anything it couldn't find on the page.

## How it works

1. **`src/fetchContent.js`** — fetches the page, strips `<script>`, `<nav>`,
   `<footer>`, and similar noise with cheerio, and returns clean visible text.
   If the static fetch comes back too short (a strong signal the page is a
   JS-rendered SPA), it automatically tries Puppeteer instead — but Puppeteer
   is an optional dependency, so install it explicitly if you hit that case:
   ```bash
   npm install puppeteer
   ```
2. **`src/extract.js`** — sends that text to Gemini with a JSON Schema
   (generated from `src/schema.js` via Zod's native `z.toJSONSchema()`) so the
   model's response is constrained to the expected shape. The response is
   then re-validated locally with the same Zod schema before it's trusted —
   schema-constrained output guarantees valid JSON, not correct JSON, so we
   still check it ourselves. One retry on a malformed response, then a loud,
   clear failure — never a silent fallback.
3. **`src/cli.js`** — wires the two together and writes the result to disk.

## A note on the model

`gemini-2.0-flash`, the model originally planned for this project, was shut
down by Google on June 1, 2026. This now defaults to `gemini-2.5-flash`,
which is still free-tier and supports structured output natively. You can
override it with `GEMINI_MODEL` in `.env` — worth checking
[Google's deprecation page](https://ai.google.dev/gemini-api/docs/deprecations)
before a real hackathon, since Google has been retiring Flash models on a
roughly 4-5 month cadence this year.

## Known limitations (be aware before relying on this at a real hackathon)

- No retry/backoff for Gemini rate limits yet — on the free tier you can hit
  these under heavy use. A 429 will currently just fail the run.
- Puppeteer fallback launches a fresh headless browser per call — fine for
  one-off scouting, not optimized for scraping many pages back to back.
- This extracts from a *single* page. Many hackathon sites split rules,
  judging criteria, and submission requirements across separate pages
  (rules page, Devpost page, sponsor page) — Scout doesn't yet crawl or
  follow links to assemble a complete picture from several pages.
