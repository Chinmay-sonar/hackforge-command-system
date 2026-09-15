import { z } from 'zod';

export const HackathonIntelSchema = z.object({
  name: z.string().describe('Official name of the hackathon'),
  tagline: z.string().optional().describe('Short tagline or subtitle'),
  
  dates: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    submissionDeadline: z.string().optional(),
    registrationDeadline: z.string().optional(),
  }).describe('All important dates'),

  location: z.object({
    type: z.enum(['online', 'offline', 'hybrid', 'unknown']),
    place: z.string().optional(),
  }),

  themes: z.array(z.string()).describe('Hackathon tracks or themes'),

  prizes: z.array(z.object({
    position: z.string(),
    reward: z.string(),
  })).describe('Prize breakdown'),

  eligibility: z.object({
    whoCanParticipate: z.string().optional(),
    restrictions: z.array(z.string()).optional(),
  }),

  teamSize: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }),

  submissionRequirements: z.array(z.string())
    .describe('What needs to be submitted'),

  judgingCriteria: z.array(z.object({
    criterion: z.string(),
    weight: z.string().optional(),
  })),

  techStack: z.object({
    mandatoryAPIs: z.array(z.string()).optional(),
    suggestedTools: z.array(z.string()).optional(),
    sponsorTech: z.array(z.string()).optional(),
  }),

  importantLinks: z.object({
    register: z.string().url().optional(),
    submitProject: z.string().url().optional(),
    discord: z.string().url().optional(),
    devpost: z.string().url().optional(),
    others: z.array(z.string()).optional(),
  }),

  rawSummary: z.string()
    .describe('LLM-generated 3-5 sentence summary of the hackathon'),

  scrapedAt: z.string().describe('ISO timestamp of when this was scraped'),
  sourceUrl: z.string().url().describe('The URL that was scraped'),
});

export const validateIntel = (data) => {
  const result = HackathonIntelSchema.safeParse(data);
  if (!result.success) {
    console.warn('⚠️  Validation warnings:', result.error.flatten());
    return { valid: false, data: null, errors: result.error.flatten() };
  }
  return { valid: true, data: result.data, errors: null };
};