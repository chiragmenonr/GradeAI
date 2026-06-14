import Anthropic from '@anthropic-ai/sdk';
import type { WeightedGradeResult } from '../utils/gradeCalculations';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

function buildContext(subject: string, w: WeightedGradeResult): string {
  const lines: string[] = [
    `Subject: ${subject}`,
    `Weighted grade: ${w.finalGrade.toFixed(2)}% (${w.letterGrade})`,
    `Assignments: ${w.assignmentCount} total`,
    w.highestGrade > 0 ? `Highest: ${w.highestGrade.toFixed(2)}%` : '',
    w.lowestGrade < Infinity ? `Lowest: ${w.lowestGrade.toFixed(2)}%` : '',
  ];

  if (w.categoryBreakdown) {
    lines.push('\nCategory breakdown:');
    for (const [type, { avg, weight, count }] of Object.entries(w.categoryBreakdown)) {
      lines.push(`  ${type}: ${avg.toFixed(2)}% avg (${(weight * 100).toFixed(0)}% of grade, ${count} items)`);
    }
  } else if (w.assignmentPercentages.length > 0) {
    lines.push(`\nScores: ${w.assignmentPercentages.map(p => p.toFixed(2) + '%').join(', ')}`);
  }

  if (w.midtermPct !== null) lines.push(`Midterm: ${w.midtermPct.toFixed(2)}% (${(w.midtermWeight * 100).toFixed(0)}% of grade)`);
  if (w.finalPct !== null) lines.push(`Final: ${w.finalPct.toFixed(2)}% (${(w.finalWeight * 100).toFixed(0)}% of grade)`);

  return lines.filter(Boolean).join('\n');
}

/**
 * Streams the AI analysis as chunks of plain text.
 * Format: [TRENDS]\n...\n[INSIGHT]\n...
 * Call parseInsightSections() on the final accumulated string.
 */
export async function* streamAnalysis(
  subject: string,
  weighted: WeightedGradeResult
): AsyncGenerator<string> {
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `You are an insightful academic performance coach. Analyze this grade data and write two sections. Write entirely in second person — use "you" and "your" throughout; never say "this student" or "the student". Be direct and specific — reference actual scores, flag any alarming grades, praise extra credit. No generic encouragement.

${buildContext(subject, weighted)}

Write in exactly this format (include the bracketed labels on their own lines):

[TRENDS]
3-4 sentences analyzing the specific performance trends, patterns, strengths, and weaknesses shown in your data.

[INSIGHT]
2-3 sentences of specific, honest, actionable coaching advice tailored to exactly what your numbers show.`,
      },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

/** Splits completed streaming text into trends + motivationalInsight. */
export function parseInsightSections(text: string): {
  trends: string;
  motivationalInsight: string;
} {
  const trendsMatch = text.match(/\[TRENDS\]\s*([\s\S]*?)(?=\[INSIGHT\]|$)/);
  const insightMatch = text.match(/\[INSIGHT\]\s*([\s\S]*?)$/);
  return {
    trends: trendsMatch?.[1]?.trim() ?? text.trim(),
    motivationalInsight: insightMatch?.[1]?.trim() ?? '',
  };
}
