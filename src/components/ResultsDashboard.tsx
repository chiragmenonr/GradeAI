import { motion } from 'framer-motion';
import type { ClassAnalysis, ClassData } from '../types';
import { StatCards } from './StatCards';
import type { TypeBreakdownEntry } from './StatCards';
import { GradeChart } from './GradeChart';
import type { AssignmentMeta } from './GradeChart';
import { CombinedTypeChart } from './CombinedTypeChart';
import type { GradedItem } from './CombinedTypeChart';
import { WhatYouNeed } from './WhatYouNeed';
import { StreamingInsight } from './StreamingInsight';

const TYPE_LABEL: Record<string, string> = {
  HW: 'Homework',
  QZ: 'Quiz',
  TS: 'Test',
  GA: 'Graded Assignment',
  XC: 'Extra Credit',
};

interface Props {
  analysis: ClassAnalysis;
  classData: ClassData;
  streamingText: string;
  streamingDone: boolean;
}

function round2(x: number) { return Math.round(x * 100) / 100; }

export function ResultsDashboard({ analysis, classData, streamingText, streamingDone }: Props) {
  const {
    subject, finalGrade, letterGrade, highestGrade, lowestGrade, assignmentCount,
    assignmentAvg,
    midtermPct, finalPct, midtermWeight, finalWeight, assignmentWeight,
    totalScore, totalPoints, avgMaxPoints,
    categoryBreakdown,
    topCategoryLabel, topCategoryWeight, topCategoryTotalScore, topCategoryTotalPoints, topCategoryAvgMaxPoints,
  } = analysis;

  const fixedContrib = (midtermPct ?? 0) * midtermWeight + (finalPct ?? 0) * finalWeight;

  const whatYouNeedProps = topCategoryTotalPoints !== undefined
    ? {
        totalScore: topCategoryTotalScore ?? 0,
        totalPoints: topCategoryTotalPoints ?? 0,
        assignmentWeight: topCategoryWeight ?? assignmentWeight,
        fixedContrib: finalGrade - (topCategoryWeight ?? 0) * ((topCategoryTotalScore ?? 0) / Math.max(topCategoryTotalPoints ?? 1, 0.001) * 100),
        avgMaxPoints: topCategoryAvgMaxPoints ?? avgMaxPoints,
        letterGrade,
        categoryLabel: topCategoryLabel,
        categoryWeight: topCategoryWeight,
      }
    : { totalScore, totalPoints, assignmentWeight, fixedContrib, avgMaxPoints, letterGrade };

  const hasBreakdown = categoryBreakdown && Object.keys(categoryBreakdown).length > 0;

  const typeBreakdown: TypeBreakdownEntry[] | undefined = hasBreakdown
    ? Object.entries(categoryBreakdown!).map(([type, d]) => ({
        type,
        avg: d.avg,
        highest: d.highest,
        lowest: d.lowest,
        count: d.count,
      }))
    : undefined;

  const scoredAssignments = classData.assignments.filter(a => {
    const s = parseFloat(a.score);
    const m = parseFloat(a.maxPoints);
    return !isNaN(s) && !isNaN(m) && m > 0;
  });

  const anyDate = scoredAssignments.some(a => !!a.date);

  const chronological = anyDate
    ? [...scoredAssignments].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      })
    : scoredAssignments;

  const mainGrades = chronological.map(a =>
    round2(parseFloat(a.score) / parseFloat(a.maxPoints) * 100)
  );
  const mainMeta: AssignmentMeta[] = chronological.map(a => ({
    name: a.name,
    type: a.type,
    date: a.date,
  }));

  const typeGroupMap = new Map<string, GradedItem[]>();
  for (const a of chronological) {
    if (!a.type) continue;
    const t = a.type.toUpperCase();
    if (!typeGroupMap.has(t)) typeGroupMap.set(t, []);
    typeGroupMap.get(t)!.push({
      name: a.name,
      type: t,
      date: a.date,
      grade: round2(parseFloat(a.score) / parseFloat(a.maxPoints) * 100),
    });
  }

  const tsItems = typeGroupMap.get('TS') ?? [];
  const qzItems = typeGroupMap.get('QZ') ?? [];
  const showCombined = tsItems.length > 1 && qzItems.length > 1;
  const soloTypeEntries = Array.from(typeGroupMap.entries()).filter(
    ([type, items]) => items.length > 1 && (!showCombined || (type !== 'TS' && type !== 'QZ'))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Subject label */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white/80">{subject}</h2>
        <span className="text-sm text-slate-400 dark:text-white/35">{finalGrade.toFixed(2)}% · {letterGrade}</span>
      </div>

      {/* Stat cards */}
      <StatCards
        finalGrade={finalGrade}
        highestGrade={highestGrade}
        lowestGrade={lowestGrade}
        assignmentCount={assignmentCount}
        typeBreakdown={typeBreakdown}
      />

      {/* Category breakdown */}
      {hasBreakdown && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-white/35">Category Breakdown</p>
          <div className="space-y-2">
            {Object.entries(categoryBreakdown!).map(([type, { avg, weight, count }]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-10 rounded bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-center text-xs text-slate-500 dark:text-white/50">{type}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-slate-400 dark:text-white/40 mb-1">
                    <span>{count} items · {(weight * 100).toFixed(0)}% of grade</span>
                    <span>{avg.toFixed(2)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                      style={{ width: `${Math.min(avg, 110)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Midterm/Final breakdown */}
      {!hasBreakdown && (midtermPct !== null || finalPct !== null) && (
        <div className={`grid gap-3 ${assignmentWeight > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {assignmentWeight > 0 && chronological.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-white/35">Assignments</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{assignmentAvg.toFixed(2)}%</p>
              <p className="text-xs text-slate-400 dark:text-white/30">{(assignmentWeight * 100).toFixed(0)}% of grade</p>
            </div>
          )}
          {midtermPct !== null && (
            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-white/35">Midterm</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{midtermPct.toFixed(2)}%</p>
              <p className="text-xs text-slate-400 dark:text-white/30">{(midtermWeight * 100).toFixed(0)}% of grade</p>
            </div>
          )}
          {finalPct !== null && (
            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-white/35">Final Exam</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{finalPct.toFixed(2)}%</p>
              <p className="text-xs text-slate-400 dark:text-white/30">{(finalWeight * 100).toFixed(0)}% of grade</p>
            </div>
          )}
        </div>
      )}

      {/* Overall grade history */}
      {mainGrades.length > 1 && (
        <div className="rounded-xl border border-purple-500/20 bg-white dark:bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-purple-600 dark:text-purple-300">Grade History</h3>
          <GradeChart
            grades={mainGrades}
            assignments={mainMeta}
            gradientId={`${analysis.classId}-main`}
          />
        </div>
      )}

      {/* Combined Tests & Quizzes chart */}
      {showCombined && (
        <div className="rounded-xl border border-purple-500/15 bg-white dark:bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-purple-600/90 dark:text-purple-300/80">Tests &amp; Quizzes History</h3>
          <CombinedTypeChart
            aItems={tsItems}
            bItems={qzItems}
            labelA="Tests"
            labelB="Quizzes"
            gradientId={`${analysis.classId}-tsqz`}
          />
        </div>
      )}

      {/* Per-type grade history (solo types) */}
      {soloTypeEntries.map(([type, items], idx) => (
        <div key={type} className="rounded-xl border border-purple-500/15 bg-white dark:bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-purple-600/90 dark:text-purple-300/80">
            {TYPE_LABEL[type] ?? type} History
          </h3>
          <GradeChart
            grades={items.map(i => i.grade)}
            assignments={items}
            gradientId={`${analysis.classId}-${type}-${idx}`}
            compact
          />
        </div>
      ))}

      {/* What You Need */}
      <WhatYouNeed {...whatYouNeedProps} />

      {/* Streaming AI insight */}
      <StreamingInsight text={streamingText} isDone={streamingDone} />
    </motion.div>
  );
}
