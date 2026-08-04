import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { player_load, players } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { isLoadAvailable } from '@/lib/time-utils';


const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

// 🟢 GUARDAR FORMULARIO RPE (POST)
export async function POST(req: Request) {
 try {
   // Validar horario
   if (!isLoadAvailable()) {
     return NextResponse.json(
       { error: 'El formulario de RPE solo está disponible de 19:00 a 23:59' },
       { status: 403 },
     );
   }
   console.log('🔵 [LOAD POST] Iniciando request...');

   const cookieStore = cookies();
   const token = (await cookieStore).get('user_token')?.value;
   console.log('🔵 [LOAD POST] Token encontrado:', !!token);

   if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

   const payload = jwt.verify(token, SECRET_KEY) as { identifier: string };
   console.log('🔵 [LOAD POST] Payload:', payload);

   const player = await db
     .select()
     .from(players)
     .where(eq(players.identifier, payload.identifier))
     .limit(1);

   if (!player.length)
     return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });

   const playerId = player[0].id;
   const playerName = `${player[0].firstname} ${player[0].lastname}`;
   console.log('🔵 [LOAD POST] Jugador:', playerName, 'ID:', playerId);

   const data = await req.json();
   console.log('🔵 [LOAD POST] Datos recibidos:', data);

   // DEBUG: Mostrar diferentes formatos de fecha
   const getTodaySpain = () => {
     const now = new Date();
     const spainTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
     return spainTime.toISOString().split('T')[0];
   };

   const today = getTodaySpain();

   console.log('🔵 [LOAD POST] Usando fecha:', today);

   // Evitar duplicados del mismo día
   const existing = await db
     .select()
     .from(player_load)
     .where(and(eq(player_load.player_id, playerId), eq(player_load.date, today)));

   console.log('🔵 [LOAD POST] Registros existentes hoy:', existing.length);
   if (existing.length) return NextResponse.json({ error: 'Ya completado hoy' }, { status: 400 });

   // 🧩 Guardar nuevo registro de carga
   console.log('🔵 [LOAD POST] Guardando en BD...');
   await db.insert(player_load).values({
     player_id: playerId,
     player_name: playerName,
     rpe: data.rpe,
     muscle_pain: data.musclePain,
     date: today,
   });

   // 🧩 Actualizar columna last_rpe_date en players
   await db.update(players).set({ last_rpe_date: new Date() }).where(eq(players.id, playerId));

   (await cookieStore).set('user_token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     path: '/',
     maxAge: 20 * 24 * 60 * 60, // extend 20 days
   });

   console.log('🟢 [LOAD POST] Formulario guardado exitosamente');
   return NextResponse.json({ success: true });
 } catch (err) {
   console.error('❌ [LOAD POST] Error:', err);
   return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
 }
}

// 🟣 OBTENER ÚLTIMO FORMULARIO (GET)
export async function GET() {
  try {
    console.log('🔵 [LOAD GET] Iniciando request...');

    const cookieStore = cookies();
    const token = (await cookieStore).get('user_token')?.value;
    console.log('🔵 [LOAD GET] Token encontrado:', !!token);

    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const payload = jwt.verify(token, SECRET_KEY) as { identifier: string };
    console.log('🔵 [LOAD GET] Payload:', payload);

    const player = await db
      .select()
      .from(players)
      .where(eq(players.identifier, payload.identifier))
      .limit(1);

    if (!player.length)
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });

    const playerId = player[0].id;
    console.log('🔵 [LOAD GET] Jugador ID:', playerId);

    const lastForm = await db
      .select({ date: player_load.date })
      .from(player_load)
      .where(eq(player_load.player_id, playerId))
      .orderBy(desc(player_load.date))
      .limit(1);

    console.log('🔵 [LOAD GET] Último formulario encontrado:', lastForm[0]?.date || 'Ninguno');

    return NextResponse.json({ load: lastForm[0]?.date || null });
  } catch (err) {
    console.error('❌ [LOAD GET] Error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
