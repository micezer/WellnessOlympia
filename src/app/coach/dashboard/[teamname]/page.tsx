'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { getSpainDateString } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import type { DashboardData, DashboardPlayer } from '@/components/coach/types';
import { KpiCards } from '@/components/coach/kpi-cards';
import { DateBar } from '@/components/coach/date-bar';
import { DailyAveragesChart, PlayersChart } from '@/components/coach/team-charts';
import { PlayerCardList, PlayersTable } from '@/components/coach/players-list';
import { PlayerDetailSheet } from '@/components/coach/player-detail-sheet';

type Tab = 'jugadoras' | 'porteras';

// Solicitudes de restablecer contraseña: nombres al pasar el ratón (o al tocar)
function ResetRequests({
  requests,
  onReset,
}: {
  requests: DashboardData['resetRequests'];
  onReset: (id: number, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!requests.length) return null;
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-sm border border-amber-300"
      >
        <KeyRound className="w-4 h-4" />
        {requests.length}{' '}
        {requests.length === 1 ? 'jugadora pide restablecer su contraseña' : 'jugadoras piden restablecer su contraseña'}
      </button>
      {open && (
        // pt-2 en vez de margen: el ratón puede bajar al menú sin cerrarlo
        <div className="absolute left-0 top-full pt-2 z-30">
          <ul className="w-[min(20rem,calc(100vw-2rem))] bg-white rounded-lg shadow-lg border p-3 space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-800">
                  {r.name}
                  <br />
                  <span className="text-xs text-gray-500">
                    {new Date(r.requestedAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
                  </span>
                </span>
                <button
                  onClick={() => onReset(r.id, r.name)}
                  className="px-2 py-1 rounded bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600"
                >
                  Restablecer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

export default function DashboardPage() {
  const router = useRouter();
  const { teamname } = useParams<{ teamname: string }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(getSpainDateString());
  const [selectedTab, setSelectedTab] = useState<Tab>('jugadoras');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/coach/dashboard?date=${selectedDate}&position=${selectedTab === 'porteras' ? 'portera' : 'jugadora'}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Error al cargar el dashboard');
      const json: DashboardData = await res.json();
      setData(json);
      setError('');
      // La URL debe reflejar el equipo elegido por el coach
      if (json.team && decodeURIComponent(teamname) !== json.team)
        router.replace(`/coach/dashboard/${encodeURIComponent(json.team)}`);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos. Inténtalo de nuevo.');
    }
  }, [selectedDate, selectedTab, teamname, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Deja la cuenta sin contraseña y cierra sus sesiones; la jugadora la vuelve a crear al entrar
  const resetPassword = async (playerId: number, name: string) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${name}? Tendrá que crear una nueva al entrar.`)) return;
    const res = await fetch('/api/coach/reset-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error || 'Error al restablecer la contraseña');
      return;
    }
    fetchData();
  };

  if (!data)
    return <p className="p-6 text-gray-500">{error || 'Cargando dashboard...'}</p>;

  const selectedPlayer = data.players.find((p) => p.id === selectedPlayerId) ?? null;
  const selectPlayer = (p: DashboardPlayer) => setSelectedPlayerId(p.id);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Cabecera */}
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">{data.team}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {getGreeting()}, {data.coachName}
          </h1>
        </div>
        <ResetRequests requests={data.resetRequests} onReset={resetPassword} />
      </div>

      {/* Fecha y pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <DateBar date={selectedDate} onChange={setSelectedDate} />
        <div className="inline-flex rounded-lg bg-gray-200/70 p-0.5 self-start">
          {(
            [
              ['jugadoras', 'Jugadoras de campo'],
              ['porteras', 'Porteras'],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold',
                selectedTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <KpiCards data={data} />

      <DailyAveragesChart data={data.dailyAverages} />

      {/* Jugadoras */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedTab === 'jugadoras' ? 'Jugadoras de campo' : 'Porteras'}{' '}
          <span className="text-gray-400 font-normal">({data.players.length})</span>
        </h2>
        {data.players.length ? (
          <>
            <PlayersTable players={data.players} onSelect={selectPlayer} />
            <PlayerCardList players={data.players} onSelect={selectPlayer} />
          </>
        ) : (
          <p className="text-sm text-gray-500">No hay jugadoras en esta pestaña.</p>
        )}
      </section>

      {data.players.length > 0 && <PlayersChart players={data.players} onSelect={selectPlayer} />}

      <PlayerDetailSheet
        player={selectedPlayer}
        date={selectedDate}
        onClose={() => setSelectedPlayerId(null)}
        onResetPassword={(p) => resetPassword(p.id, p.name)}
      />
    </div>
  );
}
