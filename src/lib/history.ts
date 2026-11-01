// lib/history.ts
// Historial diario de una jugadora (dashboard del coach y perfil propio). Solo servidor.
import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db/db';
import { player_load, player_wellness } from '@/db/schema';
import { addDays } from '@/lib/time-utils';
import { computeLoadScore, computeWellnessScore } from '@/lib/metrics';

export type HistoryDay = {
  date: string;
  wellnessScore: number | null;
  sleep: number | null;
  mood: string | null;
  injured: boolean | null;
  rpe: number | null;
  loadScore: number | null;
};

// Un punto por día de [end - days + 1, end]; null si ese día no rellenó el formulario
export async function getPlayerHistory(playerId: number, end: string, days: number) {
  const start = addDays(end, -(days - 1));
  const [wellness, load] = await Promise.all([
    db
      .select()
      .from(player_wellness)
      .where(
        and(
          eq(player_wellness.player_id, playerId),
          gte(player_wellness.date, start),
          lte(player_wellness.date, end),
        ),
      ),
    db
      .select()
      .from(player_load)
      .where(
        and(eq(player_load.player_id, playerId), gte(player_load.date, start), lte(player_load.date, end)),
      ),
  ]);

  const wellnessByDate = new Map(wellness.map((w) => [w.date, w]));
  const loadByDate = new Map(load.map((l) => [l.date, l]));

  const history: HistoryDay[] = Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    const w = wellnessByDate.get(date);
    const l = loadByDate.get(date);
    return {
      date,
      wellnessScore: w ? Math.round(computeWellnessScore(w)) : null,
      sleep: w?.sleep_hours ?? null,
      mood: w?.mood ?? null,
      injured: w?.is_injured ?? null,
      rpe: l?.rpe ?? null,
      loadScore: l ? Math.round(computeLoadScore(l.rpe)) : null,
    };
  });
  return { start, end, history };
}

// Días seguidos con wellness hasta hoy; si hoy aún no está hecho, la racha cuenta hasta ayer
export function computeStreak(dates: Set<string>, today: string): number {
  let day = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (dates.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
