import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { player_wellness, players } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { isWellnessAvailable } from '@/lib/time-utils';


const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

export async function POST(req: Request) {
  try {
    // Validar horario
    if (!isWellnessAvailable()) {
      return NextResponse.json(
        { error: 'El formulario de Wellness solo está disponible de 9:00 a 12:00' },
        { status: 403 },
      );
    }

    const cookieStore = cookies();
    const token = (await cookieStore).get('user_token')?.value;
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const payload = jwt.verify(token, SECRET_KEY) as { identifier: string; role: string };
    const player = await db
      .select()
      .from(players)
      .where(eq(players.identifier, payload.identifier))
      .limit(1);

    if (!player.length)
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });

    const playerId = player[0].id;
    const playerName = `${player[0].firstname} ${player[0].lastname}`;
    const data = await req.json();

    const getTodaySpain = () => {
      const now = new Date();
      const spainTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
      return spainTime.toISOString().split('T')[0];
    };

    const today = getTodaySpain();

    const existing = await db
      .select()
      .from(player_wellness)
      .where(and(eq(player_wellness.player_id, playerId), eq(player_wellness.date, today)));

    if (existing.length) return NextResponse.json({ error: 'Ya completado hoy' }, { status: 400 });

    await db.insert(player_wellness).values({
      player_id: playerId,
      player_name: playerName,
      date: today,
      fatigue_level: data.fatigue_level,
      tiredness_level: data.tiredness_level,
      stress_level: data.stress_level,
      mood: data.mood,
      sleep_hours: data.sleep_hours,
      is_injured: data.is_injured,
      injury_details: data.injury_details || null,
      menstrual_phase: data.menstrual_phase || null,
      discomfort: data.discomfort || null,
    });

    await db
      .update(players)
      .set({ last_wellness_date: new Date() })
      .where(eq(players.id, playerId));

    // 🔄 Extender token 20 días
    const newToken = jwt.sign({ identifier: payload.identifier, role: payload.role }, SECRET_KEY, {
      expiresIn: '20d',
    });

    (await cookieStore).set('user_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 20 * 24 * 60 * 60, // 20 días
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Error en POST /api/player/forms/wellness:', err.message, err.stack);
    } else {
      console.error('❌ Error desconocido en POST /api/player/forms/wellness:', err);
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
