// lib/inquiries.ts
// Consultas al administrador: acceso y nombre visible de quien escribe. Solo servidor.
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/db';
import { coaches, inquiries, players } from '@/db/schema';
import { readSession } from '@/lib/auth';

export type Inquiry = typeof inquiries.$inferSelect;
type Session = NonNullable<Awaited<ReturnType<typeof readSession>>>;

// La consulta si quien pregunta es su autora o el administrador; null en otro caso
export async function findInquiryFor(session: Session, id: number): Promise<Inquiry | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
  if (!inquiry) return null;
  if (session.role === 'admin') return inquiry;
  return inquiry.sender_role === session.role && inquiry.sender_id === session.user.id ? inquiry : null;
}

export const isSender = (session: Session, inquiry: Inquiry) =>
  session.role !== 'admin' && inquiry.sender_role === session.role && inquiry.sender_id === session.user.id;

// Nombre que ve el administrador (las anónimas solo muestran el rol)
export async function senderLabels(list: Inquiry[]): Promise<Map<number, string>> {
  const ids = (role: string) => [
    ...new Set(list.filter((i) => i.sender_role === role && !i.anonymous).map((i) => i.sender_id)),
  ];
  const playerIds = ids('player');
  const coachIds = ids('coach');
  const [playerRows, coachRows] = await Promise.all([
    playerIds.length
      ? db
          .select({ id: players.id, firstname: players.firstname, lastname: players.lastname, team: players.team })
          .from(players)
          .where(inArray(players.id, playerIds))
      : [],
    coachIds.length
      ? db
          .select({ id: coaches.id, firstname: coaches.firstname, secondname: coaches.secondname })
          .from(coaches)
          .where(inArray(coaches.id, coachIds))
      : [],
  ]);
  const playerName = new Map(playerRows.map((p) => [p.id, `${p.firstname} ${p.lastname} · ${p.team}`]));
  const coachName = new Map(
    coachRows.map((c) => [c.id, `${c.firstname} ${c.secondname ?? ''}`.trim() + ' · Coach']),
  );

  return new Map(
    list.map((i) => [
      i.id,
      i.anonymous
        ? i.sender_role === 'player'
          ? 'Anónima · Jugadora'
          : 'Anónimo · Coach'
        : ((i.sender_role === 'player' ? playerName : coachName).get(i.sender_id) ?? 'Cuenta eliminada'),
    ]),
  );
}

// Consultas del usuario con respuesta sin leer (para el punto/contador en el menú)
export async function unreadForSender(role: 'player' | 'coach', userId: number) {
  const rows = await db
    .select({ id: inquiries.id })
    .from(inquiries)
    .where(
      and(eq(inquiries.sender_role, role), eq(inquiries.sender_id, userId), eq(inquiries.sender_unread, true)),
    );
  return rows.length;
}
