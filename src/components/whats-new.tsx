'use client';
// Ventana de "Novedades": sale una sola vez por cuenta (se marca como vista en el servidor)
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { NewsItem } from '@/lib/news';
import { cn } from '@/lib/utils';

export function WhatsNew({ variant, paused = false }: { variant: 'dark' | 'light'; paused?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch('/api/news', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);

  // paused: espera a que se cierre otra ventana (p. ej. la de fecha de nacimiento)
  if (!items.length || paused) return null;

  const close = () => {
    setItems([]);
    fetch('/api/news', { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  const dark = variant === 'dark';
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        className={cn(
          'w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]',
          dark ? 'bg-ink-800 text-white' : 'bg-white text-gray-900',
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className={cn('w-6 h-6', dark ? 'text-brand' : 'text-green-600')} />
          <h2 id="whats-new-title" className="text-xl font-bold">
            Novedades
          </h2>
        </div>
        <p className={cn('text-sm mb-5', dark ? 'text-gray-400' : 'text-gray-500')}>
          Esto es lo que ha cambiado en la app.
        </p>

        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="text-2xl leading-none" aria-hidden="true">
                {item.emoji}
              </span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className={cn('text-sm', dark ? 'text-gray-300' : 'text-gray-600')}>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={close}
          className={cn(
            'mt-6 w-full min-h-12 rounded-xl font-semibold',
            dark ? 'bg-brand text-black hover:bg-brand-hover' : 'bg-green-600 text-white hover:bg-green-700',
          )}
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}
