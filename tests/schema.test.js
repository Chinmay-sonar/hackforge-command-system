import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hackathonInfoSchema } from '../scout-agent/src/schema.js';

describe('HackForge Schema Validation Suite', () => {
  it('should successfully parse valid hackathon intelligence payload', () => {
    const mockData = {
      hackathonName: 'AMD Developer Hackathon ACT II',
      theme: 'Real-time Multimodal AI',
      description: 'Full-stack video captioning and sentiment telemetry competition.',
      dates: {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        submissionDeadline: '2026-06-25'
      },
      judgingCriteria: [
        {
          name: 'Technical Execution',
          description: 'Complexity and stability of inference pipelines.',
          weight: '40%'
        }
      ],
      rules: ['Open source license', 'Team size max 4'],
      requiredTechOrApis: ['AMD ROCm', 'PyTorch'],
      submissionRequirements: ['GitHub Repository', 'Video Demo'],
      prizes: [
        {
          title: 'First Place Winner',
          description: 'Top prize for overall innovation'
        }
      ],
      sourceUrl: 'https://amd.devpost.com',
      extractionConfidence: 'high',
      missingInfoNotes: []
    };

    const parsed = hackathonInfoSchema.safeParse(mockData);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.hackathonName, 'AMD Developer Hackathon ACT II');
    assert.equal(parsed.data.extractionConfidence, 'high');
  });

  it('should gracefully accept nullable date fields and empty arrays when not specified', () => {
    const minimalData = {
      hackathonName: 'Open Space Hack',
      theme: null,
      description: 'Open innovation hackathon.',
      dates: {
        startDate: null,
        endDate: null,
        submissionDeadline: null
      },
      judgingCriteria: [],
      rules: [],
      requiredTechOrApis: [],
      submissionRequirements: [],
      prizes: [],
      sourceUrl: 'https://example.com/hack',
      extractionConfidence: 'low',
      missingInfoNotes: ['Judging criteria not published yet']
    };

    const parsed = hackathonInfoSchema.safeParse(minimalData);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.theme, null);
    assert.deepEqual(parsed.data.rules, []);
    assert.equal(parsed.data.extractionConfidence, 'low');
  });

  it('should fail validation when hackathonName is missing or invalid confidence', () => {
    const invalidData = {
      theme: 'AI Exploration',
      description: 'Missing name test payload',
      sourceUrl: 'https://example.com',
      extractionConfidence: 'invalid-tier'
    };

    const parsed = hackathonInfoSchema.safeParse(invalidData);
    assert.equal(parsed.success, false);
  });
});
