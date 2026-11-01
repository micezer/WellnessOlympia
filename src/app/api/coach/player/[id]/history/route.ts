// Historial de una jugadora (últimos N días) para el panel de detalle del coach
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { players } from '@/db/schema';
import { getCoachSession } from '@/lib/auth';
import { getSpainDateString } from '@/lib/time-utils';
import { getPlayerHistory } from '@/lib/history';

const DEFAULT_DAYS = 14;
const MAX_DAYS = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { coach, response } = await getCoachSession();
    if (response) return response;

    const playerId = Number((await params).id);
    if (!Number.isInteger(playerId) || playerId <= 0)
      return NextResponse.json({ error: 'Jugadora inválida' }, { status: 400 });

    const [player] = await db.select().from(players).where(eq(players.id, playerId));
    if (!player) return NextResponse.json({ error: 'Jugadora no encontrada' }, { status: 404 });
    // Solo jugadoras del equipo que el coach tiene elegido
    if (player.team !== coach.chosen_team)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(req.url);
    const daysParam = Number(url.searchParams.get('days'));
    const days = Number.isInteger(daysParam) && daysParam > 0 ? Math.min(daysParam, MAX_DAYS) : DEFAULT_DAYS;
    const dateParam = url.searchParams.get('date');
    const end = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getSpainDateString();

    const { start, history } = await getPlayerHistory(playerId, end, days);

    return NextResponse.json({ playerId, start, end, history });
  } catch (err) {
    console.error('❌ Error en historial de jugadora:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
