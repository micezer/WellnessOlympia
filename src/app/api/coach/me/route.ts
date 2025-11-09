// /api/coach/me/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { coaches } from '@/db/schema';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';
export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('user_token')?.value;
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const decoded: unknown = jwt.verify(token, SECRET_KEY);

    if (!decoded || typeof decoded !== 'object' || !('identifier' in decoded)) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const decodedPayload = decoded as { identifier: string };

    const coachData = await db
      .select({
        firstname: coaches.firstname,
        secondname: coaches.secondname,
        chosen_team: coaches.chosen_team,
      })
      .from(coaches)
      .where(eq(coaches.identifier, decodedPayload.identifier));

    if (!coachData.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    return NextResponse.json({
      firstname: coachData[0].firstname,
      secondname: coachData[0].secondname,
      chosen_team: coachData[0].chosen_team, // 🔹 devolver también
    });
  } catch (err) {
    console.error('❌ Error verificando token o fetch coach:', err);
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
}
