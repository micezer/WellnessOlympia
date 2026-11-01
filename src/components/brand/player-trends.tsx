'use client';
// "Mi evolución": un gráfico pequeño por métrica (escalas distintas, nunca dos ejes juntos)
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoryDay } from '@/lib/history';

// Colores validados para daltonismo y contraste sobre la superficie oscura (ink-800)
const COLORS = { wellness: '#3987e5', load: '#d95926' };
const AXIS = { fontSize: 10, fill: '#9ca3af' };

const shortDate = (date: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );

function Trend({
  title,
  data,
  dataKey,
  domain,
  color,
  unit = '',
}: {
  title: string;
  data: HistoryDay[];
  dataKey: 'wellnessScore' | 'sleep' | 'rpe';
  domain: [number, number];
  color: string;
  unit?: string;
}) {
  const values = data.map((d) => d[dataKey]).filter((v): v is number => v !== null);
  const average = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;
  return (
    <div className="rounded-xl bg-ink-700 p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-400">
          Media: <span className="text-white font-semibold">{average ?? '—'}{average !== null && unit}</span>
        </p>
      </div>
      <div className="h-24 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid stroke="#50565c" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={domain} tick={AXIS} tickLine={false} axisLine={false} tickCount={3} />
            <Tooltip
              labelFormatter={(d) => shortDate(String(d))}
              formatter={(v) => [`${v}${unit}`, title]}
              contentStyle={{ background: '#212529', border: '1px solid #50565c', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#d1d5db' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, fill: '#2d3237' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PlayerTrends({ history }: { history: HistoryDay[] }) {
  return (
    <div className="space-y-2">
      <Trend title="Wellness" data={history} dataKey="wellnessScore" domain={[0, 100]} color={COLORS.wellness} />
      <Trend title="Sueño" data={history} dataKey="sleep" domain={[0, 12]} color={COLORS.wellness} unit=" h" />
      <Trend title="RPE" data={history} dataKey="rpe" domain={[0, 10]} color={COLORS.load} />
    </div>
  );
}
