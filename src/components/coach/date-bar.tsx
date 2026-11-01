import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatDateLong, getSpainDateString } from '@/lib/time-utils';

// ◀ fecha ▶ + Hoy (no se puede ir más allá de hoy)
export function DateBar({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const today = getSpainDateString();
  const arrow =
    'w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button aria-label="Día anterior" className={arrow} onClick={() => onChange(addDays(date, -1))}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <label className="relative">
        <span className="sr-only">Seleccionar fecha</span>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-10 rounded-lg border bg-white px-3"
        />
      </label>
      <button
        aria-label="Día siguiente"
        className={arrow}
        disabled={date >= today}
        onClick={() => onChange(addDays(date, 1))}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      {date !== today && (
        <button onClick={() => onChange(today)} className="h-10 px-3 rounded-lg border bg-white hover:bg-gray-50 font-medium">
          Hoy
        </button>
      )}
      <span className="text-sm text-gray-500 capitalize hidden sm:inline">{formatDateLong(date)}</span>
    </div>
  );
}
