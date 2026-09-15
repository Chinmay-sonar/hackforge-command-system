import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─────────────────────────────────────────
// ID Generation
// ─────────────────────────────────────────

/**
 * Generate a short unique task ID
 * e.g. "task_a3f9b2"
 */
export function generateTaskId() {
  return "task_" + crypto.randomBytes(3).toString("hex");
}

// ─────────────────────────────────────────
// Date & Time Utilities
// ─────────────────────────────────────────

/**
 * Returns current ISO timestamp string
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Format a date string to a human-readable format
 * e.g. "2025-07-01" → "July 1, 2025"
 */
export function formatDateHuman(dateStr) {
  if (!dateStr) return "No deadline";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Convert ISO date string to ICS-compatible format
 * e.g. "2025-07-01" → "20250701"
 */
export function toICSDate(dateStr) {
  if (!dateStr) return null;
  return dateStr.replace(/-/g, "").split("T")[0];
}

/**
 * Convert full ISO timestamp to ICS datetime format
 * e.g. "2025-07-01T10:00:00.000Z" → "20250701T100000Z"
 */
export function toICSDateTime(isoStr) {
  return isoStr.replace(/[-:]/g, "").split(".")[0] + "Z";
}

// ─────────────────────────────────────────
// File I/O Utilities
// ─────────────────────────────────────────

/**
 * Ensure a directory exists (creates recursively if not)
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Read and parse a JSON file safely
 * Returns null if file doesn't exist or is invalid
 */
export function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`⚠️  Failed to read JSON from ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Write data as formatted JSON to a file
 */
export function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Write plain text content to a file
 */
export function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

// ─────────────────────────────────────────
// Task Utility Helpers
// ─────────────────────────────────────────

/**
 * Sort tasks by priority: high → medium → low
 */
export function sortByPriority(tasks) {
  const order = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => order[a.priority] - order[b.priority]);
}

/**
 * Sort tasks by deadline (earliest first), nulls at end
 */
export function sortByDeadline(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
}

/**
 * Filter tasks by status
 */
export function filterByStatus(tasks, status) {
  return tasks.filter((t) => t.status === status);
}

/**
 * Returns a priority emoji for display
 */
export function priorityEmoji(priority) {
  const map = { high: "🔴", medium: "🟡", low: "🟢" };
  return map[priority] || "⚪";
}

/**
 * Returns a status emoji for display
 */
export function statusEmoji(status) {
  const map = {
    pending: "⏳",
    "in-progress": "🔄",
    completed: "✅",
    skipped: "⏭️",
  };
  return map[status] || "❓";
}
