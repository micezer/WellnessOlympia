import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/db';
import {
  findUser,
  tableFor,
  logAuthEvent,
  redirectUrlFor,
  setSessionCookie,
  verifyPassword,
  LOCKOUT_MINUTES,
  MAX_FAILED_ATTEMPTS,
} from '@/lib/auth';

// Paso 1: { identifier } → indica si la cuenta necesita crear contraseña o pedirla.
// Paso 2: { identifier, password } → inicia sesión.
export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || typeof identifier !== 'string')
      return NextResponse.json({ error: 'Falta identificador' }, { status: 400 });

    const found = await findUser(identifier.trim());
    if (!found) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });

    const { role, user } = found;
    // reset = la cuenta ya tuvo contraseña y alguien la restableció (token_version sube en cada reset)
    if (!user.password_hash)
      return NextResponse.json({ status: 'needs_setup', reset: user.token_version > 0 });
    if (!password) return NextResponse.json({ status: 'needs_password' });

    if (user.locked_until && user.locked_until > new Date()) {
      const minutes = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos. Prueba de nuevo en ${minutes} min` },
        { status: 429 },
      );
    }

    const table = tableFor(role);

    if (typeof password !== 'string' || !(await verifyPassword(password, user.password_hash))) {
      // Incremento atómico; al llegar al máximo se bloquea la cuenta y se reinicia el contador
      const [updated] = await db
        .update(table)
        .set({ failed_attempts: sql`${table.failed_attempts} + 1` })
        .where(eq(table.id, user.id))
        .returning({ failed_attempts: table.failed_attempts });

      await logAuthEvent(role, user.identifier, 'login_fail');

      if (updated.failed_attempts >= MAX_FAILED_ATTEMPTS) {
        await db
          .update(table)
          .set({
            failed_attempts: 0,
            locked_until: new Date(Date.now() + LOCKOUT_MINUTES * 60000),
          })
          .where(eq(table.id, user.id));
        await logAuthEvent(role, user.identifier, 'lockout');
        return NextResponse.json(
          { error: `Demasiados intentos. Prueba de nuevo en ${LOCKOUT_MINUTES} min` },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Si entra con su contraseña es que la recuerda: se cancela cualquier solicitud de restablecer
    // pendiente (los admins no tienen solicitudes)
    const pendingReset = role !== 'admin' && !!user.reset_requested_at;
    if (user.failed_attempts > 0 || user.locked_until || pendingReset)
      await db
        .update(table)
        .set({
          failed_attempts: 0,
          locked_until: null,
          ...(pendingReset ? { reset_requested_at: null } : {}),
        })
        .where(eq(table.id, user.id));

    await setSessionCookie(user.identifier, role, user.token_version);
    return NextResponse.json({ redirectUrl: redirectUrlFor(role, user) });
  } catch (err) {
    console.error('❌ Error en login:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
