import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/db';
import {
  findUser,
  tableFor,
  hashPassword,
  logAuthEvent,
  redirectUrlFor,
  setSessionCookie,
  validatePassword,
} from '@/lib/auth';

// Primer acceso: la persona reclama su cuenta (identificador existente) creando una contraseña.
export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || typeof identifier !== 'string')
      return NextResponse.json({ error: 'Falta identificador' }, { status: 400 });

    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    const found = await findUser(identifier.trim());
    if (!found) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });

    const { role, user } = found;
    const table = tableFor(role);
    const password_hash = await hashPassword(password);

    // Atómico: solo se reclama si todavía no tiene contraseña (evita que dos personas la reclamen)
    const claimed = await db
      .update(table)
      .set({ password_hash, password_set_at: new Date(), failed_attempts: 0, locked_until: null })
      .where(and(eq(table.id, user.id), isNull(table.password_hash)))
      .returning({ token_version: table.token_version });

    if (!claimed.length)
      return NextResponse.json(
        {
          error:
            'Esta cuenta ya tiene contraseña. Si no la creaste tú, pulsa "¿Has olvidado tu contraseña?" o avisa a tu entrenador/a.',
        },
        { status: 409 },
      );

    await logAuthEvent(role, user.identifier, 'claim');
    await setSessionCookie(user.identifier, role, claimed[0].token_version);
    return NextResponse.json({ redirectUrl: redirectUrlFor(role, user) });
  } catch (err) {
    console.error('❌ Error en setup-password:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
