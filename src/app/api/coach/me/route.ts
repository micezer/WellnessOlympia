// /api/coach/me/route.ts
import { NextResponse } from 'next/server';
import { getCoachSession } from '@/lib/auth';

export async function GET() {
  try {
    const { coach, response } = await getCoachSession();
    if (response) return response;

    return NextResponse.json({
      identifier: coach.identifier,
      firstname: coach.firstname,
      secondname: coach.secondname,
      chosen_team: coach.chosen_team,
    });
  } catch (err) {
    console.error('❌ Error en /api/coach/me:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
