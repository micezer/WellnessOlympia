import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { player_wellness, player_load } from '@/db/schema';
import { and, eq, desc, gte } from 'drizzle-orm';
import { getPlayerSession } from '@/lib/auth';
import { addDays, getSpainDateString } from '@/lib/time-utils';
import { computeStreak } from '@/lib/history';
import { unreadForSender } from '@/lib/inquiries';

const STREAK_LOOKBACK_DAYS = 120;

export async function GET() {
  try {
    const { player, response } = await getPlayerSession();
    if (response) return response;

    const today = getSpainDateString();
    const recentWellness = await db
      .select({ date: player_wellness.date })
      .from(player_wellness)
      .where(
        and(
          eq(player_wellness.player_id, player.id),
          gte(player_wellness.date, addDays(today, -STREAK_LOOKBACK_DAYS)),
        ),
      )
      .orderBy(desc(player_wellness.date));

    // Puede que el último wellness sea anterior a la ventana de la racha
    const [lastWellness] = recentWellness.length
      ? recentWellness
      : await db
          .select({ date: player_wellness.date })
          .from(player_wellness)
          .where(eq(player_wellness.player_id, player.id))
          .orderBy(desc(player_wellness.date))
          .limit(1);

    const [lastLoad] = await db
      .select({ date: player_load.date })
      .from(player_load)
      .where(eq(player_load.player_id, player.id))
      .orderBy(desc(player_load.date))
      .limit(1);

    return NextResponse.json({
      player: {
        firstname: player.firstname,
        lastname: player.lastname,
        team: player.team,
        birth_date: player.birth_date,
        nickname: player.nickname,
        avatar_color: player.avatar_color,
      },
      wellness: lastWellness?.date || null,
      load: lastLoad?.date || null,
      unreadInquiries: await unreadForSender('player', player.id),
      streak: computeStreak(new Set(recentWellness.map((w) => w.date)), today),
    });
  } catch (err) {
    console.error('❌ Error en /api/player/forms/status:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
