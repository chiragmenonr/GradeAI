export interface Assignment {
  id: string;
  name: string;
  score: string;
  maxPoints: string;
  date?: string;          // ISO "2025-10-10", display only when present
  type?: string;          // "HW" | "QZ" | "TS" | "GA" | "XC" | custom
  isExtraCredit?: boolean;
}

export interface ExamEntry {
  score: string;
  maxPoints: string;
  weight: string; // percentage string e.g. "25" = 25% of final grade
}

export interface ClassData {
  id: string;
  subject: string;
  assignments: Assignment[];
  midterm: ExamEntry;
  final: ExamEntry;
  weightConfig?: Record<string, number>; // { HW: 0.10, QZ: 0.20, GA: 0.25, TS: 0.45 }
  rawInput?: string;    // last pasted text — used for UI state only
  inputMode?: 'input' | 'edit'; // which panel is shown in ClassCard
}

export interface ClassAnalysis {
  classId: string;
  subject: string;
  // calculated grade metrics
  assignmentPercentages: number[];
  assignmentAvg: number;
  finalGrade: number;
  letterGrade: string;
  highestGrade: number;
  lowestGrade: number;
  assignmentCount: number;
  categoryBreakdown?: Record<string, { avg: number; weight: number; count: number; highest: number; lowest: number }>;
  // weighted calculation fields (used by WhatYouNeed)
  midtermPct: number | null;
  finalPct: number | null;
  midtermWeight: number;
  finalWeight: number;
  assignmentWeight: number;
  totalScore: number;
  totalPoints: number;
  avgMaxPoints: number;
  // highest-weight category info (for WhatYouNeed when weightConfig is present)
  topCategoryKey?: string;
  topCategoryLabel?: string;
  topCategoryWeight?: number;
  topCategoryTotalScore?: number;
  topCategoryTotalPoints?: number;
  topCategoryAvgMaxPoints?: number;
  // AI content — streams in after initial render
  trends: string;
  motivationalInsight: string;
}
