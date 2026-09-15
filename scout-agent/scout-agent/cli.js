#!/usr/bin/env node
import dotenv from 'dotenv';
import readline from 'readline';
import { runIntelAgent } from './agents/intel/index.js';

dotenv.config();

// ─── Validate environment ─────────────────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found in .env file');
  console.error('   Add it: GROQ_API_KEY=your_key_here');
  process.exit(1);
}

// ─── Banner ───────────────────────────────────────────────────────────────────
const showBanner = () => {
  console.log('\x1b[35m');
  console.log('  ███████╗ ██████╗ ██████╗ ██╗   ██╗████████╗');
  console.log('  ██╔════╝██╔════╝██╔═══██╗██║   ██║╚══██╔══╝');
  console.log('  ███████╗██║     ██║   ██║██║   ██║   ██║   ');
  console.log('  ╚════██║██║     ██║   ██║██║   ██║   ██║   ');
  console.log('  ███████║╚██████╗╚██████╔╝╚██████╔╝   ██║   ');
  console.log('  ╚══════╝ ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝   ');
  console.log('\x1b[36m');
  console.log('        🕵️  INTEL AGENT — Hackathon Scraper');
  console.log('        Powered by Groq LLaMA 3.3 70B');
  console.log('\x1b[0m');
};

// ─── Interactive prompt ───────────────────────────────────────────────────────
const askInput = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  showBanner();

  rl.question(
    '\x1b[33m  Enter hackathon URL or name:\x1b[0m ',
    async (input) => {
      rl.close();

      if (!input.trim()) {
        console.error('❌ No input provided. Exiting.');
        process.exit(1);
      }

      const result = await runIntelAgent(input.trim());

      if (result.success) {
        console.log('\n\x1b[32m  🎯 Mission complete!\x1b[0m');
        console.log(`\x1b[36m  JSON saved to: ${result.savedPath}\x1b[0m\n`);
        process.exit(0);
      } else {
        console.error(`\n\x1b[31m  ❌ Mission failed: ${result.error}\x1b[0m\n`);
        process.exit(1);
      }
    }
  );
};

// ─── CLI argument support (node cli.js "url or name") ────────────────────────
const arg = process.argv[2];

if (arg) {
  showBanner();
  console.log(`\x1b[33m  Input: ${arg}\x1b[0m`);
  runIntelAgent(arg).then(result => {
    if (result.success) {
      console.log('\n\x1b[32m  🎯 Mission complete!\x1b[0m');
      console.log(`\x1b[36m  JSON saved to: ${result.savedPath}\x1b[0m\n`);
      process.exit(0);
    } else {
      console.error(`\n\x1b[31m  ❌ Mission failed: ${result.error}\x1b[0m\n`);
      process.exit(1);
    }
  });
} else {
  askInput();
}