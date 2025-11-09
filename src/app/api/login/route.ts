import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { coaches, players } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier) return NextResponse.json({ error: 'Falta identificador' }, { status: 400 });

    let role: 'coach' | 'player' | null = null;
    let redirectUrl = '/login';
    let coachData = null;

    // Buscar en coaches
    const coachResult = await db.select().from(coaches).where(eq(coaches.identifier, identifier));
    if (coachResult.length) {
      role = 'coach';
      coachData = coachResult[0];
      redirectUrl = coachData.chosen_team
        ? `/coach/dashboard/${coachData.chosen_team}`
        : '/coach/choose-team';
    }

    // Buscar en players si no es coach
    if (!role) {
      const playerResult = await db
        .select()
        .from(players)
        .where(eq(players.identifier, identifier));
      if (playerResult.length) {
        role = 'player';
        redirectUrl = '/player/welcome';
      }
    }

    if (!role) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });

    // Crear JWT con identifier y role
    const token = jwt.sign({ identifier, role }, SECRET_KEY, { expiresIn: '7d' });

    const cookie = serialize('user_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
    });

    return NextResponse.json({ redirectUrl }, { headers: { 'Set-Cookie': cookie } });
  } catch (err) {
    console.error('❌ Error en login:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
