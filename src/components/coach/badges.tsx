import { AlertTriangle, Check, Flame, Minus } from 'lucide-react';
import { NEGATIVE_MOODS, moodLabel } from '@/lib/forms';
import { cn } from '@/lib/utils';
import { HIGH_LOAD, type DashboardPlayer } from './types';

// Estados siempre con icono + texto (nunca solo color)
export function StatusBadge({
  tone,
  icon,
  children,
}: {
  tone: 'critical' | 'warning' | 'good' | 'neutral';
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        tone === 'critical' && 'bg-red-100 text-red-700',
        tone === 'warning' && 'bg-amber-100 text-amber-800',
        tone === 'good' && 'bg-green-100 text-green-800',
        tone === 'neutral' && 'bg-gray-100 text-gray-600',
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function PlayerBadges({ player }: { player: DashboardPlayer }) {
  return (
    <div className="flex flex-wrap gap-1">
      {player.isInjured && (
        <StatusBadge tone="critical" icon={<AlertTriangle className="w-3 h-3" />}>
          Lesionada
        </StatusBadge>
      )}
      {player.loadScore > HIGH_LOAD && (
        <StatusBadge tone="warning" icon={<Flame className="w-3 h-3" />}>
          Carga alta
        </StatusBadge>
      )}
      {player.resetRequested && <StatusBadge tone="warning">🔑 Pide contraseña</StatusBadge>}
    </div>
  );
}

export function MoodText({ mood }: { mood: string | null }) {
  return (
    <span className={cn('whitespace-nowrap', mood && NEGATIVE_MOODS.includes(mood) && 'text-red-600 font-semibold')}>
      {moodLabel(mood)}
    </span>
  );
}

// Formularios del día: W = wellness, R = RPE
export function FormsToday({ player }: { player: DashboardPlayer }) {
  const item = (done: boolean, label: string, title: string) => (
    <span
      title={`${title}: ${done ? 'hecho' : 'pendiente'}`}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
        done ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500',
      )}
    >
      {done ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {label}
    </span>
  );
  return (
    <span className="inline-flex gap-1">
      {item(player.wellnessToday, 'W', 'Wellness')}
      {item(player.loadToday, 'RPE', 'RPE')}
    </span>
  );
}
