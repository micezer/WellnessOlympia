import { AlertTriangle, ClipboardCheck, Dumbbell, Flame } from 'lucide-react';
import { HIGH_LOAD, type DashboardData } from './types';

function Kpi({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
    </div>
  );
}

// Resumen del día seleccionado: 2×2 en móvil, 4 en fila en PC
export function KpiCards({ data }: { data: DashboardData }) {
  const total = data.players.length;
  const wellnessDone = data.players.filter((p) => p.wellnessToday).length;
  const loadDone = data.players.filter((p) => p.loadToday).length;
  const injured = data.players.filter((p) => p.isInjured).length;
  const highLoad = data.players.filter((p) => p.loadScore > HIGH_LOAD).length;
  const avgWellness = data.dailyAverages.find((d) => d.date === data.date)?.avgWellness;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Kpi
        icon={<ClipboardCheck className="w-4 h-4" />}
        label="Wellness"
        value={`${wellnessDone}/${total}`}
        detail={avgWellness != null ? `Media del día: ${avgWellness}` : 'Sin datos del día'}
      />
      <Kpi icon={<Dumbbell className="w-4 h-4" />} label="RPE" value={`${loadDone}/${total}`} detail="Formularios del día" />
      <Kpi
        icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
        label="Lesionadas"
        value={String(injured)}
        detail="Según su último wellness"
      />
      <Kpi
        icon={<Flame className="w-4 h-4 text-amber-600" />}
        label="Carga alta"
        value={String(highLoad)}
        detail={`Carga media 7 días > ${HIGH_LOAD}%`}
      />
    </div>
  );
}
