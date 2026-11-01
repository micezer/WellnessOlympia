import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { coaches, players } from '@/db/schema';
import { readSession } from '@/lib/auth';
import { LATEST_NEWS_VERSION, pendingNews } from '@/lib/news';

// Novedades pendientes de ver para la cuenta actual (jugadoras y coaches)
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (session.role === 'admin') return NextResponse.json({ items: [] });
  return NextResponse.json({ items: pendingNews(session.role, session.user.news_seen) });
}

// Marcar como vistas (no vuelven a salir en ningún dispositivo)
export async function POST() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (session.role === 'admin') return NextResponse.json({ success: true });
    const table = session.role === 'player' ? players : coaches;
    await db.update(table).set({ news_seen: LATEST_NEWS_VERSION }).where(eq(table.id, session.user.id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error marcando novedades:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
