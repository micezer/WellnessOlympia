import { NextResponse, after } from 'next/server';
import { db } from '@/db/db';
import { player_wellness } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { validateWellness } from '@/lib/forms';
import { getPlayerSession, renewSession } from '@/lib/auth';
import { notifyTeamCoaches, safeNotify } from '@/lib/push';
import {
  isWellnessAvailable,
  getSpainDateString,
  formatWindow,
  WELLNESS_WINDOW,
} from '@/lib/time-utils';

// 🟢 GUARDAR FORMULARIO WELLNESS (POST)
export async function POST(req: Request) {
  try {
    if (!isWellnessAvailable()) {
      return NextResponse.json(
        {
          error: `El formulario de Wellness solo está disponible de ${formatWindow(WELLNESS_WINDOW)}`,
        },
        { status: 403 },
      );
    }

    const { player, response } = await getPlayerSession();
    if (response) return response;

    const parsed = validateWellness(await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const data = parsed.value;

    const today = getSpainDateString();

    const existing = await db
      .select({ id: player_wellness.id })
      .from(player_wellness)
      .where(and(eq(player_wellness.player_id, player.id), eq(player_wellness.date, today)));
    if (existing.length) return NextResponse.json({ error: 'Ya completado hoy' }, { status: 400 });

    // Para avisar al coach solo cuando la lesión es nueva (no cada día que siga lesionada)
    const [previous] = await db
      .select({ is_injured: player_wellness.is_injured })
      .from(player_wellness)
      .where(eq(player_wellness.player_id, player.id))
      .orderBy(desc(player_wellness.date))
      .limit(1);

    await db.insert(player_wellness).values({
      player_id: player.id,
      player_name: `${player.firstname} ${player.lastname}`,
      date: today,
      ...data,
    });

    if (data.is_injured && !previous?.is_injured)
      after(() =>
        safeNotify(() =>
          notifyTeamCoaches(player.team, {
            title: `🚑 ${player.firstname} ${player.lastname} indica una lesión`,
            body: data.injury_details ?? 'Revisa su wellness de hoy.',
            url: `/coach/dashboard/${encodeURIComponent(player.team)}`,
          }),
        ),
      );

    // 🔄 Extender sesión 20 días
    await renewSession('player', player);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error en POST /api/player/forms/wellness:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// 🟣 OBTENER FECHA DEL ÚLTIMO FORMULARIO (GET)
export async function GET() {
  try {
    const { player, response } = await getPlayerSession();
    if (response) return response;

    const [lastForm] = await db
      .select({ date: player_wellness.date })
      .from(player_wellness)
      .where(eq(player_wellness.player_id, player.id))
      .orderBy(desc(player_wellness.date))
      .limit(1);

    return NextResponse.json({ wellness: lastForm?.date || null });
  } catch (err) {
    console.error('❌ Error en GET /api/player/forms/wellness:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
