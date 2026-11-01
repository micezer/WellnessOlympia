import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { inquiries, inquiry_messages } from '@/db/schema';
import { readSession } from '@/lib/auth';
import { findInquiryFor, isSender, senderLabels } from '@/lib/inquiries';

type Params = { params: Promise<{ id: string }> };

// Conversación completa; al abrirla se marca como leída para quien la ve
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const inquiry = await findInquiryFor(session, Number((await params).id));
    if (!inquiry) return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });

    const messages = await db
      .select({ id: inquiry_messages.id, author: inquiry_messages.author, body: inquiry_messages.body, created_at: inquiry_messages.created_at })
      .from(inquiry_messages)
      .where(eq(inquiry_messages.inquiry_id, inquiry.id))
      .orderBy(asc(inquiry_messages.created_at), asc(inquiry_messages.id));

    if (session.role === 'admin' && inquiry.admin_unread)
      await db.update(inquiries).set({ admin_unread: false }).where(eq(inquiries.id, inquiry.id));
    if (isSender(session, inquiry) && inquiry.sender_unread)
      await db.update(inquiries).set({ sender_unread: false }).where(eq(inquiries.id, inquiry.id));

    const sender = session.role === 'admin' ? (await senderLabels([inquiry])).get(inquiry.id) : undefined;
    return NextResponse.json({
      inquiry: {
        id: inquiry.id,
        subject: inquiry.subject,
        status: inquiry.status,
        anonymous: inquiry.anonymous,
        created_at: inquiry.created_at,
        sender,
      },
      messages,
    });
  } catch (err) {
    console.error('❌ Error abriendo consulta:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

// Admin: cerrar o reabrir
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const inquiry = await findInquiryFor(session, Number((await params).id));
    if (!inquiry) return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });

    const { status } = await req.json();
    if (status !== 'closed' && status !== 'open')
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });

    await db.update(inquiries).set({ status, updated_at: new Date() }).where(eq(inquiries.id, inquiry.id));
    return NextResponse.json({ status });
  } catch (err) {
    console.error('❌ Error actualizando consulta:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
