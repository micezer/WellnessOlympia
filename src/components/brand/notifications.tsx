'use client';
// Notificaciones en la app de jugadoras: aviso para activarlas (inicio) y ajustes (perfil)
import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { cn } from '@/lib/utils';
import { LOAD_WINDOW, WELLNESS_WINDOW } from '@/lib/time-utils';
import { Button } from './button';

const DISMISSED_KEY = 'wellness_push_prompt_dismissed';

// Tarjeta en el inicio para activar los recordatorios; si dice "Ahora no" no vuelve a salir
export function NotificationsPrompt() {
  const { state, busy, error, enable } = usePushSubscription();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (state !== 'off' || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
  };

  return (
    <section className="rounded-2xl border border-brand/40 bg-brand/10 p-4">
      <div className="flex gap-3">
        <Bell className="w-6 h-6 shrink-0 text-brand" />
        <div>
          <h2 className="font-semibold">Activa los recordatorios</h2>
          <p className="text-sm text-gray-300 mt-0.5">
            Te avisamos cuando se abran los formularios y antes de que se cierren, solo si no los
            has rellenado.
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <Button onClick={enable} loading={busy} className="flex-1 min-h-11">
          Activar
        </Button>
        <Button variant="ghost" onClick={dismiss} className="min-h-11">
          Ahora no
        </Button>
      </div>
    </section>
  );
}

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-2.5 disabled:opacity-50"
    >
      <span className="text-left text-sm">{label}</span>
      <span
        className={cn(
          'relative w-12 h-7 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-ink-600',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </button>
  );
}

type Prefs = { wellness: boolean; load: boolean };

// Horas del cron: al abrirse y una hora antes de cerrarse
const reminderTimes = (window: { start: number; end: number }) =>
  `${window.start}:00 y ${window.end - 1}:00`;

// Ajustes del perfil: activar en este dispositivo, qué recordatorios y prueba
export function NotificationSettings() {
  const { state, busy, error, enable, disable, sendTest } = usePushSubscription();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    fetch('/api/push/prefs', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then(setPrefs)
      .catch(() => {});
  }, []);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    if (!prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    const res = await fetch('/api/push/prefs', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => null);
    if (!res?.ok) setPrefs(previous);
  };

  const test = async () => {
    await sendTest();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <section className="rounded-2xl bg-ink-800 p-4">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Bell className="w-5 h-5" /> Notificaciones
      </h3>

      {state === 'loading' && <p className="text-sm text-gray-400">Comprobando...</p>}
      {state === 'unsupported' && (
        <p className="text-sm text-gray-400">
          Este dispositivo no admite notificaciones. En iPhone necesitas iOS 16.4 o posterior y abrir
          la app desde su icono.
        </p>
      )}
      {state === 'denied' && (
        <p className="text-sm text-yellow-300 flex gap-2">
          <BellOff className="w-4 h-4 shrink-0 mt-0.5" />
          Las has bloqueado. Actívalas en los ajustes del móvil (Notificaciones → Wellness) y vuelve
          a abrir la app.
        </p>
      )}

      {(state === 'off' || state === 'on') && (
        <div className="divide-y divide-ink-700">
          <Switch
            label="Recibir avisos en este dispositivo"
            checked={state === 'on'}
            disabled={busy}
            onChange={(on) => (on ? enable() : disable())}
          />
          {state === 'on' && prefs && (
            <>
              <Switch
                label={`Recordatorio de wellness (${reminderTimes(WELLNESS_WINDOW)})`}
                checked={prefs.wellness}
                onChange={(v) => updatePref('wellness', v)}
              />
              <Switch
                label={`Recordatorio de RPE (${reminderTimes(LOAD_WINDOW)})`}
                checked={prefs.load}
                onChange={(v) => updatePref('load', v)}
              />
              <div className="pt-3">
                <Button variant="secondary" onClick={test} className="w-full min-h-11 text-sm">
                  {testSent ? 'Enviada ✓' : 'Enviar notificación de prueba'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </section>
  );
}
