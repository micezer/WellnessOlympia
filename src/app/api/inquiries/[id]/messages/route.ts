import { NextResponse, after } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { inquiries, inquiry_messages } from '@/db/schema';
import { readSession } from '@/lib/auth';
import { validateInquiryMessage } from '@/lib/forms';
import { findInquiryFor, senderLabels } from '@/lib/inquiries';
import { notifyAdmins, safeNotify, sendToUser } from '@/lib/push';

// Responder en la conversación (autora o administrador). Escribir en una cerrada la reabre.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const inquiry = await findInquiryFor(session, Number((await params).id));
    if (!inquiry) return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });

    const parsed = validateInquiryMessage(await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const fromAdmin = session.role === 'admin';
    await db.transaction(async (tx) => {
      await tx.insert(inquiry_messages).values({
        inquiry_id: inquiry.id,
        author: fromAdmin ? 'admin' : 'sender',
        body: parsed.value,
      });
      await tx
        .update(inquiries)
        .set(
          fromAdmin
            ? { status: 'answered', sender_unread: true, updated_at: new Date() }
            : { status: 'open', admin_unread: true, updated_at: new Date() },
        )
        .where(eq(inquiries.id, inquiry.id));
    });

    if (fromAdmin) {
      const role = inquiry.sender_role === 'coach' ? 'coach' : 'player';
      after(() =>
        safeNotify(() =>
          sendToUser(role, inquiry.sender_id, {
            title: '💬 Respuesta a tu consulta',
            body: inquiry.subject,
            url: role === 'player' ? `/player/inquiries/${inquiry.id}` : `/coach/inquiries/${inquiry.id}`,
            tag: `inquiry-${inquiry.id}`,
          }),
        ),
      );
    } else {
      const [label] = (await senderLabels([inquiry])).values();
      after(() =>
        safeNotify(() =>
          notifyAdmins({
            title: '💬 Nuevo mensaje en una consulta',
            body: `${label}: ${inquiry.subject}`,
            url: `/admin/inquiries/${inquiry.id}`,
            tag: `inquiry-${inquiry.id}`,
          }),
        ),
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('❌ Error enviando mensaje:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
