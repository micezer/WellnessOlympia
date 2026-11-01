// lib/auth.ts
// Sesiones (JWT en cookie httpOnly), contraseñas y auditoría. Solo para uso en servidor.
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { admins, auth_events, coaches, players } from '@/db/schema';

export type Role = 'coach' | 'player' | 'admin';
type SessionPayload = { identifier: string; role: Role; tv: number };

const COOKIE_NAME = 'user_token';
const SESSION_DAYS = 20;
export const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_BYTES = 72; // límite de bcrypt
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está definida');
  return secret;
}

// ---------- Contraseñas ----------

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH)
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) return 'La contraseña es demasiado larga';
  return null;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

// ---------- Usuarios ----------

export type Coach = typeof coaches.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Admin = typeof admins.$inferSelect;
type FoundUser =
  | { role: 'coach'; user: Coach }
  | { role: 'player'; user: Player }
  | { role: 'admin'; user: Admin };

export function tableFor(role: Role) {
  return role === 'coach' ? coaches : role === 'player' ? players : admins;
}

// Busca en coaches, players y admins (coaches primero, como el login original)
export async function findUser(identifier: string): Promise<FoundUser | null> {
  const [coach] = await db.select().from(coaches).where(eq(coaches.identifier, identifier));
  if (coach) return { role: 'coach', user: coach };
  const [player] = await db.select().from(players).where(eq(players.identifier, identifier));
  if (player) return { role: 'player', user: player };
  const [admin] = await db.select().from(admins).where(eq(admins.identifier, identifier));
  if (admin) return { role: 'admin', user: admin };
  return null;
}

export function redirectUrlFor(role: Role, user: Coach | Player | Admin): string {
  if (role === 'player') return '/player/welcome';
  if (role === 'admin') return '/admin';
  const team = (user as Coach).chosen_team;
  return team ? `/coach/dashboard/${team}` : '/coach/choose-team';
}

// ---------- Sesión ----------

export async function setSessionCookie(identifier: string, role: Role, tokenVersion: number) {
  const payload: SessionPayload = { identifier, role, tv: tokenVersion };
  const token = jwt.sign(payload, getSecret(), { expiresIn: `${SESSION_DAYS}d` });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

// Sesión válida = JWT correcto + usuario existe + token_version coincide (un reset la invalida)
export async function readSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }

  const found = await findUser(payload.identifier);
  if (!found || found.role !== payload.role) return null;
  if (found.user.token_version !== payload.tv || !found.user.password_hash) return null;
  return found;
}

const unauthorized = () => NextResponse.json({ error: 'No autorizado' }, { status: 401 });
const forbidden = () => NextResponse.json({ error: 'No autorizado' }, { status: 403 });

export async function getPlayerSession(): Promise<
  { player: Player; response?: never } | { player?: never; response: NextResponse }
> {
  const session = await readSession();
  if (!session) return { response: unauthorized() };
  if (session.role !== 'player') return { response: forbidden() };
  return { player: session.user };
}

export async function getCoachSession(): Promise<
  { coach: Coach; response?: never } | { coach?: never; response: NextResponse }
> {
  const session = await readSession();
  if (!session) return { response: unauthorized() };
  if (session.role !== 'coach') return { response: forbidden() };
  return { coach: session.user };
}

export async function getAdminSession(): Promise<
  { admin: Admin; response?: never } | { admin?: never; response: NextResponse }
> {
  const session = await readSession();
  if (!session) return { response: unauthorized() };
  if (session.role !== 'admin') return { response: forbidden() };
  return { admin: session.user };
}

// Renueva la sesión 20 días más (se llama al enviar un formulario)
export async function renewSession(role: Role, user: Coach | Player | Admin) {
  await setSessionCookie(user.identifier, role, user.token_version);
}

// ---------- Auditoría ----------

export async function logAuthEvent(
  role: Role,
  identifier: string,
  event: 'claim' | 'login_fail' | 'lockout' | 'reset_request' | 'reset' | 'password_change',
  actor?: string,
) {
  try {
    const h = await headers();
    await db.insert(auth_events).values({
      role,
      identifier,
      event,
      ip: h.get('x-forwarded-for')?.split(',')[0].trim() ?? null,
      user_agent: h.get('user-agent'),
      actor: actor ?? null,
    });
  } catch (err) {
    // La auditoría nunca debe romper el login
    console.error('❌ Error registrando auth_event:', err);
  }
}
