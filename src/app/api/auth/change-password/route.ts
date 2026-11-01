import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/db';
import {
  hashPassword,
  logAuthEvent,
  readSession,
  setSessionCookie,
  tableFor,
  validatePassword,
  verifyPassword,
  LOCKOUT_MINUTES,
  MAX_FAILED_ATTEMPTS,
} from '@/lib/auth';

// Cambiar la contraseña propia: { currentPassword, newPassword }.
// Cierra las sesiones de los demás dispositivos; este sigue dentro con una sesión nueva.
export async function POST(req: Request) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { role, user } = session;
    const table = tableFor(role);

    const { currentPassword, newPassword } = await req.json();

    if (user.locked_until && user.locked_until > new Date()) {
      const minutes = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos. Prueba de nuevo en ${minutes} min` },
        { status: 429 },
      );
    }

    // Mismo contador de intentos que el login: la sesión abierta no sirve para adivinar la contraseña
    if (
      typeof currentPassword !== 'string' ||
      !(await verifyPassword(currentPassword, user.password_hash!))
    ) {
      const [updated] = await db
        .update(table)
        .set({ failed_attempts: sql`${table.failed_attempts} + 1` })
        .where(eq(table.id, user.id))
        .returning({ failed_attempts: table.failed_attempts });
      await logAuthEvent(role, user.identifier, 'login_fail');
      if (updated.failed_attempts >= MAX_FAILED_ATTEMPTS) {
        await db
          .update(table)
          .set({ failed_attempts: 0, locked_until: new Date(Date.now() + LOCKOUT_MINUTES * 60000) })
          .where(eq(table.id, user.id));
        await logAuthEvent(role, user.identifier, 'lockout');
        return NextResponse.json(
          { error: `Demasiados intentos. Prueba de nuevo en ${LOCKOUT_MINUTES} min` },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 401 });
    }

    const invalid = validatePassword(newPassword);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    if (newPassword === currentPassword)
      return NextResponse.json({ error: 'La nueva contraseña debe ser distinta' }, { status: 400 });

    const [updated] = await db
      .update(table)
      .set({
        password_hash: await hashPassword(newPassword),
        password_set_at: new Date(),
        token_version: sql`${table.token_version} + 1`,
        failed_attempts: 0,
        locked_until: null,
      })
      .where(eq(table.id, user.id))
      .returning({ token_version: table.token_version });

    await setSessionCookie(user.identifier, role, updated.token_version);
    await logAuthEvent(role, user.identifier, 'password_change');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error cambiando contraseña:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
