// lib/push.ts
// Envío de notificaciones push (Web Push con claves VAPID). Solo para uso en servidor.
import webpush from 'web-push';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/db';
import { admins, coaches, push_subscriptions } from '@/db/schema';
import type { Role } from '@/lib/auth';

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // dónde abrir la app al tocarla
  tag?: string; // misma etiqueta = sustituye a la notificación anterior
};

let configured = false;

// false si faltan las variables (la app funciona igual, solo que sin notificaciones)
function configure(): boolean {
  if (configured) return true;
  // trim: un espacio o salto de línea pegado en el panel de Vercel hace que Apple rechace todo (BadJwtToken)
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) {
    console.warn('⚠️ Push desactivado: faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT');
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

type Subscription = typeof push_subscriptions.$inferSelect;

async function sendToSubscriptions(subs: Subscription[], payload: PushPayload): Promise<number> {
  if (!subs.length || !configure()) return 0;
  const body = JSON.stringify(payload);
  let delivered = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60 * 4 }, // si el móvil está apagado, se entrega hasta 4 h después
        );
        delivered++;
        await db
          .update(push_subscriptions)
          .set({ last_success_at: new Date() })
          .where(eq(push_subscriptions.id, sub.id));
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410: el dispositivo ya no acepta notificaciones (desinstalada, permiso retirado...)
        if (status === 404 || status === 410)
          await db.delete(push_subscriptions).where(eq(push_subscriptions.id, sub.id));
        else console.error('❌ Error enviando push:', status, err);
      }
    }),
  );
  return delivered;
}

// Envía a todos los dispositivos de los usuarios indicados. Devuelve cuántas se entregaron.
export async function sendToUsers(role: Role, userIds: number[], payload: PushPayload) {
  if (!userIds.length) return 0;
  const subs = await db
    .select()
    .from(push_subscriptions)
    .where(and(eq(push_subscriptions.role, role), inArray(push_subscriptions.user_id, userIds)));
  return sendToSubscriptions(subs, payload);
}

export const sendToUser = (role: Role, userId: number, payload: PushPayload) =>
  sendToUsers(role, [userId], payload);

// Coaches que tienen elegido ese equipo
export async function notifyTeamCoaches(team: string, payload: PushPayload) {
  const teamCoaches = await db
    .select({ id: coaches.id })
    .from(coaches)
    .where(eq(coaches.chosen_team, team));
  return sendToUsers(
    'coach',
    teamCoaches.map((c) => c.id),
    payload,
  );
}

export async function notifyAdmins(payload: PushPayload) {
  const all = await db.select({ id: admins.id }).from(admins);
  return sendToUsers(
    'admin',
    all.map((a) => a.id),
    payload,
  );
}

// Los avisos nunca deben romper la acción que los provoca
export async function safeNotify(send: () => Promise<unknown>) {
  try {
    await send();
  } catch (err) {
    console.error('❌ Error en notificación:', err);
  }
}
