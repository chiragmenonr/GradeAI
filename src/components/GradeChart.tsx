import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface AssignmentMeta {
  name: string;
  type?: string;
  date?: string;
}

interface Props {
  grades: number[];
  assignments?: AssignmentMeta[];
  gradientId?: string;
  compact?: boolean;
}

function formatDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

function makeLabel(i: number, assignments?: AssignmentMeta[]): string {
  const a = assignments?.[i];
  if (!a) return `#${i + 1}`;
  const name = a.name.length > 13 ? a.name.slice(0, 12) + '…' : a.name;
  const type = a.type ? ` · ${a.type}` : '';
  const date = a.date ? ` · ${formatDate(a.date)}` : '';
  return `${name}${type}${date}`;
}

export function GradeChart({ grades, assignments, gradientId = 'main', compact = false }: Props) {
  const hasLabels = !!assignments;
  const interval = grades.length > 30 ? 4
    : grades.length > 15 ? 2
    : grades.length > 8 ? 1
    : 0;

  const data = grades.map((g, i) => ({
    label: makeLabel(i, assignments),
    name: assignments?.[i]?.name ?? `Assignment ${i + 1}`,
    grade: Math.round(g * 100) / 100,
  }));

  const lg = `lineGrad-${gradientId}`;
  const af = `areaFill-${gradientId}`;

  return (
    <div className={compact ? 'h-40' : 'h-52'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ bottom: hasLabels ? 48 : 4, left: 0, right: 4 }}>
          <defs>
            <linearGradient id={lg} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id={af} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            angle={hasLabels ? -40 : 0}
            textAnchor={hasLabels ? 'end' : 'middle'}
            interval={interval}
            height={hasLabels ? 72 : 24}
          />
          <YAxis
            domain={[0, 110]}
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickFormatter={v => `${v}%`}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: '#1e1b2e',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            labelStyle={{ color: '#c4b5fd', fontSize: 12 }}
            formatter={(v: number) => [`${v.toFixed(2)}%`, 'Grade']}
          />
          <ReferenceLine y={89.5} stroke="#4ade80" strokeDasharray="4 4"
            label={{ value: 'A', fill: '#4ade80', fontSize: 11 }} />
          <ReferenceLine y={69.5} stroke="#facc15" strokeDasharray="4 4"
            label={{ value: 'C', fill: '#facc15', fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="grade"
            stroke={`url(#${lg})`}
            fill={`url(#${af})`}
            strokeWidth={2}
            dot={{ fill: '#a855f7', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#c084fc' }}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
