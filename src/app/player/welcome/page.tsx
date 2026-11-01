'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import {
  isWellnessAvailable,
  isLoadAvailable,
  getSpainDateString,
  getCurrentHourInSpain,
  formatDateLong,
  formatDateRelative,
  formatWindow,
  WELLNESS_WINDOW,
  LOAD_WINDOW,
} from '@/lib/time-utils';
import { PlayerShell } from '@/components/brand/player-shell';
import { Avatar } from '@/components/brand/avatar';
import { Button, buttonClass } from '@/components/brand/button';
import { NotificationsPrompt } from '@/components/brand/notifications';
import { WhatsNew } from '@/components/whats-new';

interface Player {
  firstname: string;
  lastname: string;
  team: string;
  birth_date: string | null;
  nickname: string | null;
  avatar_color: string | null;
}

interface FormStatus {
  player: Player;
  wellness: string | null;
  load: string | null;
  streak: number;
  unreadInquiries: number;
}

type FormCardProps = {
  title: string;
  description: string;
  href: string;
  lastDate: string | null;
  window: { start: number; end: number };
  available: boolean;
};

function FormCard({ title, description, href, lastDate, window, available }: FormCardProps) {
  const done = lastDate === getSpainDateString();
  const closedToday = !done && !available && getCurrentHourInSpain() >= window.start;

  return (
    <section className="rounded-2xl bg-ink-800 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        {done && <CheckCircle2 className="w-7 h-7 shrink-0 text-brand" aria-label="Completado" />}
      </div>

      <div className="mt-4">
        {done ? (
          <p className="text-brand font-medium">Completado hoy</p>
        ) : available ? (
          <Link href={href} className={buttonClass('primary', 'w-full')}>
            Rellenar ahora <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <p className="flex items-center gap-2 text-yellow-300 text-sm font-medium">
            <Clock className="w-4 h-4 shrink-0" />
            {closedToday
              ? `Hoy ya está cerrado · mañana de ${formatWindow(window)}`
              : `Disponible de ${formatWindow(window)}`}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-3">Último: {formatDateRelative(lastDate)}</p>
      </div>
    </section>
  );
}

export default function PlayerWelcomePage() {
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);
  // Fuerza re-render para que la disponibilidad de formularios no se quede obsoleta
  const [, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    const interval = setInterval(refresh, 60 * 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    async function fetchStatus() {
      const res = await fetch('/api/player/forms/status');
      if (!res.ok) return;
      const data: FormStatus = await res.json();
      setStatus(data);
      setShowBirthModal(!data.player.birth_date);
    }
    fetchStatus();
  }, []);

  if (!status)
    return (
      <PlayerShell className="flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </PlayerShell>
    );

  const today = getSpainDateString();

  const handleSaveBirthDate = async () => {
    if (!birthDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/player/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_date: birthDate }),
      });
      if (res.ok) {
        setShowBirthModal(false);
        setStatus({ ...status, player: { ...status.player, birth_date: birthDate } });
      }
    } catch (err) {
      console.error('Error al guardar fecha de nacimiento:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PlayerShell>
      {/* Cabecera: logo, saludo y acceso al perfil */}
      <header className="flex items-center justify-between gap-3">
        <Image src="/logos/app_logo.png" alt="Wellness" width={56} height={56} />
        <Link
          href="/player/profile"
          aria-label={status.unreadInquiries ? 'Mi perfil (tienes respuestas sin leer)' : 'Mi perfil'}
          className="relative rounded-full ring-2 ring-ink-700 hover:ring-brand transition"
        >
          {status.unreadInquiries > 0 && (
            <span className="absolute -top-0.5 -right-0.5 z-10 w-3.5 h-3.5 rounded-full bg-brand ring-2 ring-ink-900" />
          )}
          <Avatar
            firstname={status.player.firstname}
            lastname={status.player.lastname}
            color={status.player.avatar_color}
          />
        </Link>
      </header>

      <div className="mt-6 mb-6">
        <p className="text-sm text-gray-400 capitalize">{formatDateLong(today)}</p>
        <h1 className="text-2xl font-bold mt-1">Hola, {status.player.nickname || status.player.firstname} 👋</h1>
        <p className="text-sm text-gray-400 mt-1">{status.player.team}</p>
        {status.streak > 1 && (
          <p className="inline-flex mt-3 px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 text-sm font-medium">
            🔥 {status.streak} días seguidos
          </p>
        )}
      </div>

      <div className="space-y-4">
        <NotificationsPrompt />
        <FormCard
          title="Wellness"
          description="Cómo te encuentras hoy"
          href="/player/forms/wellness"
          lastDate={status.wellness}
          window={WELLNESS_WINDOW}
          available={isWellnessAvailable()}
        />
        <FormCard
          title="Carga de entrenamiento (RPE)"
          description="Esfuerzo y molestias tras entrenar"
          href="/player/forms/load"
          lastDate={status.load}
          window={LOAD_WINDOW}
          available={isLoadAvailable()}
        />
      </div>

      <WhatsNew variant="dark" paused={showBirthModal} />

      {/* Modal fecha de nacimiento */}
      {showBirthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-ink-800 p-6 rounded-2xl shadow-lg w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Introduce tu fecha de nacimiento</h2>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-3 rounded-xl mb-4 bg-white text-black"
              max={today}
            />
            <Button onClick={handleSaveBirthDate} loading={saving} disabled={!birthDate} className="w-full">
              Guardar
            </Button>
          </div>
        </div>
      )}
    </PlayerShell>
  );
}
