'use client';
// Activar avisos en este dispositivo (zona de coach y administración, tema claro)
import { Bell, BellOff, BellRing } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { cn } from '@/lib/utils';

export function PushToggle({ description, className }: { description: string; className?: string }) {
  const { state, busy, error, enable, disable, sendTest } = usePushSubscription();
  if (state === 'loading' || state === 'unsupported') return null;

  return (
    <div className={cn('rounded-lg border bg-white p-3 text-sm', className)}>
      {state === 'denied' ? (
        <p className="flex gap-2 text-amber-800">
          <BellOff className="w-4 h-4 shrink-0 mt-0.5" />
          Notificaciones bloqueadas en este dispositivo. Actívalas en los ajustes del navegador o del
          sistema.
        </p>
      ) : state === 'on' ? (
        <>
          <p className="flex items-center gap-2 font-semibold text-green-700">
            <BellRing className="w-4 h-4" /> Avisos activados
          </p>
          <p className="text-gray-500 mt-1">{description}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={sendTest} className="text-gray-700 underline underline-offset-2">
              Probar
            </button>
            <button onClick={disable} disabled={busy} className="text-gray-500 underline underline-offset-2">
              Desactivar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-500">{description}</p>
          <button
            onClick={enable}
            disabled={busy}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" /> Activar avisos
          </button>
        </>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
