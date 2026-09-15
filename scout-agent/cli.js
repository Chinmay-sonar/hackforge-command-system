#!/usr/bin/env node
process.stdout.setDefaultEncoding('utf8');

import dotenv from 'dotenv';
import readline from 'readline';
import { runIntelAgent } from './agents/intel/index.js';
import { runStrategyAgent } from './agents/strategy/index.js';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found in .env file');
  process.exit(1);
}

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

const arg = process.argv[2];

if (arg === 'strategy') {
  const intelPath = process.argv[3];

  if (!intelPath) {
    console.error('❌ Please provide a path to an intel JSON file.');
    console.error('   Example: node cli.js strategy reports/your-intel-file.json');
    process.exit(1);
  }

  try {
    const result = await runStrategyAgent(intelPath);

    if (result.success) {
      console.log(`\n🎯 Strategy saved to: ${result.savedPath}\n`);
    } else {
      console.error(`\n❌ Strategy generation failed: ${result.error}\n`);
    }

    process.exit(result.success ? 0 : 1);

  } catch (err) {
    console.error(`\n❌ Strategy generation failed: ${err.message}\n`);
    process.exit(1);
  }

} else if (arg) {

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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  showBanner();

  rl.question('\x1b[33m  Enter hackathon URL or name:\x1b[0m ', async (input) => {
    rl.close();

    if (!input.trim()) {
      console.error('❌ No input provided.');
      process.exit(1);
    }

    const result = await runIntelAgent(input.trim());

    if (result.success) {
      console.log('\n\x1b[32m  🎯 Mission complete!\x1b[0m');
      console.log(`\x1b[36m  JSON saved to: ${result.savedPath}\x1b[0m\n`);
    } else {
      console.error(`\n\x1b[31m  ❌ Mission failed: ${result.error}\x1b[0m\n`);
    }

    process.exit(0);
  });
}