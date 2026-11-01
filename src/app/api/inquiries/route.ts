import { NextResponse, after } from 'next/server';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/db';
import { inquiries, inquiry_messages } from '@/db/schema';
import { readSession } from '@/lib/auth';
import { validateInquiry } from '@/lib/forms';
import { senderLabels } from '@/lib/inquiries';
import { notifyAdmins, safeNotify } from '@/lib/push';

const MAX_PER_DAY = 5;

type Row = typeof inquiries.$inferSelect;

// Solo campos públicos: nunca sender_id (en las anónimas delataría a quien escribe)
const publicFields = (i: Row) => ({
  id: i.id,
  subject: i.subject,
  status: i.status,
  anonymous: i.anonymous,
  created_at: i.created_at,
  updated_at: i.updated_at,
});

// Jugadora/coach: sus consultas. Admin: todas (con el nombre visible de quien escribe).
export async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (session.role === 'admin') {
      const all = await db.select().from(inquiries).orderBy(desc(inquiries.updated_at));
      const labels = await senderLabels(all);
      return NextResponse.json({
        inquiries: all.map((i) => ({ ...publicFields(i), sender: labels.get(i.id), unread: i.admin_unread })),
        unread: all.filter((i) => i.admin_unread).length,
      });
    }

    const own = await db
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.sender_role, session.role), eq(inquiries.sender_id, session.user.id)))
      .orderBy(desc(inquiries.updated_at));
    return NextResponse.json({
      inquiries: own.map((i) => ({ ...publicFields(i), unread: i.sender_unread })),
      unread: own.filter((i) => i.sender_unread).length,
    });
  } catch (err) {
    console.error('❌ Error listando consultas:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

// Nueva consulta (jugadoras y coaches)
export async function POST(req: Request) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (session.role === 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = validateInquiry(await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { subject, body, anonymous } = parsed.value;

    // Límite anti-spam
    const recent = await db
      .select({ id: inquiries.id })
      .from(inquiries)
      .where(
        and(
          eq(inquiries.sender_role, session.role),
          eq(inquiries.sender_id, session.user.id),
          gte(inquiries.created_at, new Date(Date.now() - 24 * 60 * 60 * 1000)),
        ),
      );
    if (recent.length >= MAX_PER_DAY)
      return NextResponse.json(
        { error: `Máximo ${MAX_PER_DAY} consultas al día. Inténtalo mañana.` },
        { status: 429 },
      );

    const inquiry = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(inquiries)
        .values({ sender_role: session.role, sender_id: session.user.id, anonymous, subject })
        .returning();
      await tx.insert(inquiry_messages).values({ inquiry_id: created.id, author: 'sender', body });
      return created;
    });

    const [label] = (await senderLabels([inquiry])).values();
    after(() =>
      safeNotify(() =>
        notifyAdmins({
          title: '💬 Nueva consulta',
          body: `${label}: ${subject}`,
          url: `/admin/inquiries/${inquiry.id}`,
          tag: `inquiry-${inquiry.id}`,
        }),
      ),
    );

    return NextResponse.json({ id: inquiry.id }, { status: 201 });
  } catch (err) {
    console.error('❌ Error creando consulta:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
