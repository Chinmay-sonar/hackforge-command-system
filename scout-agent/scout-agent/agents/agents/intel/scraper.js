const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

try {
  // ... your existing scraping code stays here ...
} finally {
  await browser.close();
}