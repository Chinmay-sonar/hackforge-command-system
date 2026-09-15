import { z } from 'zod';

export const StrategyPlanSchema = z.object({
  hackathonName: z.string().describe('Name of the hackathon this plan is for'),

  projectIdeas: z.array(z.object({
    title: z.string(),
    description: z.string().describe('2-3 sentence description of the idea'),
    whyItFits: z.string().describe('Why this idea matches the themes/judging criteria/prizes'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })).describe('2-4 concrete project ideas tailored to this hackathon'),

  recommendedTechStack: z.object({
    frontend: z.array(z.string()).optional(),
    backend: z.array(z.string()).optional(),
    aiMl: z.array(z.string()).optional(),
    apisToUse: z.array(z.string()).optional(),
    reasoning: z.string().optional().describe('Why this stack was chosen given constraints'),
  }),

  timeline: z.array(z.object({
    phase: z.string().describe('e.g. "Day 1 - Research & Ideation"'),
    duration: z.string().describe('e.g. "6 hours" or "Day 1"'),
    tasks: z.array(z.string()),
  })).describe('Phase-by-phase plan fit to the actual hackathon dates'),

  teamRoles: z.array(z.object({
    role: z.string().describe('e.g. "Backend Dev", "ML Engineer", "Pitch Lead"'),
    responsibilities: z.array(z.string()),
  })).describe('Suggested roles based on teamSize from intel'),

  riskFactors: z.array(z.string()).describe('Things that could go wrong or eat time'),

  winningTips: z.array(z.string()).describe('Specific tips to score well on the judgingCriteria'),

  generatedAt: z.string().describe('ISO timestamp of when this plan was generated'),
  sourceIntelFile: z.string().describe('Path to the intel JSON this plan was based on'),
});

export const validateStrategy = (data) => {
  const result = StrategyPlanSchema.safeParse(data);
  if (!result.success) {
    console.warn('⚠️  Validation warnings:', result.error.flatten());
    return { valid: false, data: null, errors: result.error.flatten() };
  }
  return { valid: true, data: result.data, errors: null };
};
