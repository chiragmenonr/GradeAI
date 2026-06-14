import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

export interface GradedItem {
  name: string;
  type: string;
  date?: string;
  grade: number;
}

interface Props {
  aItems: GradedItem[];
  bItems: GradedItem[];
  labelA: string;
  labelB: string;
  gradientId: string;
}

function fmtDate(iso: string): string {
  const p = iso.split('-');
  return p.length >= 3 ? `${parseInt(p[1])}/${parseInt(p[2])}` : iso;
}

function makeLabel(name: string, type: string, date?: string): string {
  const n = name.length > 12 ? name.slice(0, 11) + '…' : name;
  const d = date ? ` · ${fmtDate(date)}` : '';
  return `${n} · ${type}${d}`;
}

type Point = { label: string; a: number | null; b: number | null };

function mergeItems(aItems: GradedItem[], bItems: GradedItem[]): Point[] {
  const tagged = [
    ...aItems.map(x => ({ ...x, series: 'a' as const })),
    ...bItems.map(x => ({ ...x, series: 'b' as const })),
  ];
  const hasDate = tagged.some(x => !!x.date);
  if (hasDate) {
    tagged.sort((x, y) => {
      if (!x.date && !y.date) return 0;
      if (!x.date) return 1;
      if (!y.date) return -1;
      return x.date.localeCompare(y.date);
    });
  }
  return tagged.map(x => ({
    label: makeLabel(x.name, x.type, x.date),
    a: x.series === 'a' ? x.grade : null,
    b: x.series === 'b' ? x.grade : null,
  }));
}

export function CombinedTypeChart({ aItems, bItems, labelA, labelB, gradientId }: Props) {
  const data = mergeItems(aItems, bItems);
  const interval = data.length > 25 ? 4 : data.length > 12 ? 2 : data.length > 6 ? 1 : 0;
  const lgA = `lgA-${gradientId}`;
  const afA = `afA-${gradientId}`;
  const lgB = `lgB-${gradientId}`;
  const afB = `afB-${gradientId}`;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ bottom: 52, left: 0, right: 4 }}>
          <defs>
            <linearGradient id={lgA} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id={afA} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={lgB} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id={afB} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            angle={-40}
            textAnchor="end"
            interval={interval}
            height={70}
          />
          <YAxis
            domain={[0, 110]}
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickFormatter={v => `${v}%`}
            width={42}
          />
          <Tooltip
            contentStyle={{ background: '#1e1b2e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', color: '#e2e8f0' }}
            labelStyle={{ color: '#c4b5fd', fontSize: 11 }}
            formatter={(v, key) => [typeof v === 'number' ? `${v.toFixed(2)}%` : String(v ?? ''), key === 'a' ? labelA : labelB] as [string, string]}
          />
          <Legend
            formatter={value => value === 'a' ? labelA : labelB}
            wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingBottom: 2 }}
          />
          <ReferenceLine y={89.5} stroke="#4ade80" strokeDasharray="4 4" label={{ value: 'A', fill: '#4ade80', fontSize: 11 }} />
          <ReferenceLine y={69.5} stroke="#facc15" strokeDasharray="4 4" label={{ value: 'C', fill: '#facc15', fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="a"
            name="a"
            stroke={`url(#${lgA})`}
            fill={`url(#${afA})`}
            strokeWidth={2}
            connectNulls
            dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#f97316' }}
            isAnimationActive
            animationDuration={900}
          />
          <Area
            type="monotone"
            dataKey="b"
            name="b"
            stroke={`url(#${lgB})`}
            fill={`url(#${afB})`}
            strokeWidth={2}
            connectNulls
            dot={{ fill: '#a855f7', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#c084fc' }}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
