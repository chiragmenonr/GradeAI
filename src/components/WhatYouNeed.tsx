import { motion } from 'framer-motion';
import { scoreNeededForTargetWeighted } from '../utils/gradeCalculations';

interface Props {
  totalScore: number;
  totalPoints: number;
  assignmentWeight: number;
  fixedContrib: number;
  avgMaxPoints: number;
  letterGrade: string;
  categoryLabel?: string;
  categoryWeight?: number;
}

const GRADE_LADDER = [
  { grade: 'A+', threshold: 96.50 },
  { grade: 'A',  threshold: 92.50 },
  { grade: 'A-', threshold: 89.50 },
  { grade: 'B+', threshold: 86.50 },
  { grade: 'B',  threshold: 82.50 },
  { grade: 'B-', threshold: 79.50 },
  { grade: 'C+', threshold: 76.50 },
  { grade: 'C',  threshold: 72.50 },
  { grade: 'C-', threshold: 69.50 },
  { grade: 'D+', threshold: 66.50 },
  { grade: 'D',  threshold: 62.50 },
  { grade: 'D-', threshold: 59.50 },
  { grade: 'F',  threshold: 0 },
];

type Role = 'above' | 'current' | 'below';

const ROLE_STYLE: Record<Role, { color: string; borderCls: string; badge: string; verb: string }> = {
  above:   { color: 'text-green-400',  borderCls: 'border-green-500/30 shadow-[0_0_12px_rgba(74,222,128,0.12)]',  badge: '↑', verb: 'Reach' },
  current: { color: 'text-purple-400', borderCls: 'border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.18)]', badge: '●', verb: 'Maintain' },
  below:   { color: 'text-amber-400',  borderCls: 'border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.12)]',  badge: '↓', verb: 'Floor of' },
};

function rawScore(pct: number, avgMaxPoints: number): string {
  const raw = Math.round(pct / 100 * avgMaxPoints);
  const max = Math.round(avgMaxPoints);
  return `${raw} / ${max}`;
}

function formatDisplay(pct: number, role: Role, avgMaxPoints: number): { main: string; sub: string } {
  if (role === 'current') {
    if (pct <= 0) return { main: 'Secured ✓', sub: 'Even 0 keeps this grade' };
    if (pct > 100) return { main: 'Secured ✓', sub: 'No single score drops you' };
    return { main: rawScore(pct, avgMaxPoints), sub: `Get ≥ this to maintain` };
  }
  if (role === 'above') {
    if (pct <= 0) return { main: 'You\'re here ✓', sub: 'Already at this level' };
    if (pct > 100) return { main: 'Not in 1', sub: 'Needs multiple strong scores' };
    return { main: rawScore(pct, avgMaxPoints), sub: 'Get ≥ this to reach' };
  }
  // below
  if (pct <= 0) return { main: 'Safe ✓', sub: 'Can\'t drop here in one assignment' };
  if (pct > 100) return { main: 'Safe ✓', sub: 'Impossible to drop this low' };
  return { main: rawScore(pct, avgMaxPoints), sub: 'Minimum to stay in this grade' };
}

export function WhatYouNeed({
  totalScore, totalPoints, assignmentWeight, fixedContrib, avgMaxPoints,
  letterGrade, categoryLabel, categoryWeight,
}: Props) {
  if (assignmentWeight <= 0) {
    return (
      <div className="rounded-xl border border-blue-500/30 bg-white/5 p-4 text-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <p className="text-sm text-white/40">
          Your grade is fully determined by exams — no assignment contribution.
        </p>
      </div>
    );
  }

  const currentIdx = GRADE_LADDER.findIndex(g => g.grade === letterGrade);
  const safeIdx = currentIdx >= 0 ? currentIdx : GRADE_LADDER.length - 1;
  const last = GRADE_LADDER.length - 1;

  // Determine 3 card indices with edge-case handling
  let indices: [number, number, number];
  if (safeIdx === 0) {
    // A+: show A+, A, B+
    indices = [0, 1, 3];
  } else if (safeIdx >= last) {
    // F: show D, D-, F
    indices = [last - 2, last - 1, last];
  } else {
    indices = [safeIdx - 1, safeIdx, safeIdx + 1];
  }

  const cards = indices.map((gradeIdx, pos) => {
    const { grade, threshold } = GRADE_LADDER[gradeIdx];
    const role: Role = gradeIdx < safeIdx ? 'above' : gradeIdx === safeIdx ? 'current' : 'below';
    const pct = scoreNeededForTargetWeighted(
      totalScore, totalPoints, assignmentWeight, fixedContrib, threshold, avgMaxPoints
    );
    const { main, sub } = formatDisplay(pct, role, avgMaxPoints);
    return { grade, role, main, sub, pos };
  });

  const nextLabel = categoryLabel
    ? `next ${categoryLabel}${categoryWeight ? ` (${(categoryWeight * 100).toFixed(0)}% of grade)` : ''}`
    : `next assignment (~${Math.round(avgMaxPoints)} pts)`;

  return (
    <div>
      <p className="mb-2 text-xs text-white/35">Score needed on {nextLabel}:</p>
      <div className="grid grid-cols-3 gap-3">
        {cards.map(({ grade, role, main, sub }, i) => {
          const { color, borderCls, badge, verb } = ROLE_STYLE[role];
          return (
            <motion.div
              key={grade}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.35 }}
              className={`rounded-xl border bg-white/5 p-3 text-center ${borderCls}`}
            >
              <div className="mb-1 flex items-center justify-center gap-1">
                <span className={`text-[10px] ${color} opacity-70`}>{badge}</span>
                <span className="text-[10px] text-white/35 uppercase tracking-wide">{verb}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{grade}</p>
              <p className="mt-1 text-sm font-semibold text-white tabular-nums">{main}</p>
              <p className="mt-0.5 text-[10px] text-white/30 leading-tight">{sub}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
