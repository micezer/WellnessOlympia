import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { players } from '@/db/schema';
import { getPlayerSession } from '@/lib/auth';
import { validateProfile } from '@/lib/forms';
import { getSpainDateString } from '@/lib/time-utils';

// Editar el perfil propio (apodo, dorsal, color del avatar, fecha de nacimiento). PATCH parcial.
export async function PATCH(req: Request) {
  try {
    const { player, response } = await getPlayerSession();
    if (response) return response;

    const parsed = validateProfile(await req.json(), getSpainDateString());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (!Object.keys(parsed.value).length)
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    const [updated] = await db
      .update(players)
      .set(parsed.value)
      .where(eq(players.id, player.id))
      .returning({
        nickname: players.nickname,
        shirt_number: players.shirt_number,
        avatar_color: players.avatar_color,
        birth_date: players.birth_date,
      });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('❌ Error actualizando perfil:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
