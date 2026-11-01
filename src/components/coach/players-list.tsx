import { ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/brand/avatar';
import { formatDateRelative } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { FormsToday, MoodText, PlayerBadges } from './badges';
import { HIGH_LOAD, playerSubtitle, type DashboardPlayer } from './types';

type ListProps = {
  players: DashboardPlayer[];
  onSelect: (player: DashboardPlayer) => void;
};

function Score({ value, high }: { value: number; high?: boolean }) {
  return <span className={cn('tabular-nums font-semibold', high && 'text-amber-700')}>{value}</span>;
}

// PC/tablet: tabla con la columna de nombre fija al hacer scroll horizontal
export function PlayersTable({ players, onSelect }: ListProps) {
  const th = 'px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap';
  const td = 'px-3 py-2.5 whitespace-nowrap';
  return (
    <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className={cn(th, 'sticky left-0 bg-gray-50')}>Jugadora</th>
            <th className={th}>Estado</th>
            <th className={th}>Carga 7d</th>
            <th className={th}>Wellness 7d</th>
            <th className={th}>Ánimo</th>
            <th className={th}>Hoy</th>
            <th className={th}>Último wellness</th>
            <th className={th}>Último RPE</th>
            <th className={th}></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {players.map((p) => (
            <tr key={p.id} onClick={() => onSelect(p)} className="group cursor-pointer hover:bg-gray-50">
              <td className={cn(td, 'sticky left-0 bg-white group-hover:bg-gray-50')}>
                <div className="flex items-center gap-2.5">
                  <Avatar firstname={p.firstname} lastname={p.lastname} color={p.avatarColor} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.name}
                      {p.nickname && <span className="text-gray-500 font-normal"> · {p.nickname}</span>}
                    </p>
                    <p className="text-xs text-gray-500">{playerSubtitle(p)}</p>
                  </div>
                </div>
              </td>
              <td className={td}>
                <PlayerBadges player={p} />
              </td>
              <td className={td}>
                <Score value={p.loadScore} high={p.loadScore > HIGH_LOAD} />%
              </td>
              <td className={td}>
                <Score value={Math.round(p.wellnessScore)} />
              </td>
              <td className={td}>
                <MoodText mood={p.mood} />
              </td>
              <td className={td}>
                <FormsToday player={p} />
              </td>
              <td className={cn(td, 'text-gray-600')}>{formatDateRelative(p.lastWellness?.date ?? null)}</td>
              <td className={cn(td, 'text-gray-600')}>{formatDateRelative(p.lastLoad?.date ?? null)}</td>
              <td className={cn(td, 'text-gray-400')}>
                <ChevronRight className="w-4 h-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Móvil: una tarjeta compacta por jugadora
export function PlayerCardList({ players, onSelect }: ListProps) {
  return (
    <ul className="md:hidden space-y-2">
      {players.map((p) => (
        <li key={p.id}>
          <button
            onClick={() => onSelect(p)}
            className="w-full text-left rounded-xl border bg-white p-3 shadow-sm active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Avatar firstname={p.firstname} lastname={p.lastname} color={p.avatarColor} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {p.name}
                  {p.nickname && <span className="text-gray-500 font-normal"> · {p.nickname}</span>}
                </p>
                <p className="text-xs text-gray-500">{playerSubtitle(p)}</p>
              </div>
              <FormsToday player={p} />
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>
                Carga <Score value={p.loadScore} high={p.loadScore > HIGH_LOAD} />%
              </span>
              <span>
                Wellness <Score value={Math.round(p.wellnessScore)} />
              </span>
              <span className="truncate">
                <MoodText mood={p.mood} />
              </span>
            </div>
            {(p.isInjured || p.loadScore > HIGH_LOAD || p.resetRequested) && (
              <div className="mt-2">
                <PlayerBadges player={p} />
              </div>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
