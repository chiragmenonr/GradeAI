import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getLetterGrade, getBorderGlowClass } from '../utils/gradeCalculations';

export interface TypeBreakdownEntry {
  type: string;
  avg: number;
  highest: number;
  lowest: number;
  count: number;
}

interface Props {
  finalGrade: number;
  highestGrade: number;
  lowestGrade: number;
  assignmentCount: number;
  typeBreakdown?: TypeBreakdownEntry[];
}

function CountUp({ target, duration = 800 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * 100) / 100);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return <>{value.toFixed(2)}</>;
}

export function StatCards({ finalGrade, highestGrade, lowestGrade, assignmentCount, typeBreakdown }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hasBreakdown = !!typeBreakdown && typeBreakdown.length > 0;

  const miniCols = !hasBreakdown ? 1
    : typeBreakdown!.length === 1 ? 1
    : typeBreakdown!.length === 3 ? 3
    : 2;

  const cards = [
    {
      id: 'avg', label: 'Current Average', value: finalGrade, extra: getLetterGrade(finalGrade),
      borderCls: getBorderGlowClass(finalGrade), delay: 0, isCount: false,
      getVal: (e: TypeBreakdownEntry) => `${e.avg.toFixed(1)}%`,
    },
    {
      id: 'high', label: 'Highest Grade', value: highestGrade, extra: getLetterGrade(highestGrade),
      borderCls: 'border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.15)]', delay: 0.1, isCount: false,
      getVal: (e: TypeBreakdownEntry) => `${e.highest.toFixed(1)}%`,
    },
    {
      id: 'low', label: 'Lowest Grade', value: lowestGrade, extra: getLetterGrade(lowestGrade),
      borderCls: getBorderGlowClass(lowestGrade), delay: 0.2, isCount: false,
      getVal: (e: TypeBreakdownEntry) => `${e.lowest.toFixed(1)}%`,
    },
    {
      id: 'count', label: 'Assignments', value: assignmentCount, extra: undefined,
      borderCls: 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]', delay: 0.3, isCount: true,
      getVal: (e: TypeBreakdownEntry) => `${e.count}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(card => {
        const isHovered = hoveredId === card.id && hasBreakdown;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: card.delay, ease: 'easeOut' }}
            onMouseEnter={() => hasBreakdown && setHoveredId(card.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative min-h-[90px] overflow-hidden rounded-xl border bg-white dark:bg-white/5 p-4 ${card.borderCls} ${hasBreakdown ? 'cursor-default' : ''}`}
          >
            {/* Main content */}
            <div className={`transition-opacity duration-150 ${isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <p className="mb-1 text-xs text-slate-400 dark:text-white/40">{card.label}</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {card.isCount ? card.value : <CountUp target={card.value} />}
                {card.isCount ? '' : '%'}
              </p>
              {card.extra && <p className="mt-1 text-sm font-medium text-slate-500 dark:text-white/50">{card.extra}</p>}
              {hasBreakdown && (
                <p className="mt-1 text-[10px] text-slate-300 dark:text-white/20">hover for breakdown</p>
              )}
            </div>

            {/* Breakdown mini-cards */}
            {isHovered && (
              <div
                className="absolute inset-0 p-2"
                style={{ display: 'grid', gridTemplateColumns: `repeat(${miniCols}, 1fr)`, gap: '5px' }}
              >
                {typeBreakdown!.map((e, i) => (
                  <motion.div
                    key={e.type}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.15 }}
                    className="flex flex-col items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-center px-1"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-white/45">
                      {e.type}
                    </span>
                    <span className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white leading-none">
                      {card.getVal(e)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
