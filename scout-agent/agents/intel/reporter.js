import fs from 'fs';
import path from 'path';

// â”€â”€â”€ Colors for terminal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const c = {
  reset:  '\x1b[0m',
  bright: '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  red:    '\x1b[31m',
  white:  '\x1b[37m',
};

const line  = () => console.log(`${c.dim}${'â”€'.repeat(60)}${c.reset}`);
const title = (t) => console.log(`\n${c.bright}${c.cyan}${t}${c.reset}`);
const label = (l, v) => v && console.log(`  ${c.yellow}${l}:${c.reset} ${c.white}${v}${c.reset}`);
const badge = (text, color = c.green) => `${color}[${text}]${c.reset}`;

// â”€â”€â”€ Print full intel report to terminal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const printReport = (intel) => {
  console.clear();
  line();
  console.log(`${c.bright}${c.magenta}
  â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ•—   â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•—     
  â–ˆâ–ˆâ•‘â–ˆâ–ˆâ–ˆâ–ˆâ•—  â–ˆâ–ˆâ•‘â•šâ•â•â–ˆâ–ˆâ•”â•â•â•â–ˆâ–ˆâ•”â•â•â•â•â•â–ˆâ–ˆâ•‘     
  â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â–ˆâ–ˆâ•— â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—  â–ˆâ–ˆâ•‘     
  â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â•šâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ•”â•â•â•  â–ˆâ–ˆâ•‘     
  â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘ â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•‘   â–ˆâ–ˆâ•‘   â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—
  â•šâ•â•â•šâ•â•  â•šâ•â•â•â•   â•šâ•â•   â•šâ•â•â•â•â•â•â•â•šâ•â•â•â•â•â•â•
  ${c.reset}`);
  console.log(`${c.bright}${c.cyan}        ðŸ•µï¸  HACKATHON INTEL REPORT${c.reset}`);
  line();

  // â”€â”€ Overview â”€â”€
  title('ðŸ“Œ OVERVIEW');
  label('Name',     intel.name);
  label('Tagline',  intel.tagline);
  label('Location', `${intel.location?.type?.toUpperCase()} ${intel.location?.place ? 'â€” ' + intel.location.place : ''}`);
  label('Source',   intel.sourceUrl);
  label('Scraped',  new Date(intel.scrapedAt).toLocaleString());

  // â”€â”€ Dates â”€â”€
  title('ðŸ“… DATES');
  label('Start',                intel.dates?.start);
  label('End',                  intel.dates?.end);
  label('Registration Deadline',intel.dates?.registrationDeadline);
  label('Submission Deadline',  intel.dates?.submissionDeadline);

  // â”€â”€ Themes â”€â”€
  if (intel.themes?.length > 0) {
    title('ðŸŽ¯ THEMES / TRACKS');
    intel.themes.forEach(t => console.log(`  ${c.green}â–¸${c.reset} ${t}`));
  }

  // â”€â”€ Prizes â”€â”€
  if (intel.prizes?.length > 0) {
    title('ðŸ† PRIZES');
    intel.prizes.forEach(p =>
      console.log(`  ${c.yellow}${p.position}:${c.reset} ${c.white}${p.reward}${c.reset}`)
    );
  }

  // â”€â”€ Team Size â”€â”€
  title('ðŸ‘¥ TEAM SIZE');
  const ts = intel.teamSize;
  if (ts?.min || ts?.max) {
    label('Size', `${ts.min ?? '?'} â€“ ${ts.max ?? '?'} members`);
  } else {
    console.log(`  ${c.dim}Not specified${c.reset}`);
  }

  // â”€â”€ Eligibility â”€â”€
  title('âœ… ELIGIBILITY');
  label('Who can join', intel.eligibility?.whoCanParticipate);
  if (intel.eligibility?.restrictions?.length > 0) {
    intel.eligibility.restrictions.forEach(r =>
      console.log(`  ${c.red}âœ—${c.reset} ${r}`)
    );
  }

  // â”€â”€ Submission Requirements â”€â”€
  if (intel.submissionRequirements?.length > 0) {
    title('ðŸ“¦ SUBMISSION REQUIREMENTS');
    intel.submissionRequirements.forEach(s =>
      console.log(`  ${c.cyan}â–¸${c.reset} ${s}`)
    );
  }

  // â”€â”€ Judging Criteria â”€â”€
  if (intel.judgingCriteria?.length > 0) {
    title('âš–ï¸  JUDGING CRITERIA');
    intel.judgingCriteria.forEach(j =>
      console.log(`  ${c.magenta}â–¸${c.reset} ${j.criterion}${j.weight ? c.dim + ' (' + j.weight + ')' + c.reset : ''}`)
    );
  }

  // â”€â”€ Tech Stack â”€â”€
  title('ðŸ› ï¸  TECH STACK');
  if (intel.techStack?.mandatoryAPIs?.length > 0) {
    console.log(`  ${c.red}Mandatory APIs:${c.reset}`);
    intel.techStack.mandatoryAPIs.forEach(t => console.log(`    ${c.red}â–¸${c.reset} ${t}`));
  }
  if (intel.techStack?.suggestedTools?.length > 0) {
    console.log(`  ${c.green}Suggested Tools:${c.reset}`);
    intel.techStack.suggestedTools.forEach(t => console.log(`    ${c.green}â–¸${c.reset} ${t}`));
  }
  if (intel.techStack?.sponsorTech?.length > 0) {
    console.log(`  ${c.yellow}Sponsor Tech:${c.reset}`);
    intel.techStack.sponsorTech.forEach(t => console.log(`    ${c.yellow}â–¸${c.reset} ${t}`));
  }

  // â”€â”€ Important Links â”€â”€
  title('ðŸ”— IMPORTANT LINKS');
  label('Register',       intel.importantLinks?.register);
  label('Submit Project', intel.importantLinks?.submitProject);
  label('Discord',        intel.importantLinks?.discord);
  label('Devpost',        intel.importantLinks?.devpost);
  if (intel.importantLinks?.others?.length > 0) {
    intel.importantLinks.others.forEach(l =>
      console.log(`  ${c.blue}â–¸${c.reset} ${l}`)
    );
  }

  // â”€â”€ Summary â”€â”€
  title('ðŸ“ SUMMARY');
  console.log(`  ${c.dim}${intel.rawSummary}${c.reset}`);

  line();
  console.log(`${c.bright}${c.green}  âœ… Intel extraction complete!${c.reset}`);
  line();
};

// â”€â”€â”€ Save JSON report to file â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const saveReport = (intel, outputDir = './reports') => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const safeName = (intel.name || 'hackathon')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${safeName}-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(intel, null, 2), 'utf-8');
  console.log(`\nðŸ’¾ Report saved â†’ ${c.cyan}${filepath}${c.reset}`);
  return filepath;
};
