import { NextResponse, after } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { coaches, players } from '@/db/schema';
import { findUser, logAuthEvent } from '@/lib/auth';
import { notifyAdmins, notifyTeamCoaches, safeNotify } from '@/lib/push';

// Solicitud de restablecer contraseña:
// - jugadora → aviso en el dashboard de su equipo
// - coach    → aviso en el panel de administración (y que escriba al administrador)
// Respuestas: requested | already_requested | already_reset | contact_admin
export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (typeof identifier !== 'string' || !identifier.trim())
      return NextResponse.json({ error: 'Falta identificador' }, { status: 400 });

    const found = await findUser(identifier.trim());
    if (!found) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });

    const { role, user } = found;
    // El admin no tiene a quién pedírselo: se restablece desde la terminal
    if (role === 'admin') return NextResponse.json({ status: 'contact_admin' });

    // Ya restablecida: puede crear la contraseña nueva directamente
    if (!user.password_hash) return NextResponse.json({ status: 'already_reset' });
    if (user.reset_requested_at) return NextResponse.json({ status: 'already_requested', role });

    const table = role === 'coach' ? coaches : players;
    await db.update(table).set({ reset_requested_at: new Date() }).where(eq(table.id, user.id));
    await logAuthEvent(role, user.identifier, 'reset_request');

    // Aviso a quien puede restablecerla: coaches del equipo (jugadora) o administradores (coach)
    const name = role === 'coach' ? `${user.firstname} ${user.secondname ?? ''}`.trim() : `${user.firstname} ${user.lastname}`;
    const payload = {
      title: '🔑 Solicitud de contraseña',
      body: `${name} pide restablecer su contraseña.`,
      tag: 'reset-request',
    };
    after(() =>
      safeNotify(() =>
        role === 'player'
          ? notifyTeamCoaches(user.team, {
              ...payload,
              url: `/coach/dashboard/${encodeURIComponent(user.team)}`,
            })
          : notifyAdmins({ ...payload, url: '/admin' }),
      ),
    );

    return NextResponse.json({ status: 'requested', role });
  } catch (err) {
    console.error('❌ Error en forgot:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
