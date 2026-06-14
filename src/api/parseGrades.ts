import Anthropic from '@anthropic-ai/sdk';

export interface ParsedAssignment {
  name: string;
  score: number;
  maxPoints: number;
  type?: string;
  date?: string;       // ISO YYYY-MM-DD
  isExtraCredit?: boolean;
}

export interface ParsedClassData {
  subject: string;
  weightConfig?: Record<string, number>; // { HW: 0.10, QZ: 0.20, ... }
  assignments: ParsedAssignment[];
}

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const EXTRACTION_PROMPT = `You are extracting grade data from a student record. Parse everything you can find.

Return ONLY valid JSON matching this exact schema:
{
  "subject": "full class name",
  "weightConfig": { "HW": 0.10, "QZ": 0.20, "GA": 0.25, "TS": 0.45 },
  "assignments": [
    {
      "name": "assignment name",
      "score": 85.5,
      "maxPoints": 100,
      "type": "HW",
      "date": "2025-10-10",
      "isExtraCredit": false
    }
  ]
}

Rules:
- weightConfig: only include if the document specifies category weights. Keys must be uppercase type codes. Values must sum to 1.0. If no weight config exists, omit the field entirely.
- For each assignment: extract the actual score earned and the max possible points separately.
- type: use the document's category codes (HW, QZ, TS, GA, XC, etc.) or infer from context. Uppercase only.
- isExtraCredit: true when score > maxPoints, OR when maxPoints is 0 (pure bonus), OR when labeled as extra credit/bonus.
- For extra credit where maxPoints = 0: set maxPoints to 0 exactly (do not invent a value).
- date: convert any date format to ISO YYYY-MM-DD. YYYYMMDD → YYYY-MM-DD. If no date, omit the field.
- score: if a ratio is given (e.g. 0.983), it means score/maxPoints, not the raw score. Compute score = ratio * maxPoints.
- Missing/zero assignments (0 out of anything): include them with score = 0, isExtraCredit = false.
- Include ALL assignments found, in the order they appear.
- Do not skip or summarize — include every single row.`;

async function extractFromContent(
  content: Anthropic.MessageParam['content']
): Promise<ParsedClassData> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    messages: [
      {
        role: 'user',
        content: [
          ...(Array.isArray(content) ? content : [{ type: 'text' as const, text: content as string }]),
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract structured data from the input.');

  const parsed = JSON.parse(jsonMatch[0]) as ParsedClassData;

  // Normalize: ensure all scores/maxPoints are numbers
  parsed.assignments = parsed.assignments.map(a => ({
    ...a,
    score: typeof a.score === 'string' ? parseFloat(a.score) : a.score,
    maxPoints: typeof a.maxPoints === 'string' ? parseFloat(a.maxPoints) : a.maxPoints,
    isExtraCredit: a.isExtraCredit ?? (a.maxPoints === 0 || a.score > a.maxPoints),
  }));

  return parsed;
}

export async function parseGradesFromText(text: string): Promise<ParsedClassData> {
  return extractFromContent([
    { type: 'text', text: `Here is the student grade data to parse:\n\n${text}` },
  ]);
}

export async function parseGradesFromPDF(base64: string): Promise<ParsedClassData> {
  return extractFromContent([
    {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64 },
    } as Anthropic.DocumentBlockParam,
  ]);
}
