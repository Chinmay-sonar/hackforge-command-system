import { writeText, toICSDate, toICSDateTime, nowISO } from "./utils.js";

// ─────────────────────────────────────────
// Escape special characters for ICS format
// ─────────────────────────────────────────
function icsEscape(str = "") {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// ─────────────────────────────────────────
// Generate a single VEVENT block
// ─────────────────────────────────────────
function buildEvent(task, hackathonName) {
  const uid = `${task.id}@hackathon-agent`;
  const dtstamp = toICSDateTime(nowISO());
  const summary = icsEscape(`[${task.priority.toUpperCase()}] ${task.title}`);
  const description = icsEscape(
    [
      task.description,
      task.tags?.length ? `Tags: ${task.tags.join(", ")}` : "",
      task.estimatedHours ? `Estimated: ${task.estimatedHours}h` : "",
      task.notes ? `Notes: ${task.notes}` : "",
    ]
      .filter(Boolean)
      .join("\\n")
  );

  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `CATEGORIES:${icsEscape(hackathonName)},${task.priority.toUpperCase()}`,
    `STATUS:${task.status === "completed" ? "COMPLETED" : "NEEDS-ACTION"}`,
    `PRIORITY:${task.priority === "high" ? 1 : task.priority === "medium" ? 5 : 9}`,
  ];

  // Add date if deadline exists
  if (task.deadline) {
    const dtstart = toICSDate(task.deadline);
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
    lines.push(`DTEND;VALUE=DATE:${dtstart}`);

    // Add alarm 1 day before deadline
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-P1D");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:Reminder: ${icsEscape(task.title)}`);
    lines.push("END:VALARM");
  }

  if (task.completedAt) {
    lines.push(`COMPLETED:${toICSDateTime(task.completedAt)}`);
  }

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

// ─────────────────────────────────────────
// Main Calendar Generator
// ─────────────────────────────────────────
export function generateCalendar(tasks, hackathonName, outputPath) {
  const events = tasks
    .filter((t) => t.status !== "skipped") // skip skipped tasks
    .map((t) => buildEvent(t, hackathonName));

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//HackathonAgent//ActionAgent//EN`,
    `X-WR-CALNAME:${hackathonName} - Hackathon Tasks`,
    "X-WR-TIMEZONE:UTC",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  writeText(outputPath, calendar);
}
