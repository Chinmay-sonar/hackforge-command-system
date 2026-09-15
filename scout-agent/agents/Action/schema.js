import { z } from "zod";

/* =========================
   Enums
========================= */

export const PriorityEnum = z.enum([
  "high",
  "medium",
  "low",
]);

export const StatusEnum = z.enum([
  "pending",
  "in-progress",
  "completed",
  "skipped",
]);

/* =========================
   Action Agent Task
========================= */

export const TaskSchema = z.object({
  id: z.string(),

  title: z.string(),

  description: z.string().optional(),

  priority: PriorityEnum,

  status: StatusEnum.default("pending"),

  deadline: z.string().nullable().optional(),

  tags: z.array(z.string()).default([]),

  estimatedHours: z.number().nullable().optional(),

  createdAt: z.string(),

  updatedAt: z.string(),

  completedAt: z.string().nullable().optional(),

  reminderSent: z.boolean().default(false),

  notes: z.string().optional(),
});

/* =========================
   Action Agent State
========================= */

export const ActionStateSchema = z.object({
  hackathonName: z.string(),

  generatedAt: z.string(),

  lastUpdatedAt: z.string(),

  tasks: z.array(TaskSchema).default([]),
});

/* =========================
   Strategy Agent Output
========================= */

export const StrategyOutputSchema = z.object({
  hackathonName: z.string(),

  generatedAt: z.string().optional(),

  sourceIntelFile: z.string().optional(),

  projectIdeas: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        whyItFits: z.string(),
        difficulty: z.enum([
          "easy",
          "medium",
          "hard",
        ]),
      })
    )
    .default([]),

  recommendedTechStack: z.object({
    frontend: z.array(z.string()).optional(),
    backend: z.array(z.string()).optional(),
    aiMl: z.array(z.string()).optional(),
    apisToUse: z.array(z.string()).optional(),
    reasoning: z.string().optional(),
  }),

  timeline: z
    .array(
      z.object({
        phase: z.string(),
        duration: z.string(),
        tasks: z.array(z.string()),
      })
    )
    .default([]),

  teamRoles: z
    .array(
      z.object({
        role: z.string(),
        responsibilities: z.array(z.string()),
      })
    )
    .optional(),

  riskFactors: z.array(z.string()).optional(),

  winningTips: z.array(z.string()).optional(),
});

/* =========================
   Export Types
========================= */

export const Schemas = {
  PriorityEnum,
  StatusEnum,
  TaskSchema,
  ActionStateSchema,
  StrategyOutputSchema,
};

export default Schemas;