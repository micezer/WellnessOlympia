'use client';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { SERIES, type DailyAverage, type DashboardPlayer } from './types';

const shortDate = (date: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );

const AXIS = { fontSize: 12, fill: '#6b7280' };
const GRID = '#e5e7eb';
const TOOLTIP_STYLE = { borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 };

export function ChartCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5 max-w-prose">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1.5 rounded-md font-medium',
            value === o.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Medias diarias del equipo (7 días). Ánimo va aparte: su escala (1–8) no es la de wellness/carga (0–100)
export function DailyAveragesChart({ data }: { data: DailyAverage[] }) {
  const [metric, setMetric] = useState<'wellness' | 'mood'>('wellness');
  return (
    <ChartCard
      title="Media diaria del equipo"
      description={
        metric === 'wellness'
          ? 'Wellness alto = buena recuperación. Carga alta = entrenamiento más exigente.'
          : 'Ánimo de 1 (frustrada) a 8 (bien).'
      }
      actions={
        <Segmented
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'wellness', label: 'Wellness y carga' },
            { value: 'mood', label: 'Ánimo' },
          ]}
        />
      }
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={false} />
            {metric === 'wellness' ? (
              <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
            ) : (
              <YAxis domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} tick={AXIS} tickLine={false} axisLine={false} />
            )}
            <Tooltip labelFormatter={(d) => shortDate(String(d))} contentStyle={TOOLTIP_STYLE} />
            {/* Recharts no mira dentro de fragmentos: cada serie va como hijo directo */}
            {metric === 'wellness' && <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />}
            {metric === 'wellness' && (
              <Line
                type="monotone"
                dataKey="avgWellness"
                name="Wellness"
                stroke={SERIES.wellness}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
            )}
            {metric === 'wellness' && (
              <Line
                type="monotone"
                dataKey="avgLoad"
                name="Carga %"
                stroke={SERIES.load}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
            )}
            {metric === 'mood' && (
              <Line
                type="monotone"
                dataKey="avgMood"
                name="Ánimo"
                stroke={SERIES.wellness}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Barras horizontales: los nombres se leen bien también en móvil. Ordenadas por carga.
export function PlayersChart({
  players,
  onSelect,
}: {
  players: DashboardPlayer[];
  onSelect: (player: DashboardPlayer) => void;
}) {
  const data = [...players]
    .sort((a, b) => b.loadScore - a.loadScore)
    .map((p) => ({ ...p, label: `${p.firstname} ${p.lastname.charAt(0)}.` }));

  return (
    <ChartCard
      title="Carga y wellness por jugadora"
      description="Media de los últimos 7 días. Toca una barra para ver el detalle."
    >
      <div style={{ height: Math.max(160, data.length * 44 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            barGap={2}
            barCategoryGap={8}
            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={96}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
            <Bar
              dataKey="loadScore"
              name="Carga %"
              fill={SERIES.load}
              radius={[0, 4, 4, 0]}
              onClick={(d) => onSelect(d.payload as DashboardPlayer)}
              className="cursor-pointer"
            />
            <Bar
              dataKey="wellnessScore"
              name="Wellness"
              fill={SERIES.wellness}
              radius={[0, 4, 4, 0]}
              onClick={(d) => onSelect(d.payload as DashboardPlayer)}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
