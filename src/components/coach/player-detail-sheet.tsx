'use client';
import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { KeyRound } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar } from '@/components/brand/avatar';
import {
  MENSTRUAL_PHASE_LABELS,
  MUSCLE_LABELS,
  moodLabel,
} from '@/lib/forms';
import { formatDateRelative } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { PlayerBadges } from './badges';
import { SERIES, playerSubtitle, type DashboardPlayer } from './types';

type HistoryDay = {
  date: string;
  wellnessScore: number | null;
  sleep: number | null;
  rpe: number | null;
};

const HISTORY_DAYS = 14;

const shortDate = (date: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );

// Un gráfico pequeño por métrica (escalas distintas → nunca dos ejes en el mismo gráfico)
function MiniTrend({
  title,
  data,
  dataKey,
  domain,
  color,
  unit,
}: {
  title: string;
  data: HistoryDay[];
  dataKey: keyof HistoryDay;
  domain: [number, number];
  color: string;
  unit?: string;
}) {
  const values = data.map((d) => d[dataKey]).filter((v): v is number => typeof v === 'number');
  const last = values.at(-1);
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-sm text-gray-900 font-semibold tabular-nums">
          {last ?? '—'}
          {last != null && unit}
        </p>
      </div>
      <div className="h-24 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={domain} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickCount={3} />
            <Tooltip
              labelFormatter={(d) => shortDate(String(d))}
              formatter={(v) => [`${v}${unit ?? ''}`, title]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Item({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'bad' }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn('font-semibold text-gray-900', tone === 'bad' && 'text-red-600')}>{value}</p>
    </div>
  );
}

export function PlayerDetailSheet({
  player,
  date,
  onClose,
  onResetPassword,
}: {
  player: DashboardPlayer | null;
  date: string;
  onClose: () => void;
  onResetPassword: (player: DashboardPlayer) => void;
}) {
  const [history, setHistory] = useState<HistoryDay[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!player) return;
    setHistory(null);
    setError('');
    fetch(`/api/coach/player/${player.id}/history?days=${HISTORY_DAYS}&date=${date}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setHistory(data.history);
      })
      .catch((err) => setError(err.message || 'Error al cargar el historial'));
  }, [player, date]);

  const w = player?.lastWellness;
  const l = player?.lastLoad;
  const pain = l
    ? Object.entries(MUSCLE_LABELS)
        .map(([key, label]) => ({ label, value: Number(l.muscle_pain[key]) || 0 }))
        .filter((m) => m.value > 1)
        .sort((a, b) => b.value - a.value)
    : [];
  const otherPain = typeof l?.muscle_pain.otras === 'string' ? l.muscle_pain.otras.trim() : '';

  return (
    <Sheet open={!!player} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-5">
        {player && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3 pr-6">
                <Avatar firstname={player.firstname} lastname={player.lastname} color={player.avatarColor} size="md" />
                <div>
                  <SheetTitle>{player.name}</SheetTitle>
                  <SheetDescription>
                    {player.nickname && `«${player.nickname}» · `}
                    {playerSubtitle(player)}
                  </SheetDescription>
                </div>
              </div>
              <PlayerBadges player={player} />
            </SheetHeader>

            <section className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Últimos {HISTORY_DAYS} días</h3>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!history && !error && <p className="text-sm text-gray-500">Cargando...</p>}
              {history && (
                <div className="space-y-2">
                  <MiniTrend title="Wellness" data={history} dataKey="wellnessScore" domain={[0, 100]} color={SERIES.wellness} />
                  <MiniTrend title="Sueño" data={history} dataKey="sleep" domain={[0, 12]} color={SERIES.wellness} unit=" h" />
                  <MiniTrend title="RPE" data={history} dataKey="rpe" domain={[0, 10]} color={SERIES.load} />
                </div>
              )}
            </section>

            <section className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Último wellness <span className="font-normal text-gray-500">({formatDateRelative(w?.date ?? null)})</span>
              </h3>
              {w ? (
                <div className="grid grid-cols-2 gap-2">
                  <Item label="Fatiga" value={`${w.fatigue_level}/10`} />
                  <Item label="Cansancio" value={`${w.tiredness_level}/10`} />
                  <Item label="Estrés" value={`${w.stress_level}/10`} />
                  <Item label="Sueño" value={`${w.sleep_hours} h`} />
                  <Item label="Ánimo" value={moodLabel(w.mood)} />
                  <Item label="Lesionada" value={w.is_injured ? 'Sí' : 'No'} tone={w.is_injured ? 'bad' : undefined} />
                  {w.menstrual_phase && (
                    <Item
                      label="Fase del ciclo"
                      value={MENSTRUAL_PHASE_LABELS[w.menstrual_phase as keyof typeof MENSTRUAL_PHASE_LABELS] ?? w.menstrual_phase}
                    />
                  )}
                  {w.injury_details && (
                    <div className="col-span-2">
                      <Item label="Lesión" value={<span className="font-normal">{w.injury_details}</span>} tone="bad" />
                    </div>
                  )}
                  {w.discomfort && (
                    <div className="col-span-2">
                      <Item label="Molestias" value={<span className="font-normal">{w.discomfort}</span>} />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin datos en los últimos 7 días</p>
              )}
            </section>

            <section className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Último RPE <span className="font-normal text-gray-500">({formatDateRelative(l?.date ?? null)})</span>
              </h3>
              {l ? (
                <>
                  <Item label="Esfuerzo percibido" value={`${l.rpe}/10`} />
                  <p className="text-xs text-gray-500 mt-3 mb-1">Molestias (1 = ninguna)</p>
                  {pain.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {pain.map((m) => (
                        <span
                          key={m.label}
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            m.value >= 7 ? 'bg-red-100 text-red-700' : m.value >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700',
                          )}
                        >
                          {m.label} {m.value}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">Sin molestias</p>
                  )}
                  {otherPain && <p className="text-sm text-gray-700 mt-2">Otras: {otherPain}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-500">Sin datos en los últimos 7 días</p>
              )}
            </section>

            <section className="mt-6 pt-4 border-t">
              {player.hasPassword ? (
                <button
                  onClick={() => onResetPassword(player)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                    player.resetRequested
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'border text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <KeyRound className="w-4 h-4" /> Restablecer contraseña
                </button>
              ) : (
                <p className="text-sm text-gray-500">Aún no ha creado su contraseña</p>
              )}
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
