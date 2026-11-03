import { NextResponse } from 'next/server';
import { and, asc, count, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db/db';
import { notification_log, player_load, player_wellness, players, push_subscriptions } from '@/db/schema';
import { getAdminSession } from '@/lib/auth';
import { TEAMS } from '@/lib/forms';
import { addDays, getSpainDateString, isLoadAvailable, isWellnessAvailable } from '@/lib/time-utils';

// Uso de la app por las jugadoras: registro, avisos y formularios enviados.
// Solo estados (enviado sí/no), nunca el contenido de los formularios.

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_DAYS = 3; // dispositivo sin ninguna entrega en tantos días = revisar

function deviceType(userAgent: string | null): 'iphone' | 'android' | 'pc' {
  if (!userAgent) return 'pc';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iphone';
  if (/Android/i.test(userAgent)) return 'android';
  return 'pc';
}

export async function GET(req: Request) {
  try {
    const { response } = await getAdminSession();
    if (response) return response;

    const dateParam = new URL(req.url).searchParams.get('date');
    const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getSpainDateString();
    const from = addDays(date, -6);

    const [playerRows, subs, wellness, load, reminders] = await Promise.all([
      db
        .select({
          id: players.id,
          firstname: players.firstname,
          lastname: players.lastname,
          nickname: players.nickname,
          team: players.team,
          password_hash: players.password_hash,
          reset_requested_at: players.reset_requested_at,
        })
        .from(players)
        .orderBy(asc(players.team), asc(players.firstname)),
      db
        .select({
          user_id: push_subscriptions.user_id,
          user_agent: push_subscriptions.user_agent,
          created_at: push_subscriptions.created_at,
          last_success_at: push_subscriptions.last_success_at,
        })
        .from(push_subscriptions)
        .where(eq(push_subscriptions.role, 'player')),
      db
        .select({ player_id: player_wellness.player_id, date: player_wellness.date })
        .from(player_wellness)
        .where(and(gte(player_wellness.date, from), lte(player_wellness.date, date))),
      db
        .select({ player_id: player_load.player_id, date: player_load.date })
        .from(player_load)
        .where(and(gte(player_load.date, from), lte(player_load.date, date))),
      db
        .select({ kind: notification_log.kind, n: count() })
        .from(notification_log)
        .where(and(eq(notification_log.date, date), eq(notification_log.user_role, 'player')))
        .groupBy(notification_log.kind),
    ]);

    const now = Date.now();
    const devicesByPlayer = new Map<number, typeof subs>();
    for (const s of subs) devicesByPlayer.set(s.user_id, [...(devicesByPlayer.get(s.user_id) ?? []), s]);

    // Un dispositivo está "parado" si lleva días sin entregas (o nunca tuvo una desde que se activó)
    const isStale = (s: (typeof subs)[number]) => {
      const ref = s.last_success_at ?? s.created_at;
      return !!ref && now - ref.getTime() > STALE_DAYS * DAY_MS;
    };

    const wellnessToday = new Set(wellness.filter((w) => w.date === date).map((w) => w.player_id));
    const loadToday = new Set(load.filter((l) => l.date === date).map((l) => l.player_id));
    const teamOf = new Map(playerRows.map((p) => [p.id, p.team]));

    const list = playerRows.map((p) => {
      const devices = devicesByPlayer.get(p.id) ?? [];
      const lastDelivery = devices
        .map((d) => d.last_success_at)
        .filter((d): d is Date => !!d)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      return {
        id: p.id,
        name: p.nickname || `${p.firstname} ${p.lastname}`,
        fullName: `${p.firstname} ${p.lastname}`,
        team: p.team,
        registered: !!p.password_hash,
        resetRequested: !!p.reset_requested_at,
        devices: [...new Set(devices.map((d) => deviceType(d.user_agent)))],
        deviceCount: devices.length,
        lastDelivery: lastDelivery ?? null,
        stale: devices.length > 0 && devices.every(isStale),
        wellnessToday: wellnessToday.has(p.id),
        loadToday: loadToday.has(p.id),
      };
    });

    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    const teams = TEAMS.map((team) => {
      const members = list.filter((p) => p.team === team);
      const countFor = (rows: { player_id: number | null; date: string }[], d: string) =>
        rows.filter((r) => r.date === d && r.player_id !== null && teamOf.get(r.player_id) === team).length;
      return {
        team,
        total: members.length,
        registered: members.filter((p) => p.registered).length,
        withPush: members.filter((p) => p.deviceCount > 0).length,
        wellness: members.filter((p) => p.wellnessToday).length,
        load: members.filter((p) => p.loadToday).length,
        last7: days.map((d) => ({ date: d, wellness: countFor(wellness, d), load: countFor(load, d) })),
      };
    });

    return NextResponse.json({
      date,
      open: { wellness: isWellnessAvailable(), load: isLoadAvailable() },
      summary: {
        total: list.length,
        registered: list.filter((p) => p.registered).length,
        withPush: list.filter((p) => p.deviceCount > 0).length,
        devices: subs.length,
        deliveredLast24h: subs.filter((s) => s.last_success_at && now - s.last_success_at.getTime() < DAY_MS)
          .length,
        staleDevices: subs.filter(isStale).length,
        wellness: wellnessToday.size,
        load: loadToday.size,
      },
      reminders: Object.fromEntries(reminders.map((r) => [r.kind, r.n])),
      teams,
      players: list,
    });
  } catch (err) {
    console.error('❌ Error en /api/admin/usage:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
