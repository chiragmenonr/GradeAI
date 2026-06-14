import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import type { ClassAnalysis } from '../types';
import { getLetterGrade } from '../utils/gradeCalculations';

interface Props {
  analyses: ClassAnalysis[];
}

export function SubjectRadar({ analyses }: Props) {
  const data = analyses.map(a => ({
    subject: a.subject.length > 12 ? a.subject.slice(0, 12) + '…' : a.subject,
    grade: a.finalGrade,
    fullName: a.subject,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl border border-indigo-500/30 bg-white/5 p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
    >
      <h3 className="mb-1 font-semibold text-indigo-300">Subject Overview</h3>
      <p className="mb-4 text-xs text-white/35">Strengths vs. weaknesses across all classes</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#475569', fontSize: 10 }}
              tickCount={4}
            />
            <Radar
              dataKey="grade"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ fill: '#a855f7', r: 4 }}
            />
            <Tooltip
              contentStyle={{
                background: '#1e1b2e',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: '8px',
              }}
              formatter={(value: number, _: string, entry: { payload: { fullName: string } }) => [
                `${value.toFixed(2)}% (${getLetterGrade(value)})`,
                entry.payload.fullName,
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
