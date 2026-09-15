import { z } from 'zod';

/**
 * The structured shape Scout extracts from a hackathon page.
 * This schema is used twice:
 *   1. Converted to JSON Schema and sent to Gemini as `responseJsonSchema`,
 *      so the model is constrained to return this shape.
 *   2. Used locally to `.parse()` the model's response before anything
 *      downstream is allowed to trust it.
 *
 * Every list defaults to an empty array and every optional fact defaults to
 * null rather than being omitted — an LLM that "forgets" a field is a much
 * harder bug to catch than one that explicitly says it found nothing.
 */
export const hackathonInfoSchema = z.object({
  hackathonName: z.string().describe('Official name of the hackathon as stated on the page.'),

  theme: z
    .string()
    .nullable()
    .describe('Central theme or focus area of the hackathon, or null if not stated.'),

  description: z
    .string()
    .describe('A 2-4 sentence summary of what the hackathon is, in your own words.'),

  dates: z.object({
    startDate: z
      .string()
      .nullable()
      .describe('Hackathon start date as stated on the page (use the page\'s own wording if not unambiguous).'),
    endDate: z.string().nullable().describe('Hackathon end date as stated on the page.'),
    submissionDeadline: z
      .string()
      .nullable()
      .describe('Final project submission deadline as stated on the page.'),
  }),

  judgingCriteria: z
    .array(
      z.object({
        name: z.string().describe('Name of the judging criterion, e.g. "Technical Complexity".'),
        description: z.string().nullable().describe('Explanation of the criterion, if given.'),
        weight: z
          .string()
          .nullable()
          .describe('Stated weight or percentage for this criterion, if given, else null.'),
      })
    )
    .describe('Judging criteria found on the page. Empty array if none are listed.'),

  rules: z
    .array(z.string())
    .describe('Key eligibility rules or constraints (team size, who can enter, code-of-conduct highlights, etc).'),

  requiredTechOrApis: z
    .array(z.string())
    .describe('Required or sponsor-provided APIs, SDKs, or technologies mentioned on the page.'),

  submissionRequirements: z
    .array(z.string())
    .describe('What must be submitted: e.g. GitHub repo link, demo video, pitch deck, live deploy link.'),

  prizes: z
    .array(
      z.object({
        title: z.string().describe('Prize or track name.'),
        description: z.string().nullable().describe('Prize details, if given.'),
      })
    )
    .describe('Prize tracks or categories mentioned on the page. Empty array if none found.'),

  sourceUrl: z.string().describe('The URL this information was extracted from.'),

  extractionConfidence: z
    .enum(['high', 'medium', 'low'])
    .describe(
      'Your honest confidence that this single page contained complete hackathon info. ' +
        'Use "low" if this looks like a landing page that links out to the real rules/submission page.'
    ),

  missingInfoNotes: z
    .array(z.string())
    .describe(
      'Notes on what expected info was NOT found on this page, e.g. "no judging criteria found", ' +
        '"submission deadline not stated, only event dates". Empty array if nothing notable is missing.'
    ),
});
