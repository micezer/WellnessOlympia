'use client';
// Cambiar la contraseña propia (los demás dispositivos tendrán que entrar de nuevo).
// El formulario sirve para el perfil de jugadora (oscuro) y para coach/admin (claro).
import { useState } from 'react';
import { ChevronDown, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

const MIN_LENGTH = 6;
export const PASSWORD_CHANGED_MESSAGE =
  'Contraseña cambiada. En tus otros dispositivos tendrás que entrar de nuevo.';

const INPUT = {
  dark: 'w-full rounded-xl border border-ink-600 bg-ink-950 text-white px-3 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand',
  light:
    'w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500',
};

export function ChangePasswordForm({
  identifier,
  variant,
  onDone,
}: {
  identifier: string;
  variant: 'dark' | 'light';
  onDone: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < MIN_LENGTH)
      return setError(`La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres`);
    if (next !== repeat) return setError('Las contraseñas nuevas no coinciden');

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data.error || 'No se pudo cambiar la contraseña');
      }
      setCurrent('');
      setNext('');
      setRepeat('');
      onDone();
    } catch {
      setError('Sin conexión. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = INPUT[variant];
  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Usuario oculto para que el gestor de contraseñas asocie la nueva */}
      <input type="text" name="username" autoComplete="username" value={identifier} readOnly hidden />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Contraseña actual"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className={inputClass}
        required
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder={`Nueva contraseña (mín. ${MIN_LENGTH})`}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className={inputClass}
        required
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder="Repite la nueva contraseña"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        className={inputClass}
        required
      />
      {error && (
        <p role="alert" className={cn('text-sm', variant === 'dark' ? 'text-red-400' : 'text-red-600')}>
          {error}
        </p>
      )}
      {variant === 'dark' ? (
        <Button type="submit" loading={saving} className="w-full">
          Guardar contraseña
        </Button>
      ) : (
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      )}
    </form>
  );
}

// Perfil de jugadora: sección plegable (tema oscuro)
export function ChangePassword({ identifier }: { identifier: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section className="rounded-2xl bg-ink-800 p-4">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setDone(false);
        }}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 font-semibold"
      >
        <span className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> Cambiar contraseña
        </span>
        <ChevronDown className={cn('w-5 h-5 transition-transform', open && 'rotate-180')} />
      </button>

      {done && <p className="text-sm text-brand mt-3">{PASSWORD_CHANGED_MESSAGE}</p>}

      {open && (
        <div className="mt-4">
          <ChangePasswordForm
            identifier={identifier}
            variant="dark"
            onDone={() => {
              setDone(true);
              setOpen(false);
            }}
          />
        </div>
      )}
    </section>
  );
}
