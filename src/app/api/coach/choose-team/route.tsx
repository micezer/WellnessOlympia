import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { coaches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('user_token')?.value;
    if (!token) return NextResponse.json({ error: 'No logueado' }, { status: 401 });

    const payload = jwt.verify(token, SECRET_KEY) as { identifier: string; role: string };
    if (payload.role !== 'coach')
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { team } = await req.json();
    if (!team) return NextResponse.json({ error: 'Falta el equipo' }, { status: 400 });

    console.log('✅ Equipo recibido en el servidor:', team);

    await db
      .update(coaches)
      .set({ chosen_team: team })
      .where(eq(coaches.identifier, payload.identifier));

    return NextResponse.json({ redirectUrl: `/coach/dashboard/${team}` });
  } catch (err) {
    console.error('❌ Error en choose-team:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
