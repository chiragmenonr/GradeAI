import type { ClassData } from '../types';

export function getColorClass(avg: number): string {
  if (avg >= 92.5) return 'text-green-400';
  if (avg >= 72.5) return 'text-yellow-400';
  return 'text-red-400';
}

export function getBorderGlowClass(avg: number): string {
  if (avg >= 92.5) return 'border-green-500/40 shadow-[0_0_20px_rgba(74,222,128,0.2)]';
  if (avg >= 72.5) return 'border-yellow-500/40 shadow-[0_0_20px_rgba(250,204,21,0.2)]';
  return 'border-red-500/40 shadow-[0_0_20px_rgba(248,113,113,0.2)]';
}

// Letter grade uses x-0.50 thresholds so that a displayed value rounds to the cutoff.
// e.g. 92.50 rounds to 93 → A; 96.50 rounds to 97 → A+
export function getLetterGrade(pct: number): string {
  if (pct >= 96.5) return 'A+';
  if (pct >= 92.5) return 'A';
  if (pct >= 89.5) return 'A-';
  if (pct >= 86.5) return 'B+';
  if (pct >= 82.5) return 'B';
  if (pct >= 79.5) return 'B-';
  if (pct >= 76.5) return 'C+';
  if (pct >= 72.5) return 'C';
  if (pct >= 69.5) return 'C-';
  if (pct >= 66.5) return 'D+';
  if (pct >= 62.5) return 'D';
  if (pct >= 59.5) return 'D-';
  return 'F';
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export interface WeightedGradeResult {
  assignmentPercentages: number[];
  assignmentAvg: number;
  finalGrade: number;
  letterGrade: string;
  highestGrade: number;
  lowestGrade: number;
  assignmentCount: number;
  categoryBreakdown?: Record<string, { avg: number; weight: number; count: number; highest: number; lowest: number }>;
  // top-weight category (for WhatYouNeed)
  topCategoryKey?: string;
  topCategoryLabel?: string;
  topCategoryWeight?: number;
  topCategoryTotalScore?: number;
  topCategoryTotalPoints?: number;
  topCategoryAvgMaxPoints?: number;
  // standard weighted fields
  midtermPct: number | null;
  finalPct: number | null;
  midtermWeight: number;
  finalWeight: number;
  assignmentWeight: number;
  totalScore: number;
  totalPoints: number;
  avgMaxPoints: number;
}

export function calculateWeightedGrade(classData: ClassData): WeightedGradeResult {
  const midtermWeight = Math.max(0, parseFloat(classData.midterm.weight) / 100 || 0);
  const finalWeight = Math.max(0, parseFloat(classData.final.weight) / 100 || 0);

  // ── Category-weighted path (AI-parsed data with weightConfig) ──────────
  if (classData.weightConfig && Object.keys(classData.weightConfig).length > 0) {
    const config = classData.weightConfig;

    // Group assignments by type
    const groups: Record<string, { scores: number[]; maxes: number[] }> = {};
    for (const a of classData.assignments) {
      const type = (a.type ?? 'OTHER').toUpperCase();
      const score = parseFloat(a.score);
      const max = parseFloat(a.maxPoints);
      if (isNaN(score)) continue;
      if (!groups[type]) groups[type] = { scores: [], maxes: [] };
      groups[type].scores.push(score);
      // XC items have maxPoints=0 — add to numerator but not denominator
      groups[type].maxes.push(isNaN(max) ? 0 : max);
    }

    const breakdown: Record<string, { avg: number; weight: number; count: number; highest: number; lowest: number }> = {};
    let finalGrade = 0;
    const allPercentages: number[] = [];

    for (const [type, weight] of Object.entries(config)) {
      const g = groups[type.toUpperCase()];
      if (!g || g.scores.length === 0) continue;
      const totalScore = g.scores.reduce((s, v) => s + v, 0);
      const totalMax = g.maxes.filter(m => m > 0).reduce((s, v) => s + v, 0);
      const avg = totalMax > 0 ? round2((totalScore / totalMax) * 100) : 0;

      const perPcts: number[] = [];
      for (let i = 0; i < g.scores.length; i++) {
        if (g.maxes[i] > 0) {
          perPcts.push(round2((g.scores[i] / g.maxes[i]) * 100));
          allPercentages.push(round2((g.scores[i] / g.maxes[i]) * 100));
        }
      }
      const highest = perPcts.length > 0 ? round2(Math.max(...perPcts)) : 0;
      const lowest = perPcts.length > 0 ? round2(Math.min(...perPcts)) : 0;
      breakdown[type] = { avg, weight, count: g.scores.length, highest, lowest };
      finalGrade += avg * weight;
    }
    finalGrade = round2(finalGrade);

    // Midterm / final (optional — add on top)
    let midtermPct: number | null = null;
    const ms = parseFloat(classData.midterm.score);
    const mm = parseFloat(classData.midterm.maxPoints);
    if (!isNaN(ms) && !isNaN(mm) && mm > 0) {
      midtermPct = round2((ms / mm) * 100);
      finalGrade = round2(finalGrade + midtermPct * midtermWeight);
    }

    let finalPct: number | null = null;
    const fs = parseFloat(classData.final.score);
    const fm = parseFloat(classData.final.maxPoints);
    if (!isNaN(fs) && !isNaN(fm) && fm > 0) {
      finalPct = round2((fs / fm) * 100);
      finalGrade = round2(finalGrade + finalPct * finalWeight);
    }

    const highestGrade = allPercentages.length > 0 ? round2(Math.max(...allPercentages)) : 0;
    const lowestGrade = allPercentages.length > 0 ? round2(Math.min(...allPercentages)) : 0;

    // Find highest-weight category for WhatYouNeed
    const topEntry = Object.entries(config).reduce((best, [k, w]) => w > best[1] ? [k, w] : best, ['', 0]);
    const topKey = topEntry[0].toUpperCase();
    const topGroup = groups[topKey];
    const topTotalScore = topGroup ? topGroup.scores.reduce((s, v) => s + v, 0) : 0;
    const topTotalMax = topGroup ? topGroup.maxes.filter(m => m > 0).reduce((s, v) => s + v, 0) : 0;
    const topAvgMax = topGroup && topGroup.maxes.filter(m => m > 0).length > 0
      ? round2(topTotalMax / topGroup.maxes.filter(m => m > 0).length) : 100;

    // Category label maps
    const typeLabels: Record<string, string> = {
      HW: 'Homework', QZ: 'Quiz', TS: 'Test', GA: 'Assignment', XC: 'Extra Credit',
    };

    return {
      assignmentPercentages: allPercentages,
      assignmentAvg: round2(allPercentages.reduce((s, v) => s + v, 0) / (allPercentages.length || 1)),
      finalGrade,
      letterGrade: getLetterGrade(finalGrade),
      highestGrade,
      lowestGrade,
      assignmentCount: classData.assignments.filter(a => !isNaN(parseFloat(a.score))).length,
      categoryBreakdown: breakdown,
      topCategoryKey: topKey,
      topCategoryLabel: typeLabels[topKey] ?? topKey,
      topCategoryWeight: topEntry[1],
      topCategoryTotalScore: topTotalScore,
      topCategoryTotalPoints: topTotalMax,
      topCategoryAvgMaxPoints: topAvgMax,
      midtermPct,
      finalPct,
      midtermWeight,
      finalWeight,
      assignmentWeight: 1 - midtermWeight - finalWeight,
      totalScore: topTotalScore,
      totalPoints: topTotalMax,
      avgMaxPoints: topAvgMax,
    };
  }

  // ── Points-based path (manual entry, no weightConfig) ─────────────────
  const assignmentWeight = Math.max(0, 1 - midtermWeight - finalWeight);

  const completed = classData.assignments.filter(a => {
    const s = parseFloat(a.score), m = parseFloat(a.maxPoints);
    return !isNaN(s) && !isNaN(m) && m > 0;
  });

  const totalScore = completed.reduce((s, a) => s + parseFloat(a.score), 0);
  const totalPoints = completed.reduce((s, a) => s + parseFloat(a.maxPoints), 0);
  const assignmentAvg = totalPoints > 0 ? round2((totalScore / totalPoints) * 100) : 0;
  const avgMaxPoints = completed.length > 0 ? round2(totalPoints / completed.length) : 100;
  const assignmentPercentages = completed.map(a => round2((parseFloat(a.score) / parseFloat(a.maxPoints)) * 100));

  let finalGrade = assignmentAvg * assignmentWeight;

  let midtermPct: number | null = null;
  const ms = parseFloat(classData.midterm.score);
  const mm = parseFloat(classData.midterm.maxPoints);
  if (!isNaN(ms) && !isNaN(mm) && mm > 0) {
    midtermPct = round2((ms / mm) * 100);
    finalGrade += midtermPct * midtermWeight;
  }

  let finalPct: number | null = null;
  const fs = parseFloat(classData.final.score);
  const fm = parseFloat(classData.final.maxPoints);
  if (!isNaN(fs) && !isNaN(fm) && fm > 0) {
    finalPct = round2((fs / fm) * 100);
    finalGrade += finalPct * finalWeight;
  }

  finalGrade = round2(finalGrade);

  const highestGrade = assignmentPercentages.length > 0 ? round2(Math.max(...assignmentPercentages)) : 0;
  const lowestGrade = assignmentPercentages.length > 0 ? round2(Math.min(...assignmentPercentages)) : 0;

  return {
    assignmentPercentages,
    assignmentAvg,
    finalGrade,
    letterGrade: getLetterGrade(finalGrade),
    highestGrade,
    lowestGrade,
    assignmentCount: completed.length,
    midtermPct,
    finalPct,
    midtermWeight,
    finalWeight,
    assignmentWeight,
    totalScore,
    totalPoints,
    avgMaxPoints,
  };
}

/**
 * Needed percentage on next assignment of `nextMaxPoints` to reach `target` final grade.
 * Works for both plain and category-weighted scenarios.
 */
export function scoreNeededForTargetWeighted(
  totalScore: number,
  totalPoints: number,
  assignmentWeight: number,
  fixedContrib: number,
  target: number,
  nextMaxPoints: number
): number {
  if (assignmentWeight <= 0) return Infinity;
  const neededScore =
    ((target - fixedContrib) / assignmentWeight / 100) * (totalPoints + nextMaxPoints) - totalScore;
  return round2((neededScore / nextMaxPoints) * 100);
}
