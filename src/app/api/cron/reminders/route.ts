// Recordatorios diarios. Lo llama un cron externo (cron-job.org, zona Europe/Madrid):
//   08:00 ?kind=wellness_open   11:00 ?kind=wellness_last
//   20:00 ?kind=load_open       23:00 ?kind=load_last
// con la cabecera  Authorization: Bearer <CRON_SECRET>
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/db';
import { notification_log, player_load, player_wellness, players, push_subscriptions } from '@/db/schema';
import { sendToUser, type PushPayload } from '@/lib/push';
import {
  getSpainDateString,
  isLoadAvailable,
  isWellnessAvailable,
  LOAD_WINDOW,
  WELLNESS_WINDOW,
} from '@/lib/time-utils';

const closesAt = (window: { end: number }) => `${window.end - 1}:59`;

const KINDS = {
  wellness_open: {
    form: 'wellness',
    payload: {
      title: 'Wellness disponible ☀️',
      body: `Rellena tu wellness antes de las ${closesAt(WELLNESS_WINDOW)}.`,
      url: '/player/forms/wellness',
      tag: 'wellness',
    },
  },
  wellness_last: {
    form: 'wellness',
    payload: {
      title: 'Última hora para el wellness ⏰',
      body: `Aún no lo has rellenado. Se cierra a las ${closesAt(WELLNESS_WINDOW)}.`,
      url: '/player/forms/wellness',
      tag: 'wellness',
    },
  },
  load_open: {
    form: 'load',
    payload: {
      title: '¿Qué tal el entreno? 💪',
      body: `Ya puedes rellenar el RPE (hasta las ${closesAt(LOAD_WINDOW)}).`,
      url: '/player/forms/load',
      tag: 'load',
    },
  },
  load_last: {
    form: 'load',
    payload: {
      title: 'Última hora para el RPE ⏰',
      body: `Aún no lo has rellenado. Se cierra a las ${closesAt(LOAD_WINDOW)}.`,
      url: '/player/forms/load',
      tag: 'load',
    },
  },
} satisfies Record<string, { form: 'wellness' | 'load'; payload: PushPayload }>;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const kindParam = new URL(req.url).searchParams.get('kind') ?? '';
  if (!(kindParam in KINDS)) return NextResponse.json({ error: 'kind inválido' }, { status: 400 });
  const kind = kindParam as keyof typeof KINDS;
  const { form, payload } = KINDS[kind];

  // Si el cron se dispara a una hora equivocada no se avisa de un formulario cerrado
  const open = form === 'wellness' ? isWellnessAvailable() : isLoadAvailable();
  if (!open) return NextResponse.json({ kind, sent: 0, skipped: 'formulario cerrado ahora' });

  const today = getSpainDateString();

  // Jugadoras con algún dispositivo suscrito y este recordatorio activado
  const subscribed = await db
    .selectDistinct({ id: players.id, prefs: players.notify_prefs })
    .from(players)
    .innerJoin(
      push_subscriptions,
      and(eq(push_subscriptions.role, 'player'), eq(push_subscriptions.user_id, players.id)),
    );
  const wanted = subscribed.filter((p) => p.prefs?.[form] !== false).map((p) => p.id);
  if (!wanted.length) return NextResponse.json({ kind, sent: 0 });

  // Quitar a quien ya lo ha rellenado hoy
  const table = form === 'wellness' ? player_wellness : player_load;
  const done = await db
    .select({ id: table.player_id })
    .from(table)
    .where(and(eq(table.date, today), inArray(table.player_id, wanted)));
  const doneIds = new Set(done.map((d) => d.id));
  const pending = wanted.filter((id) => !doneIds.has(id));
  if (!pending.length) return NextResponse.json({ kind, sent: 0 });

  // Reservar el envío en el log: si el cron se ejecuta dos veces, la segunda no envía nada
  const claimed = await db
    .insert(notification_log)
    .values(pending.map((id) => ({ date: today, kind, user_role: 'player', user_id: id })))
    .onConflictDoNothing()
    .returning({ id: notification_log.user_id });

  const results = await Promise.all(claimed.map((c) => sendToUser('player', c.id, payload)));
  const delivered = results.reduce((a, b) => a + b, 0);

  return NextResponse.json({ kind, players: claimed.length, delivered });
}

export async function GET(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error('❌ Error en cron de recordatorios:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export const POST = GET;
