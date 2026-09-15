#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────
const [, , agentName, ...args] = process.argv;

function printHelp() {
  console.log(`
╔══════════════════════════════════════════╗
║       🤖 Hackathon Agent CLI             ║
╚══════════════════════════════════════════╝

Usage:
  node run.js <agent> [options]

Agents:
  intel    <url>           Run Intel Agent — scrape hackathon data
  strategy <intel.json>    Run Strategy Agent — generate task plan
  action   <strategy.json> Run Action Agent — generate tasks, calendar & reminders

Examples:
  node run.js intel https://hackathon-site.com
  node run.js strategy ./reports/intel-output.json
  node run.js action ./reports/strategy-output.json

  `);
}

async function main() {
  if (!agentName || agentName === "--help" || agentName === "-h") {
    printHelp();
    process.exit(0);
  }

  switch (agentName.toLowerCase()) {

    // ── Intel Agent ──
    case "intel": {
      const url = args[0];
      if (!url) {
        console.error("❌ Please provide a URL.\n   Usage: node run.js intel <url>");
        process.exit(1);
      }
      console.log(`\n🔍 Starting Intel Agent for: ${url}`);
      const { runIntelAgent } = await import("./agents/intel/index.js");
      await runIntelAgent(url);
      break;
    }

    // ── Strategy Agent ──
    case "strategy": {
      const intelPath = args[0];
      if (!intelPath) {
        console.error("❌ Please provide path to Intel Agent output.\n   Usage: node run.js strategy <intel.json>");
        process.exit(1);
      }
      const resolvedIntel = path.resolve(intelPath);
      console.log(`\n🧠 Starting Strategy Agent with: ${resolvedIntel}`);
      const { runStrategyAgent } = await import("./agents/strategy/index.js");
      await runStrategyAgent(resolvedIntel);
      break;
    }

    // ── Action Agent ──
    case "action": {
      const strategyPath = args[0];
      if (!strategyPath) {
        console.error("❌ Please provide path to Strategy Agent output.\n   Usage: node run.js action <strategy.json>");
        process.exit(1);
      }
      const resolvedStrategy = path.resolve(strategyPath);
      console.log(`\n⚙️  Starting Action Agent with: ${resolvedStrategy}`);
      const { runActionAgent } = await import("./agents/action/index.js");
      await runActionAgent(resolvedStrategy);
      break;
    }

    default: {
      console.error(`❌ Unknown agent: "${agentName}"`);
      printHelp();
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal Error:", err.message);
  process.exit(1);
});
