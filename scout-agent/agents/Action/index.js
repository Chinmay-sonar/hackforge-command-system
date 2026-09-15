import path from "path";
import { StrategyOutputSchema } from "./schema.js";
import { readJSON, sortByPriority, generateTaskId, nowISO, priorityEmoji, statusEmoji, formatDateHuman } from "./utils.js";

// ─────────────────────────────────────────
// Convert strategy JSON → flat task list
// ─────────────────────────────────────────
function convertStrategyToTasks(strategyData) {
  const tasks = [];
  const projectIdeas = strategyData.projectIdeas ?? [];
  const timeline = strategyData.timeline ?? [];
  const recommendedTechStack = strategyData.recommendedTechStack ?? {};

  for (const phase of timeline) {
    for (const taskTitle of (phase.tasks ?? [])) {
      const phaseName = (phase.phase || "").toLowerCase();
      let priority = "medium";
      if (phaseName.includes("final") || phaseName.includes("submit")) priority = "high";
      else if (phaseName.includes("research") || phaseName.includes("planning")) priority = "low";

      tasks.push({
        id: generateTaskId(),
        title: taskTitle,
        description: `Phase: ${phase.phase} | Duration: ${phase.duration}`,
        priority,
        status: "pending",
        deadline: null,
        tags: [phase.phase],
        estimatedHours: null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        completedAt: null,
        reminderSent: false,
        notes: "",
      });
    }
  }

  for (const idea of projectIdeas) {
    let priority = "low";
    if (idea.difficulty === "hard") priority = "high";
    else if (idea.difficulty === "medium") priority = "medium";

    tasks.push({
      id: generateTaskId(),
      title: `Evaluate idea: ${idea.title}`,
      description: idea.description,
      priority,
      status: "pending",
      deadline: null,
      tags: ["idea-evaluation", idea.difficulty],
      estimatedHours: null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      completedAt: null,
      reminderSent: false,
      notes: idea.whyItFits ?? "",
    });
  }

  const techList = [
    ...(recommendedTechStack.frontend ?? []),
    ...(recommendedTechStack.backend ?? []),
    ...(recommendedTechStack.aiMl ?? []),
    ...(recommendedTechStack.apisToUse ?? []),
  ];

  if (techList.length > 0) {
    tasks.push({
      id: generateTaskId(),
      title: "Set up project tech stack",
      description: `Initialize and configure: ${techList.join(", ")}`,
      priority: "high",
      status: "pending",
      deadline: null,
      tags: ["setup", "tech-stack"],
      estimatedHours: 2,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      completedAt: null,
      reminderSent: false,
      notes: recommendedTechStack.reasoning ?? "",
    });
  }

  return tasks;
}

// ─────────────────────────────────────────
// Print task list to terminal
// ─────────────────────────────────────────
function printTasks(tasks, hackathonName) {
  const divider = "─".repeat(60);

  console.log(`\n\n${"═".repeat(60)}`);
  console.log(`📋  TASK LIST — ${hackathonName}`);
  console.log(`${"═".repeat(60)}`);

  const byPriority = { high: [], medium: [], low: [] };
  for (const t of tasks) byPriority[t.priority]?.push(t);

  const sections = [
    { label: "🔴 HIGH PRIORITY", tasks: byPriority.high },
    { label: "🟡 MEDIUM PRIORITY", tasks: byPriority.medium },
    { label: "🟢 LOW PRIORITY", tasks: byPriority.low },
  ];

  for (const section of sections) {
    if (section.tasks.length === 0) continue;
    console.log(`\n${section.label}`);
    console.log(divider);
    section.tasks.forEach((t, i) => {
      console.log(`  ${i + 1}. ${statusEmoji(t.status)} ${t.title}`);
      if (t.description) console.log(`     ↳ ${t.description}`);
      if (t.tags?.length) console.log(`     🏷  ${t.tags.join(", ")}`);
      if (t.estimatedHours) console.log(`     ⏱  ~${t.estimatedHours}h`);
      if (t.notes) console.log(`     📝 ${t.notes}`);
      console.log();
    });
  }
}

// ─────────────────────────────────────────
// Print calendar (ICS) content to terminal
// ─────────────────────────────────────────
function printCalendarPreview(tasks, hackathonName) {
  const withDeadlines = tasks.filter(t => t.deadline && t.status !== "skipped");

  console.log(`\n${"═".repeat(60)}`);
  console.log(`📅  CALENDAR EVENTS — ${hackathonName}`);
  console.log(`${"═".repeat(60)}`);

  if (withDeadlines.length === 0) {
    console.log("  ℹ️  No tasks have deadlines set yet.");
    console.log("  Tip: Update task deadlines once you know the hackathon schedule.");
    return;
  }

  withDeadlines
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .forEach(t => {
      console.log(`  ${priorityEmoji(t.priority)} ${formatDateHuman(t.deadline)}  →  ${t.title}`);
    });
}

// ─────────────────────────────────────────
// Print reminders markdown to terminal
// ─────────────────────────────────────────
function printReminders(tasks, hackathonName) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const filled = Math.round(progressPct / 5);
  const bar = `[${"█".repeat(filled)}${"░".repeat(20 - filled)}] ${progressPct}%`;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`📊  PROGRESS OVERVIEW — ${hackathonName}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`\n  ${bar}`);
  console.log(`  Total      : ${total}`);
  console.log(`  ✅ Done    : ${completed}`);
  console.log(`  🔄 Active  : ${inProgress}`);
  console.log(`  ⏳ Pending : ${pending}`);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  💡 WINNING TIPS`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  - Focus on HIGH priority tasks first`);
  console.log(`  - Prepare your README and demo script early`);
  console.log(`  - Submit 30 minutes before the deadline — not at the last second`);
  console.log(`  - A working demo beats perfect code every time`);
}

// ─────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────
export async function runActionAgent(strategyOutputPath) {
  console.log("\n⚙️  ACTION AGENT STARTING...");
  console.log("─".repeat(60));
  console.log(`📥 Reading: ${strategyOutputPath}`);

  const raw = readJSON(strategyOutputPath);
  if (!raw) throw new Error(`Could not read strategy output file: ${strategyOutputPath}`);

  const parsed = StrategyOutputSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("\n❌ Strategy output validation failed:");
    console.error(parsed.error.format());
    throw new Error("Invalid strategy output format.");
  }

  const strategyData = parsed.data;
  const hackathonName = strategyData.hackathonName;
  console.log(`🏆 Hackathon: ${hackathonName}`);

  const tasks = sortByPriority(convertStrategyToTasks(strategyData));
  console.log(`📋 Generated ${tasks.length} tasks from strategy`);

  // ── Print everything to terminal ──
  printTasks(tasks, hackathonName);
  printCalendarPreview(tasks, hackathonName);
  printReminders(tasks, hackathonName);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎯 Action Agent Complete — all output above, no files saved.`);
  console.log(`${"═".repeat(60)}\n`);

  return { tasks, hackathonName };
}