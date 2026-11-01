import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/db';
import { players } from '@/db/schema';
import { getCoachSession, logAuthEvent } from '@/lib/auth';

// El coach restablece la contraseña de una jugadora de su equipo: la cuenta vuelve a estar
// sin reclamar y todas sus sesiones abiertas se invalidan (token_version + 1).
export async function POST(req: Request) {
  try {
    const { coach, response } = await getCoachSession();
    if (response) return response;
    if (!coach.chosen_team)
      return NextResponse.json({ error: 'Selecciona un equipo primero' }, { status: 400 });

    const { playerId } = await req.json();
    if (!Number.isInteger(playerId))
      return NextResponse.json({ error: 'Jugadora inválida' }, { status: 400 });

    const [player] = await db
      .update(players)
      .set({
        password_hash: null,
        password_set_at: null,
        reset_requested_at: null,
        failed_attempts: 0,
        locked_until: null,
        token_version: sql`${players.token_version} + 1`,
      })
      .where(and(eq(players.id, playerId), eq(players.team, coach.chosen_team)))
      .returning({ identifier: players.identifier });

    if (!player)
      return NextResponse.json({ error: 'Jugadora no encontrada en tu equipo' }, { status: 404 });

    await logAuthEvent('player', player.identifier, 'reset', coach.identifier);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error en reset-password:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
