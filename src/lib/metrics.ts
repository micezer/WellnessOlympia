// lib/metrics.ts
// Cálculo de métricas del dashboard (una sola definición para tabla y gráficos).

export const MOOD_VALUES: Record<string, number> = {
  bien: 8,
  feliz: 7,
  energica: 6,
  motivada: 5,
  cambios_de_humor: 4,
  triste: 3,
  irritable: 2,
  frustrada: 1,
};
const MAX_MOOD = 8;
const MAX_SLEEP = 8; // 8h o más = puntuación máxima de sueño

type WellnessFields = {
  fatigue_level: number;
  tiredness_level: number;
  stress_level: number;
  mood: string;
  sleep_hours: number;
};

export function moodScore(mood: string): number {
  return MOOD_VALUES[mood] ?? 0;
}

// Wellness 0–100 (más alto = mejor). Cada componente se normaliza a 0–10 y se promedia.
export function computeWellnessScore(form: WellnessFields): number {
  // fatiga/cansancio/estrés van de 1 (mejor) a 10 (peor)
  const inverted = (v: number) => ((10 - Math.min(Math.max(Number(v) || 1, 1), 10)) / 9) * 10;
  const mood = (moodScore(form.mood) / MAX_MOOD) * 10;
  const sleep = (Math.min(Math.max(Number(form.sleep_hours) || 0, 0), MAX_SLEEP) / MAX_SLEEP) * 10;

  const components = [
    inverted(form.fatigue_level),
    inverted(form.tiredness_level),
    inverted(form.stress_level),
    mood,
    sleep,
  ];
  return (components.reduce((a, b) => a + b, 0) / components.length) * 10;
}

// Carga 0–100 a partir del RPE (1–10)
export function computeLoadScore(rpe: number): number {
  return ((Number(rpe) || 0) / 10) * 100;
}

export const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
