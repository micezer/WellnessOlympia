// src/app/api/coach/dashboard/route.ts
import { db } from '@/db/db';
import { players, player_load, player_wellness, coaches } from '@/db/schema';
import { eq, and, not, inArray, gte, lte } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

const moodValues: Record<string, number> = {
  bien: 8,
  feliz: 7,
  energica: 6,
  motivada: 5,
  cambios_de_humor: 4,
  triste: 3,
  irritable: 2,
  frustrada: 1,
};

export async function GET(req: Request) {
  try {
    // 1️⃣ Obtener coach desde token
    const cookieStore = cookies();
    const userTokenCookie = (await cookieStore).get('user_token');
    const token = userTokenCookie?.value;
    if (!token) return NextResponse.json({ message: 'Token no encontrado' }, { status: 401 });

    let payload: unknown;
    try {
      payload = jwt.verify(token, SECRET_KEY!);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const coachData = await db
      .select()
      .from(coaches)
      .where(eq(coaches.identifier, (payload as { identifier: string }).identifier));

    if (!coachData.length)
      return NextResponse.json({ message: 'Coach no encontrado' }, { status: 404 });

    const coach = coachData[0];
    if (!coach.chosen_team)
      return NextResponse.json({ message: 'Coach no tiene equipo seleccionado' }, { status: 400 });

    // 2️⃣ Fecha seleccionada y rango para gráficos (últimos 7 días)
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const selectedDate = dateParam ? new Date(dateParam) : new Date();
    const dateString = selectedDate.toISOString().split('T')[0];

    const positionParam = url.searchParams.get('position'); // puede ser 'portera' o 'jugadora'

    const startDate = new Date(selectedDate);
    startDate.setDate(selectedDate.getDate() - 6); // últimos 7 días
    const startDateString = startDate.toISOString().split('T')[0];

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
        .where(and(eq(players.team, coach.chosen_team), not(eq(players.position, 'Portera'))));
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

      const avgRPE = playerLoadForms.length
        ? playerLoadForms.reduce((sum, f) => sum + (Number(f.rpe) || 0), 0) / playerLoadForms.length
        : 0;
      const loadScore = (avgRPE / 10) * 100;

      // ✅ Cálculo robusto de wellnessScore
      const wellnessScore = playerWellnessForms.length
        ? (playerWellnessForms.reduce((sum, f) => {
            const fatigue = Number(f.fatigue_level) || 0;
            const tiredness = Number(f.tiredness_level) || 0;
            const stress = Number(f.stress_level) || 0;
            const mood = moodValues[f.mood] || 0;
            const sleep = Math.min(Number(f.sleep_hours) || 0, 8); // máximo 8h

            // normalizamos a 0–10 (más alto = mejor)
            const normalized = (10 - fatigue + (10 - tiredness) + (10 - stress) + mood + sleep) / 5;

            return sum + normalized;
          }, 0) /
            playerWellnessForms.length) *
          10 // escala a 0–100
        : 0;

      const moodScore = playerWellnessForms.length
        ? playerWellnessForms.reduce((sum, f) => sum + (moodValues[f.mood] || 0), 0) /
          playerWellnessForms.length
        : 0;

      const lastWellness = playerWellnessForms.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })[0]; // 🔹 primer elemento del array ordenado

      const lastLoad = playerLoadForms.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })[0]; // 🔹 primer elemento del array ordenado

      const formsToday =
        playerLoadForms.filter((f) => f.date === dateString).length +
        playerWellnessForms.filter((f) => f.date === dateString).length;

      return {
        id: player.id,
        name: `${player.firstname} ${player.lastname}`,
        position: player.position,
        loadScore: Math.round(loadScore),
        wellnessScore: Math.round(wellnessScore * 10) / 10,
        moodScore: moodScore,
        mood: lastWellness?.mood || null,
        lastWellness,
        lastLoad,
        formsToday,
        isInjured: lastWellness?.is_injured || false,
      };
    });

    // 6️⃣ Calcular promedios diarios para gráficos
    const dailyAveragesMap: Record<
      string,
      { sumLoad: number; sumWellness: number; sumMood: number; count: number }
    > = {};

    for (const d of wellnessForms) {
      if (!dailyAveragesMap[d.date])
        dailyAveragesMap[d.date] = { sumLoad: 0, sumWellness: 0, sumMood: 0, count: 0 };

      // Calcular load
      const pLoadForms = loadForms.filter((f) => f.player_id === d.player_id && f.date === d.date);
      const avgRPE = pLoadForms.length
        ? pLoadForms.reduce((sum, f) => sum + (Number(f.rpe) || 0), 0) / pLoadForms.length
        : 0;
      const loadScore = (avgRPE / 10) * 100;

      // 🔹 Calcular wellness usando el mismo método robusto que en playersData
      const fatigue = Number(d.fatigue_level) || 0;
      const tiredness = Number(d.tiredness_level) || 0;
      const stress = Number(d.stress_level) || 0;
      const mood = moodValues[d.mood] || 5; // fallback neutro
      const sleep = Math.min(Number(d.sleep_hours) || 0, 8);

      const normalizedWellness =
        (10 - fatigue + (10 - tiredness) + (10 - stress) + mood + sleep) / 5;
      const wellnessScore = normalizedWellness; // escala 0–100

      // Calcular mood
      const moodScore = moodValues[d.mood] || 0;

      dailyAveragesMap[d.date].sumLoad += loadScore;
      dailyAveragesMap[d.date].sumWellness += wellnessScore;
      dailyAveragesMap[d.date].sumMood += moodScore;
      dailyAveragesMap[d.date].count += 1;
    }

    const dailyAverages = Object.entries(dailyAveragesMap)
      .map(([date, vals]) => ({
        date,
        avgLoad: Math.round(vals.sumLoad / vals.count),
        avgWellness: Math.round((vals.sumWellness / vals.count) * 10), // antes estaba a 0–10, ahora 0–100
        avgMood: Math.round((vals.sumMood / vals.count) * 10) / 10,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formsCount =
      loadForms.filter((f) => f.date === dateString).length +
      wellnessForms.filter((f) => f.date === dateString).length;

    // 7️⃣ Respuesta
    return NextResponse.json({
      coachName: coach.firstname,
      team: coach.chosen_team,
      date: dateString,
      formsCount,
      players: playersData,
      dailyAverages,
    });
  } catch (err) {
    console.error('Error dashboard API:', err);
    return NextResponse.json({ message: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
