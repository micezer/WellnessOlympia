'use client';
// Pestaña "Uso" del admin: si las jugadoras se registran, reciben avisos y rellenan formularios.
// Solo estados (enviado sí/no), nunca el contenido de los formularios.
import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, BellOff, Check, Laptop, Smartphone, X } from 'lucide-react';
import { DateBar } from '@/components/coach/date-bar';
import { cn } from '@/lib/utils';
import { getSpainDateString } from '@/lib/time-utils';

type DeviceType = 'iphone' | 'android' | 'pc';

interface PlayerUsage {
  id: number;
  name: string;
  fullName: string;
  team: string;
  registered: boolean;
  resetRequested: boolean;
  devices: DeviceType[];
  deviceCount: number;
  lastDelivery: string | null;
  stale: boolean;
  wellnessToday: boolean;
  loadToday: boolean;
}

interface TeamUsage {
  team: string;
  total: number;
  registered: number;
  withPush: number;
  wellness: number;
  load: number;
  last7: { date: string; wellness: number; load: number }[];
}

interface Usage {
  date: string;
  open: { wellness: boolean; load: boolean };
  summary: {
    total: number;
    registered: number;
    withPush: number;
    devices: number;
    deliveredLast24h: number;
    staleDevices: number;
    wellness: number;
    load: number;
  };
  reminders: Record<string, number>;
  teams: TeamUsage[];
  players: PlayerUsage[];
}

const REMINDERS = [
  ['wellness_open', '08:00', 'Wellness abierto'],
  ['wellness_last', '11:00', 'Último aviso wellness'],
  ['load_open', '20:00', 'RPE abierto'],
  ['load_last', '23:00', 'Último aviso RPE'],
] as const;

const FILTERS = [
  ['all', 'Todas'],
  ['unregistered', 'Sin registrar'],
  ['nopush', 'Sin avisos'],
  ['nowellness', 'Sin wellness'],
  ['noload', 'Sin RPE'],
] as const;
type Filter = (typeof FILTERS)[number][0];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const weekday = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' });

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// ✓ / ✗ con texto para lectores de pantalla (nunca solo color)
function Done({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-green-700">
      <Check className="w-4 h-4" aria-hidden="true" />
      <span className="sr-only">{label}: enviado</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-gray-400">
      <X className="w-4 h-4" aria-hidden="true" />
      <span className="sr-only">{label}: no enviado</span>
    </span>
  );
}

function PushStatus({ p }: { p: PlayerUsage }) {
  if (!p.deviceCount)
    return (
      <span className="inline-flex items-center gap-1 text-gray-500">
        <BellOff className="w-4 h-4" aria-hidden="true" /> Sin avisos
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5">
      {p.stale ? (
        <span className="inline-flex items-center gap-1 text-amber-700" title="Sin entregas en 3+ días">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Revisar
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-green-700">
          <Bell className="w-4 h-4" aria-hidden="true" /> Activos
        </span>
      )}
      {p.devices.map((d) =>
        d === 'pc' ? (
          <Laptop key={d} className="w-4 h-4 text-gray-400" aria-label="PC" />
        ) : (
          <Smartphone key={d} className="w-4 h-4 text-gray-400" aria-label={d === 'iphone' ? 'iPhone' : 'Android'} />
        ),
      )}
    </span>
  );
}

function RegisteredStatus({ p }: { p: PlayerUsage }) {
  if (p.resetRequested) return <span className="text-amber-700">Pidió restablecer</span>;
  if (!p.registered) return <span className="text-gray-500">Sin contraseña</span>;
  return <span className="text-green-700">Registrada</span>;
}

export function AdminUsage() {
  const [date, setDate] = useState(getSpainDateString());
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState('');
  const [team, setTeam] = useState<string>('all');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let cancelled = false;
    setError('');
    fetch(`/api/admin/usage?date=${date}`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(data.error || 'Error al cargar el uso');
        else setUsage(data);
      })
      .catch(() => !cancelled && setError('Error al cargar el uso'));
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!usage) return <p className="text-gray-500">Cargando...</p>;

  const { summary } = usage;
  const isToday = usage.date === getSpainDateString();
  const dayLabel = isToday ? 'hoy' : 'ese día';

  const shown = usage.players.filter(
    (p) =>
      (team === 'all' || p.team === team) &&
      (filter === 'all' ||
        (filter === 'unregistered' && !p.registered) ||
        (filter === 'nopush' && !p.deviceCount) ||
        (filter === 'nowellness' && !p.wellnessToday) ||
        (filter === 'noload' && !p.loadToday)),
  );

  const chip = (active: boolean) =>
    cn(
      'px-3 py-1.5 rounded-full text-sm font-medium border',
      active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50',
    );

  return (
    <div className="space-y-6">
      <DateBar date={date} onChange={setDate} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile
          label="Registradas"
          value={`${summary.registered}/${summary.total}`}
          hint="Con contraseña creada"
        />
        <Tile
          label="Con avisos"
          value={`${summary.withPush}`}
          hint={`${summary.devices} dispositivos`}
        />
        <Tile
          label={`Wellness ${dayLabel}`}
          value={`${summary.wellness}`}
          hint={isToday && usage.open.wellness ? 'Formulario abierto ahora' : undefined}
        />
        <Tile
          label={`RPE ${dayLabel}`}
          value={`${summary.load}`}
          hint={isToday && usage.open.load ? 'Formulario abierto ahora' : undefined}
        />
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Notificaciones</h2>
        <p className="text-sm text-gray-500 mb-3">
          Un recordatorio solo se envía a quien tiene avisos y aún no había rellenado el formulario.
        </p>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <ul className="divide-y">
            {REMINDERS.map(([kind, time, label]) => (
              <li key={kind} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="text-gray-500 tabular-nums">{time}</span> · {label}
                </span>
                <span className="font-semibold tabular-nums">
                  {usage.reminders[kind] ?? 0} {(usage.reminders[kind] ?? 0) === 1 ? 'jugadora' : 'jugadoras'}
                </span>
              </li>
            ))}
          </ul>
          <ul className="divide-y text-sm">
            <li className="flex items-center justify-between py-2">
              <span>Dispositivos con entrega en las últimas 24 h</span>
              <span className="font-semibold tabular-nums">
                {summary.deliveredLast24h}/{summary.devices}
              </span>
            </li>
            <li className="flex items-center justify-between py-2">
              <span className="inline-flex items-center gap-1">
                {summary.staleDevices > 0 && <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />}
                Sin entregas en 3+ días
              </span>
              <span className="font-semibold tabular-nums">{summary.staleDevices}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Equipo</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Registradas</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Avisos</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Wellness</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">RPE</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usage.teams.map((t) => (
              <tr key={t.team}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{t.team}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {t.registered}/{t.total}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{t.withPush}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.wellness}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.load}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <h2 className="font-semibold text-gray-900 px-4 pt-4">Últimos 7 días</h2>
        <p className="text-sm text-gray-500 px-4 mb-2">Formularios enviados: wellness / RPE</p>
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Equipo</th>
              {usage.teams[0]?.last7.map((d) => (
                <th key={d.date} className="px-3 py-2 text-right font-medium text-gray-500 whitespace-nowrap">
                  <span className="capitalize">{weekday(d.date)}</span> {Number(d.date.slice(8))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {usage.teams.map((t) => (
              <tr key={t.team}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{t.team}</td>
                {t.last7.map((d) => (
                  <td key={d.date} className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                    {d.wellness} <span className="text-gray-400">/</span> {d.load}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">Jugadoras</h2>
        <div className="flex flex-wrap gap-2">
          {['all', ...usage.teams.map((t) => t.team)].map((t) => (
            <button key={t} onClick={() => setTeam(t)} className={chip(team === t)}>
              {t === 'all' ? 'Todos los equipos' : t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={chip(filter === key)}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          {shown.length} {shown.length === 1 ? 'jugadora' : 'jugadoras'}
        </p>

        {/* Móvil: tarjetas */}
        <ul className="md:hidden space-y-2">
          {shown.map((p) => (
            <li key={p.id} className="rounded-xl border bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.team}</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-500 shrink-0">
                  <span className="inline-flex items-center gap-1">
                    W <Done ok={p.wellnessToday} label="Wellness" />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    RPE <Done ok={p.loadToday} label="RPE" />
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                <RegisteredStatus p={p} />
                <PushStatus p={p} />
              </div>
            </li>
          ))}
        </ul>

        {/* PC: tabla */}
        <div className="hidden md:block bg-white rounded-xl border shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Jugadora</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Equipo</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Cuenta</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Avisos</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Última entrega</th>
                <th className="px-4 py-2 text-center font-medium text-gray-500">Wellness</th>
                <th className="px-4 py-2 text-center font-medium text-gray-500">RPE</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{p.name}</span>
                    {p.name !== p.fullName && <span className="block text-xs text-gray-500">{p.fullName}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{p.team}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <RegisteredStatus p={p} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <PushStatus p={p} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                    {p.lastDelivery ? formatDateTime(p.lastDelivery) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Done ok={p.wellnessToday} label="Wellness" />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Done ok={p.loadToday} label="RPE" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
