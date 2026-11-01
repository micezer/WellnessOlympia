import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/db/db';
import { coaches } from '@/db/schema';
import { getAdminSession } from '@/lib/auth';

// Lista de coaches y estado de sus cuentas (sin datos de equipos ni de salud)
export async function GET() {
  try {
    const { admin, response } = await getAdminSession();
    if (response) return response;

    const rows = await db
      .select({
        id: coaches.id,
        firstname: coaches.firstname,
        secondname: coaches.secondname,
        identifier: coaches.identifier,
        password_hash: coaches.password_hash,
        locked_until: coaches.locked_until,
        reset_requested_at: coaches.reset_requested_at,
      })
      .from(coaches)
      .orderBy(asc(coaches.firstname));

    return NextResponse.json({
      adminName: admin.name,
      adminIdentifier: admin.identifier,
      coaches: rows.map((c) => ({
        id: c.id,
        name: [c.firstname, c.secondname].filter(Boolean).join(' '),
        identifier: c.identifier,
        hasPassword: !!c.password_hash,
        locked: !!c.locked_until && c.locked_until > new Date(),
        resetRequestedAt: c.reset_requested_at,
      })),
    });
  } catch (err) {
    console.error('❌ Error en /api/admin/coaches:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
