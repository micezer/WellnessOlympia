import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/db/db';
import { players, player_wellness, player_load } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('user_token')?.value;

  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { identifier: string; role: string };
    if (decoded.role !== 'player')
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    console.log('🔵 [STATUS] Buscando jugador con identifier:', decoded.identifier);

    const playerData = await db
      .select({
        id: players.id,
        firstname: players.firstname,
        lastname: players.lastname,
        team: players.team,
        birth_date: players.birth_date,
      })
      .from(players)
      .where(eq(players.identifier, decoded.identifier));

    if (!playerData.length)
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });

    const player = playerData[0];
    const playerId = playerData[0].id;

    console.log(
      '🔵 [STATUS] Jugador encontrado:',
      player.firstname,
      player.lastname,
      'ID:',
      playerId,
    );

    // Obtener la última fecha de wellness desde player_wellness
    const lastWellness = await db
      .select({ date: player_wellness.date })
      .from(player_wellness)
      .where(eq(player_wellness.player_id, playerId))
      .orderBy(desc(player_wellness.date))
      .limit(1);

    console.log('🔵 [STATUS] Resultado wellness query:', lastWellness);

    // Obtener la última fecha de load desde player_load
    const lastLoad = await db
      .select({ date: player_load.date })
      .from(player_load)
      .where(eq(player_load.player_id, playerId))
      .orderBy(desc(player_load.date))
      .limit(1);

    console.log('🔵 [STATUS] Resultado load query:', lastLoad);

    const response = {
      player: {
        firstname: player.firstname,
        lastname: player.lastname,
        team: player.team,
        birth_date: player.birth_date,
      },
      wellness: lastWellness[0]?.date || null,
      load: lastLoad[0]?.date || null,
    };

    console.log('🔵 [STATUS] Response final:', response);

    return NextResponse.json(response);
  } catch (err) {
    console.error('❌ Error verificando token o fetch player:', err);
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
}
