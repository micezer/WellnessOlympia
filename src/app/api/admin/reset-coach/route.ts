import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/db';
import { coaches } from '@/db/schema';
import { getAdminSession, logAuthEvent } from '@/lib/auth';

// El admin restablece la contraseña de un coach: la cuenta queda sin reclamar
// y todas sus sesiones abiertas se invalidan (token_version + 1).
export async function POST(req: Request) {
  try {
    const { admin, response } = await getAdminSession();
    if (response) return response;

    const { coachId } = await req.json();
    if (!Number.isInteger(coachId))
      return NextResponse.json({ error: 'Coach inválido' }, { status: 400 });

    const [coach] = await db
      .update(coaches)
      .set({
        password_hash: null,
        password_set_at: null,
        reset_requested_at: null,
        failed_attempts: 0,
        locked_until: null,
        token_version: sql`${coaches.token_version} + 1`,
      })
      .where(eq(coaches.id, coachId))
      .returning({ identifier: coaches.identifier });

    if (!coach) return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 });

    await logAuthEvent('coach', coach.identifier, 'reset', admin.identifier);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error en reset-coach:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
