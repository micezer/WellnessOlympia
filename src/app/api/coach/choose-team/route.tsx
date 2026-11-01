import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { coaches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { TEAMS } from '@/lib/forms';
import { getCoachSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { coach, response } = await getCoachSession();
    if (response) return response;

    const { team } = await req.json();
    if (!(TEAMS as readonly string[]).includes(team))
      return NextResponse.json({ error: 'Equipo inválido' }, { status: 400 });

    await db.update(coaches).set({ chosen_team: team }).where(eq(coaches.id, coach.id));

    return NextResponse.json({ redirectUrl: `/coach/dashboard/${team}` });
  } catch (err) {
    console.error('❌ Error en choose-team:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
