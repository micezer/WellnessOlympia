import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { push_subscriptions } from '@/db/schema';
import { readSession } from '@/lib/auth';

const unauthorized = () => NextResponse.json({ error: 'No autorizado' }, { status: 401 });

function parseSubscription(body: unknown) {
  const sub = (body as { subscription?: unknown })?.subscription as
    | { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
    | undefined;
  if (
    typeof sub?.endpoint !== 'string' ||
    !sub.endpoint.startsWith('https://') ||
    typeof sub.keys?.p256dh !== 'string' ||
    typeof sub.keys?.auth !== 'string'
  )
    return null;
  return { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth };
}

// Guarda (o reasigna al usuario actual) la suscripción de este dispositivo
export async function POST(req: Request) {
  try {
    const session = await readSession();
    if (!session) return unauthorized();

    const sub = parseSubscription(await req.json());
    if (!sub) return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });

    const owner = { role: session.role, user_id: session.user.id };
    await db
      .insert(push_subscriptions)
      .values({ ...sub, ...owner, user_agent: req.headers.get('user-agent') })
      .onConflictDoUpdate({
        target: push_subscriptions.endpoint,
        set: { ...owner, p256dh: sub.p256dh, auth: sub.auth },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error guardando suscripción push:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

// Quita la suscripción de este dispositivo (al desactivar o al cerrar sesión)
export async function DELETE(req: Request) {
  try {
    const session = await readSession();
    if (!session) return unauthorized();

    const { endpoint } = await req.json();
    if (typeof endpoint !== 'string') return NextResponse.json({ error: 'Falta endpoint' }, { status: 400 });

    await db
      .delete(push_subscriptions)
      .where(
        and(
          eq(push_subscriptions.endpoint, endpoint),
          eq(push_subscriptions.role, session.role),
          eq(push_subscriptions.user_id, session.user.id),
        ),
      );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error borrando suscripción push:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
