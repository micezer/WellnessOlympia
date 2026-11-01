'use client';
// Controles de formulario de la app de jugadoras (tema oscuro, pensados para el dedo)
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-ink-800 p-4">
      <div className="mb-3">
        <h2 className="font-semibold">
          {label} {required && <span className="text-red-400">*</span>}
        </h2>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// Escala 1–10 con valor grande y etiquetas en los extremos
export function ScaleInput({
  value,
  onChange,
  minLabel,
  maxLabel,
  compact,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  compact?: boolean;
  ariaLabel?: string;
}) {
  const pct = `${((value - 1) / 9) * 100}%`;
  return (
    <div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range-brand"
          style={{ '--pct': pct } as React.CSSProperties}
        />
        <span
          className={cn(
            'shrink-0 text-right font-bold tabular-nums',
            compact ? 'w-8 text-base' : 'w-10 text-2xl',
          )}
        >
          {value}
        </span>
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-gray-400 mt-1.5 pr-14">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

// Opciones como botones (un toque en vez de abrir un desplegable)
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: readonly { value: T; label: string }[];
  value: T | '';
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className={cn('grid gap-2', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')} role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-12 px-3 rounded-xl border-2 text-sm font-medium transition active:scale-[0.97]',
              selected
                ? 'border-brand bg-brand/15 text-white'
                : 'border-ink-600 text-gray-200 hover:bg-ink-700',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// −/+ en números enteros; empieza vacío para que no se envíe un 0 por descuido
export function Stepper({
  value,
  onChange,
  min,
  max,
  start,
  unit,
}: {
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
  start: number; // primer valor al tocar + (y start - 1 al tocar −)
  unit?: string;
}) {
  const step = (delta: number) => {
    const next = value === null ? (delta > 0 ? start : start - 1) : value + delta;
    onChange(Math.min(max, Math.max(min, next)));
  };
  const buttonClass =
    'w-14 h-14 rounded-full border-2 border-ink-600 flex items-center justify-center hover:bg-ink-700 active:scale-95 disabled:opacity-40';
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value === min}
        aria-label="Menos"
        className={buttonClass}
      >
        <Minus className="w-6 h-6" />
      </button>
      <div className="text-center">
        <span className="text-4xl font-bold tabular-nums">{value ?? '—'}</span>
        {unit && <span className="ml-1 text-gray-400">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value === max}
        aria-label="Más"
        className={buttonClass}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

export const textareaClass =
  'w-full rounded-xl border border-ink-600 bg-ink-950 text-white px-3 py-2 resize-none placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand';
