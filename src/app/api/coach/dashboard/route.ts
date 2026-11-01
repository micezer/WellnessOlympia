// src/app/api/coach/dashboard/route.ts
import { db } from '@/db/db';
import { players, player_load, player_wellness } from '@/db/schema';
import { eq, and, or, ne, isNull, isNotNull, inArray, gte, lte, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getSpainDateString, addDays } from '@/lib/time-utils';
import { average, computeLoadScore, computeWellnessScore, moodScore } from '@/lib/metrics';
import { getCoachSession } from '@/lib/auth';

// Más reciente primero: por fecha del formulario y, en el mismo día, por hora de envío
const byNewest = (
  a: { date: string; created_at: Date | null },
  b: { date: string; created_at: Date | null },
) =>
  b.date.localeCompare(a.date) ||
  (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0);

export async function GET(req: Request) {
  try {
    // 1️⃣ Coach desde la sesión
    const { coach, response } = await getCoachSession();
    if (response) return response;
    if (!coach.chosen_team)
      return NextResponse.json({ message: 'Coach no tiene equipo seleccionado' }, { status: 400 });

    // 2️⃣ Fecha seleccionada y rango para gráficos (últimos 7 días)
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const dateString =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getSpainDateString();

    const positionParam = url.searchParams.get('position'); // puede ser 'portera' o 'jugadora'

    const startDateString = addDays(dateString, -6); // últimos 7 días

    // 3️⃣ Obtener jugadoras
    // 3️⃣ Obtener jugadoras según posición
    let teamPlayers;
    if (positionParam === 'portera') {
      teamPlayers = await db
        .select()
        .from(players)
        .where(and(eq(players.team, coach.chosen_team), eq(players.position, 'Portera')));
    } else {
      teamPlayers = await db
        .select()
        .from(players)
        .where(
          and(
            eq(players.team, coach.chosen_team),
            // NULL también es jugadora de campo (NOT (NULL = x) es NULL en SQL)
            or(isNull(players.position), ne(players.position, 'Portera')),
          ),
        );
    }

    const playerIds = teamPlayers.map((p) => p.id);

    // 4️⃣ Formularios wellness y load dentro del rango
    const wellnessForms = await db
      .select()
      .from(player_wellness)
      .where(
        and(
          inArray(player_wellness.player_id, playerIds),
          gte(player_wellness.date, startDateString),
          lte(player_wellness.date, dateString),
        ),
      );

    const loadForms = await db
      .select()
      .from(player_load)
      .where(
        and(
          inArray(player_load.player_id, playerIds),
          gte(player_load.date, startDateString),
          lte(player_load.date, dateString),
        ),
      );

    // 5️⃣ Agrupar por jugador y calcular métricas
    const playersData = teamPlayers.map((player) => {
      const playerLoadForms = loadForms.filter((f) => f.player_id === player.id);
      const playerWellnessForms = wellnessForms.filter((f) => f.player_id === player.id);

      const loadScore = average(playerLoadForms.map((f) => computeLoadScore(f.rpe)));
      const wellnessScore = average(playerWellnessForms.map(computeWellnessScore));
      const avgMood = average(playerWellnessForms.map((f) => moodScore(f.mood)));

      const lastWellness = [...playerWellnessForms].sort(byNewest)[0];
      const lastLoad = [...playerLoadForms].sort(byNewest)[0];

      const wellnessToday = playerWellnessForms.some((f) => f.date === dateString);
      const loadToday = playerLoadForms.some((f) => f.date === dateString);

      return {
        id: player.id,
        name: `${player.firstname} ${player.lastname}`,
        firstname: player.firstname,
        lastname: player.lastname,
        nickname: player.nickname,
        shirtNumber: player.shirt_number,
        avatarColor: player.avatar_color,
        position: player.position,
        loadScore: Math.round(loadScore),
        wellnessScore: Math.round(wellnessScore * 10) / 10,
        moodScore: avgMood,
        mood: lastWellness?.mood || null,
        lastWellness,
        lastLoad,
        wellnessToday,
        loadToday,
        formsToday: Number(wellnessToday) + Number(loadToday),
        isInjured: lastWellness?.is_injured || false,
        hasPassword: !!player.password_hash,
        resetRequested: !!player.reset_requested_at,
      };
    });

    // 6️⃣ Promedios diarios para gráficos: carga y wellness se calculan por separado,
    // cada uno con los formularios de ese día
    const byDate = new Map<string, { load: number[]; wellness: number[]; mood: number[] }>();
    const day = (date: string) => {
      if (!byDate.has(date)) byDate.set(date, { load: [], wellness: [], mood: [] });
      return byDate.get(date)!;
    };
    for (const f of loadForms) day(f.date).load.push(computeLoadScore(f.rpe));
    for (const f of wellnessForms) {
      day(f.date).wellness.push(computeWellnessScore(f));
      day(f.date).mood.push(moodScore(f.mood));
    }

    const dailyAverages = [...byDate.entries()]
      .map(([date, v]) => ({
        date,
        avgLoad: v.load.length ? Math.round(average(v.load)) : null,
        avgWellness: v.wellness.length ? Math.round(average(v.wellness)) : null,
        avgMood: v.mood.length ? Math.round(average(v.mood) * 10) / 10 : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const formsCount =
      loadForms.filter((f) => f.date === dateString).length +
      wellnessForms.filter((f) => f.date === dateString).length;

    // Solicitudes de restablecer contraseña de todo el equipo (porteras incluidas)
    const resetRequests = await db
      .select({
        id: players.id,
        firstname: players.firstname,
        lastname: players.lastname,
        requestedAt: players.reset_requested_at,
      })
      .from(players)
      .where(and(eq(players.team, coach.chosen_team), isNotNull(players.reset_requested_at)))
      .orderBy(asc(players.reset_requested_at));

    // 7️⃣ Respuesta
    return NextResponse.json({
      coachName: coach.firstname,
      team: coach.chosen_team,
      date: dateString,
      formsCount,
      players: playersData,
      dailyAverages,
      resetRequests: resetRequests.map((r) => ({
        id: r.id,
        name: `${r.firstname} ${r.lastname}`,
        requestedAt: r.requestedAt,
      })),
    });
  } catch (err) {
    console.error('Error dashboard API:', err);
    return NextResponse.json({ message: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
