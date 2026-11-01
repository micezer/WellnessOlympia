import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { player_load } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { validateLoad } from '@/lib/forms';
import { getPlayerSession, renewSession } from '@/lib/auth';
import { isLoadAvailable, getSpainDateString, formatWindow, LOAD_WINDOW } from '@/lib/time-utils';

// 🟢 GUARDAR FORMULARIO RPE (POST)
export async function POST(req: Request) {
  try {
    if (!isLoadAvailable()) {
      return NextResponse.json(
        { error: `El formulario de RPE solo está disponible de ${formatWindow(LOAD_WINDOW)}` },
        { status: 403 },
      );
    }

    const { player, response } = await getPlayerSession();
    if (response) return response;

    const parsed = validateLoad(await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const data = parsed.value;

    const today = getSpainDateString();

    // Evitar duplicados del mismo día
    const existing = await db
      .select({ id: player_load.id })
      .from(player_load)
      .where(and(eq(player_load.player_id, player.id), eq(player_load.date, today)));
    if (existing.length) return NextResponse.json({ error: 'Ya completado hoy' }, { status: 400 });

    await db.insert(player_load).values({
      player_id: player.id,
      player_name: `${player.firstname} ${player.lastname}`,
      rpe: data.rpe,
      muscle_pain: data.musclePain,
      date: today,
    });

    // 🔄 Extender sesión 20 días
    await renewSession('player', player);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error en POST /api/player/forms/load:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// 🟣 OBTENER FECHA DEL ÚLTIMO FORMULARIO (GET)
export async function GET() {
  try {
    const { player, response } = await getPlayerSession();
    if (response) return response;

    const [lastForm] = await db
      .select({ date: player_load.date })
      .from(player_load)
      .where(eq(player_load.player_id, player.id))
      .orderBy(desc(player_load.date))
      .limit(1);

    return NextResponse.json({ load: lastForm?.date || null });
  } catch (err) {
    console.error('❌ Error en GET /api/player/forms/load:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
