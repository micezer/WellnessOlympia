import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { unreadForSender } from '@/lib/inquiries';
import { db } from '@/db/db';
import { player_load, player_wellness } from '@/db/schema';
import { and, eq, desc, gte } from 'drizzle-orm';
import { readSession } from '@/lib/auth';
import { moodLabel } from '@/lib/forms';
import { computeStreak, getPlayerHistory } from '@/lib/history';
import { addDays, formatDateRelative, getSpainDateString } from '@/lib/time-utils';
import { PlayerShell } from '@/components/brand/player-shell';
import { Avatar } from '@/components/brand/avatar';
import { LogoutButton } from '@/components/brand/logout-button';
import { NotificationSettings } from '@/components/brand/notifications';
import { ProfileEdit } from '@/components/brand/profile-edit';
import { PlayerTrends } from '@/components/brand/player-trends';
import { ChangePassword } from '@/components/brand/change-password';

export const metadata = {
  title: 'Mi perfil',
};

const TREND_DAYS = 14;
const STREAK_LOOKBACK_DAYS = 120;

// Edad a partir de 'YYYY-MM-DD' comparando con la fecha de hoy en España
function ageFrom(birthDate: string | null, today: string): number | null {
  if (!birthDate) return null;
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-xl bg-ink-700 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`mt-1 font-semibold ${
          tone === 'good' ? 'text-brand' : tone === 'bad' ? 'text-red-400' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function PlayerProfilePage() {
  // redirect() lanza una excepción: se llama fuera de cualquier try/catch
  const session = await readSession();
  if (!session) redirect('/');
  if (session.role !== 'player') redirect('/coach/choose-team');
  const player = session.user;
  const today = getSpainDateString();

  const [[latestWellness], [latestLoad], recentWellness, { history }] = await Promise.all([
    db
      .select()
      .from(player_wellness)
      .where(eq(player_wellness.player_id, player.id))
      .orderBy(desc(player_wellness.date))
      .limit(1),
    db
      .select()
      .from(player_load)
      .where(eq(player_load.player_id, player.id))
      .orderBy(desc(player_load.date))
      .limit(1),
    db
      .select({ date: player_wellness.date })
      .from(player_wellness)
      .where(
        and(
          eq(player_wellness.player_id, player.id),
          gte(player_wellness.date, addDays(today, -STREAK_LOOKBACK_DAYS)),
        ),
      ),
    getPlayerHistory(player.id, today, TREND_DAYS),
  ]);
  const unreadInquiries = await unreadForSender('player', player.id);

  const wellnessDates = new Set(recentWellness.map((w) => w.date));
  const streak = computeStreak(wellnessDates, today);
  // Este mes: días con wellness / días transcurridos (hoy incluido)
  const monthPrefix = today.slice(0, 8);
  const monthDone = [...wellnessDates].filter((d) => d.startsWith(monthPrefix)).length;
  const monthDays = Number(today.slice(8, 10));

  const age = ageFrom(player.birth_date, today);
  const displayName = player.nickname || `${player.firstname} ${player.lastname}`;

  return (
    <PlayerShell title="Mi perfil" backHref="/player/welcome">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar firstname={player.firstname} lastname={player.lastname} color={player.avatar_color} size="lg" />
          {player.shirt_number !== null && (
            <span className="absolute -bottom-1 -right-1 min-w-9 h-9 px-1.5 rounded-full bg-ink-900 border-2 border-ink-700 flex items-center justify-center text-sm font-bold">
              {player.shirt_number}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold mt-4">{displayName}</h2>
        {player.nickname && (
          <p className="text-sm text-gray-400">
            {player.firstname} {player.lastname}
          </p>
        )}
        <p className="text-gray-400 mt-1">
          {[player.team, player.position, age !== null && `${age} años`].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-4">
          <ProfileEdit
            profile={{
              firstname: player.firstname,
              lastname: player.lastname,
              nickname: player.nickname,
              shirt_number: player.shirt_number,
              avatar_color: player.avatar_color,
              birth_date: player.birth_date,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="rounded-2xl bg-ink-800 p-4">
          <p className="text-xs text-gray-400">Mi racha</p>
          <p className="text-2xl font-bold mt-1">🔥 {streak}</p>
          <p className="text-xs text-gray-400">{streak === 1 ? 'día seguido' : 'días seguidos'}</p>
        </div>
        <div className="rounded-2xl bg-ink-800 p-4">
          <p className="text-xs text-gray-400">Este mes</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">
            {monthDone}
            <span className="text-base text-gray-400">/{monthDays}</span>
          </p>
          <p className="text-xs text-gray-400">días con wellness</p>
        </div>
      </div>

      <section className="rounded-2xl bg-ink-800 p-4 mt-4">
        <h3 className="font-semibold mb-3">Mi último registro</h3>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Estado físico"
            value={latestWellness?.is_injured ? 'Lesionada' : 'Apta'}
            tone={latestWellness?.is_injured ? 'bad' : 'good'}
          />
          <Stat label="Estado de ánimo" value={moodLabel(latestWellness?.mood)} />
          <Stat
            label={`Último RPE (${formatDateRelative(latestLoad?.date ?? null)})`}
            value={latestLoad ? `${latestLoad.rpe}/10` : '—'}
          />
          <Stat
            label={`Sueño (${formatDateRelative(latestWellness?.date ?? null)})`}
            value={latestWellness ? `${latestWellness.sleep_hours} h` : '—'}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-ink-800 p-4 mt-4">
        <h3 className="font-semibold">Mi evolución</h3>
        <p className="text-xs text-gray-400 mb-3">Últimos {TREND_DAYS} días. Los huecos son días sin formulario.</p>
        <PlayerTrends history={history} />
      </section>

      <Link
        href="/player/inquiries"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-ink-800 p-4 hover:bg-ink-700 transition"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="flex-1">
          <span className="font-semibold block">Consultas</span>
          <span className="text-xs text-gray-400">Escribe al club, también de forma anónima</span>
        </span>
        {unreadInquiries > 0 && (
          <span className="min-w-6 h-6 px-2 rounded-full bg-brand text-black text-xs font-bold flex items-center justify-center">
            {unreadInquiries}
          </span>
        )}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>

      <div className="mt-4">
        <NotificationSettings />
      </div>

      <div className="mt-4">
        <ChangePassword identifier={player.identifier} />
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </PlayerShell>
  );
}
