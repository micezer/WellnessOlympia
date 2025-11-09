import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/db/db';
import { players } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

export async function PATCH(req: Request) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('user_token')?.value;
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded = jwt.verify(token, SECRET_KEY) as { identifier: string; role: string };
    if (decoded.role !== 'player')
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await req.json();
    const { birth_date } = body;

    if (!birth_date)
      return NextResponse.json({ error: 'Fecha de nacimiento requerida' }, { status: 400 });

    const result = await db
      .update(players)
      .set({ birth_date }) // aquí asumimos que ya hiciste el ALTER TABLE y existe birth_date
      .where(eq(players.identifier, decoded.identifier));

    return NextResponse.json({ success: true, updated: result.rowCount });
  } catch (err) {
    console.error('❌ Error en update-birth:', err);
    return NextResponse.json({ error: 'Error al actualizar fecha de nacimiento' }, { status: 500 });
  }
}
