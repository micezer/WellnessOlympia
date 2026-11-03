'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { KeyRound, LogOut } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { InquiryList } from '@/components/inquiries';
import { AdminUsage } from '@/components/admin-usage';
import { cn } from '@/lib/utils';
import { detachPushSubscription } from '@/hooks/usePushSubscription';
import { PushToggle } from '@/components/push-toggle';

interface CoachAccount {
  id: number;
  name: string;
  identifier: string;
  hasPassword: boolean;
  locked: boolean;
  resetRequestedAt: string | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

export default function AdminPage() {
  const [adminName, setAdminName] = useState('');
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [tab, setTab] = useState<'coaches' | 'consultas' | 'uso'>('coaches');
  const [unreadInquiries, setUnreadInquiries] = useState(0);
  const [coaches, setCoaches] = useState<CoachAccount[] | null>(null);
  const [error, setError] = useState('');

  const fetchCoaches = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coaches', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al cargar los coaches');
      setAdminName(data.adminName);
      setAdminIdentifier(data.adminIdentifier);
      setCoaches(data.coaches);
    } catch {
      setError('Error al cargar los coaches');
    }
  }, []);

  // Pestaña inicial desde la URL (al volver de una consulta: /admin?tab=consultas)
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('tab');
    if (initial === 'consultas' || initial === 'uso') setTab(initial);
    fetch('/api/inquiries', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUnreadInquiries(data.unread))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const resetCoach = async (coach: CoachAccount) => {
    if (
      !window.confirm(
        `¿Restablecer la contraseña de ${coach.name}? Tendrá que crear una nueva al entrar.`,
      )
    )
      return;
    const res = await fetch('/api/admin/reset-coach', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId: coach.id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error || 'Error al restablecer la contraseña');
      return;
    }
    fetchCoaches();
  };

  const logout = async () => {
    await detachPushSubscription();
    await fetch('/api/logout', { method: 'POST' });
    window.location.replace('/');
  };

  const pending = coaches?.filter((c) => c.resetRequestedAt) ?? [];

  const status = (c: CoachAccount) =>
    c.resetRequestedAt ? (
      <span className="text-amber-700">Pidió restablecer ({formatDate(c.resetRequestedAt)})</span>
    ) : !c.hasPassword ? (
      <span className="text-gray-500">Sin contraseña</span>
    ) : c.locked ? (
      <span className="text-red-600">Bloqueada (demasiados intentos)</span>
    ) : (
      <span className="text-green-700">Activa</span>
    );

  const resetButton = (c: CoachAccount) =>
    c.hasPassword && (
      <button
        onClick={() => resetCoach(c)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm ${
          c.resetRequestedAt
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'border text-gray-700 hover:bg-gray-50'
        }`}
      >
        <KeyRound className="w-4 h-4" /> Restablecer contraseña
      </button>
    );

  return (
    <div className="min-h-dvh bg-gray-50 px-4 py-6 md:p-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className={cn('mx-auto space-y-6', tab === 'uso' ? 'max-w-5xl' : 'max-w-3xl')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/logos/app_logo.png" alt="Wellness" width={44} height={44} />
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Administración</h1>
              {adminName && <p className="text-gray-500 truncate">Hola, {adminName}</p>}
            </div>
          </div>
          <div className="shrink-0 flex gap-2">
            <button
              onClick={() => setPasswordOpen(true)}
              aria-label="Cambiar contraseña"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-gray-700 font-semibold hover:bg-gray-50"
            >
              <KeyRound className="w-4 h-4" /> <span className="hidden sm:inline">Contraseña</span>
            </button>
            <button
              onClick={logout}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-red-600 font-semibold hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>

        <ChangePasswordDialog
          identifier={adminIdentifier}
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
        />

        <PushToggle description="Te avisamos cuando llegue una consulta o un coach pida restablecer su contraseña." />

        <div className="inline-flex rounded-lg bg-gray-200/70 p-0.5">
          {(
            [
              ['coaches', 'Coaches'],
              ['consultas', 'Consultas'],
              ['uso', 'Uso'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold',
                tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {label}
              {key === 'consultas' && unreadInquiries > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                  {unreadInquiries}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'consultas' && <InquiryList variant="light" basePath="/admin/inquiries" />}

        {tab === 'uso' && <AdminUsage />}

        {tab === 'coaches' && error && <p className="text-red-600">{error}</p>}
        {tab === 'coaches' && !coaches && !error && <p className="text-gray-500">Cargando...</p>}

        {tab === 'coaches' && pending.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex gap-2">
            <KeyRound className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              {pending.length === 1 ? '1 coach ha pedido' : `${pending.length} coaches han pedido`}{' '}
              restablecer su contraseña: {pending.map((c) => c.name).join(', ')}
            </p>
          </div>
        )}

        {tab === 'coaches' && coaches && (
          <>
            {/* Móvil: tarjetas */}
            <ul className="md:hidden space-y-3">
              {coaches.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-xl border bg-white p-4 shadow-sm ${c.resetRequestedAt ? 'border-amber-300' : ''}`}
                >
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.identifier}</p>
                  <p className="text-sm mt-2">{status(c)}</p>
                  {c.hasPassword && <div className="mt-3">{resetButton(c)}</div>}
                </li>
              ))}
            </ul>

            {/* PC: tabla */}
            <div className="hidden md:block bg-white rounded-xl border shadow-sm overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Coach</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Identificador</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {coaches.map((c) => (
                    <tr key={c.id} className={c.resetRequestedAt ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.identifier}</td>
                      <td className="px-4 py-3">{status(c)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{resetButton(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
