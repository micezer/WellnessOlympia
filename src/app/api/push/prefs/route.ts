import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { players } from '@/db/schema';
import { getPlayerSession } from '@/lib/auth';

// Qué recordatorios quiere recibir la jugadora
export async function GET() {
  const { player, response } = await getPlayerSession();
  if (response) return response;
  return NextResponse.json(player.notify_prefs);
}

export async function PATCH(req: Request) {
  try {
    const { player, response } = await getPlayerSession();
    if (response) return response;

    const body = await req.json();
    const prefs = { ...player.notify_prefs };
    for (const key of ['wellness', 'load'] as const) {
      if (key in body) {
        if (typeof body[key] !== 'boolean')
          return NextResponse.json({ error: 'Preferencia inválida' }, { status: 400 });
        prefs[key] = body[key];
      }
    }

    await db.update(players).set({ notify_prefs: prefs }).where(eq(players.id, player.id));
    return NextResponse.json(prefs);
  } catch (err) {
    console.error('❌ Error guardando preferencias de notificación:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
