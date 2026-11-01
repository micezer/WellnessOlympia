// lib/forms.ts
// Definición y validación (servidor) de los formularios de jugadoras.

export const TEAMS = ['Senior A', 'Senior B', 'Senior C'] as const;

export const MOODS = [
  'bien',
  'feliz',
  'energica',
  'motivada',
  'cambios_de_humor',
  'triste',
  'irritable',
  'frustrada',
] as const;

export const MENSTRUAL_PHASES = [
  'folicular',
  'ovulatoria',
  'lutea',
  'menstrual',
  'no_aplica',
] as const;

export const MUSCLES = [
  'abductores',
  'cuadriceps',
  'gemelos',
  'isquiotibiales',
  'lumbar',
  'dorsal',
  'cervical',
  'rodilla',
  'tobillo',
  'hombro',
] as const;

// Textos para mostrar (los valores guardados siguen siendo las claves de arriba)
export const MOOD_LABELS: Record<(typeof MOODS)[number], string> = {
  bien: '🙂 Bien',
  feliz: '😄 Feliz',
  energica: '⚡ Enérgica',
  motivada: '💪 Motivada',
  cambios_de_humor: '🔄 Cambios de humor',
  triste: '😢 Triste',
  irritable: '😠 Irritable',
  frustrada: '😣 Frustrada',
};

export const MENSTRUAL_PHASE_LABELS: Record<(typeof MENSTRUAL_PHASES)[number], string> = {
  folicular: 'Folicular',
  ovulatoria: 'Ovulatoria',
  lutea: 'Lútea',
  menstrual: 'Menstrual',
  no_aplica: 'No aplica',
};

export const MUSCLE_LABELS: Record<(typeof MUSCLES)[number], string> = {
  abductores: 'Abductores',
  cuadriceps: 'Cuádriceps',
  gemelos: 'Gemelos',
  isquiotibiales: 'Isquiotibiales',
  lumbar: 'Lumbar',
  dorsal: 'Dorsal',
  cervical: 'Cervical',
  rodilla: 'Rodilla',
  tobillo: 'Tobillo',
  hombro: 'Hombro',
};

// Moods que el dashboard marca como señal de alerta
export const NEGATIVE_MOODS: readonly string[] = ['cambios_de_humor', 'triste', 'irritable', 'frustrada'];

export const moodLabel = (mood: string | null | undefined) =>
  mood ? (MOOD_LABELS[mood as keyof typeof MOOD_LABELS] ?? mood) : '—';

// Colores de avatar que puede elegir la jugadora
export const AVATAR_COLORS = [
  '#22c55e',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#14b8a6',
] as const;

const MAX_TEXT = 500;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isIntInRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

// Texto opcional: '' / null / undefined → null
function optionalText(v: unknown): string | null | undefined {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string' || v.length > MAX_TEXT) return undefined; // inválido
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

export type WellnessInput = {
  fatigue_level: number;
  tiredness_level: number;
  stress_level: number;
  mood: string;
  sleep_hours: number;
  is_injured: boolean;
  injury_details: string | null;
  menstrual_phase: string;
  discomfort: string | null;
};

export function validateWellness(data: unknown): Result<WellnessInput> {
  if (!isObject(data)) return { ok: false, error: 'Datos inválidos' };

  const levels = { fatigue_level: 'fatiga', tiredness_level: 'cansancio', stress_level: 'estrés' };
  for (const [field, label] of Object.entries(levels)) {
    if (!isIntInRange(data[field], 1, 10))
      return { ok: false, error: `El nivel de ${label} debe ser un número entero entre 1 y 10` };
  }
  if (!isIntInRange(data.sleep_hours, 0, 24))
    return { ok: false, error: 'Las horas de sueño deben ser un número entero entre 0 y 24' };
  if (typeof data.mood !== 'string' || !(MOODS as readonly string[]).includes(data.mood))
    return { ok: false, error: 'Estado de ánimo inválido' };
  if (
    typeof data.menstrual_phase !== 'string' ||
    !(MENSTRUAL_PHASES as readonly string[]).includes(data.menstrual_phase)
  )
    return { ok: false, error: 'Fase del ciclo menstrual inválida' };
  if (typeof data.is_injured !== 'boolean') return { ok: false, error: 'Campo lesión inválido' };

  const injury_details = optionalText(data.injury_details);
  const discomfort = optionalText(data.discomfort);
  if (injury_details === undefined || discomfort === undefined)
    return { ok: false, error: `Los textos no pueden superar ${MAX_TEXT} caracteres` };

  return {
    ok: true,
    value: {
      fatigue_level: data.fatigue_level as number,
      tiredness_level: data.tiredness_level as number,
      stress_level: data.stress_level as number,
      mood: data.mood,
      sleep_hours: data.sleep_hours as number,
      is_injured: data.is_injured,
      injury_details: data.is_injured ? injury_details : null,
      menstrual_phase: data.menstrual_phase,
      discomfort,
    },
  };
}

export type MusclePain = Record<(typeof MUSCLES)[number], number> & { otras: string };

export type LoadInput = { rpe: number; musclePain: MusclePain };

export function validateLoad(data: unknown): Result<LoadInput> {
  if (!isObject(data)) return { ok: false, error: 'Datos inválidos' };
  if (!isIntInRange(data.rpe, 1, 10))
    return { ok: false, error: 'El RPE debe ser un número entero entre 1 y 10' };
  if (!isObject(data.musclePain)) return { ok: false, error: 'Molestias musculares inválidas' };

  const pain = data.musclePain;
  const musclePain = {} as MusclePain;
  for (const muscle of MUSCLES) {
    if (!isIntInRange(pain[muscle], 1, 10))
      return { ok: false, error: `La molestia en ${muscle} debe estar entre 1 y 10` };
    musclePain[muscle] = pain[muscle] as number;
  }
  const otras = optionalText(pain.otras);
  if (otras === undefined)
    return { ok: false, error: `Los textos no pueden superar ${MAX_TEXT} caracteres` };
  musclePain.otras = otras ?? '';

  return { ok: true, value: { rpe: data.rpe as number, musclePain } };
}

// ---------- Perfil de la jugadora ----------

export const NICKNAME_MAX = 30;

export type ProfileInput = Partial<{
  nickname: string | null;
  shirt_number: number | null;
  avatar_color: string | null;
  birth_date: string;
}>;

// Solo se validan y devuelven los campos presentes (PATCH parcial)
export function validateProfile(data: unknown, today: string): Result<ProfileInput> {
  if (!isObject(data)) return { ok: false, error: 'Datos inválidos' };
  const value: ProfileInput = {};

  if ('nickname' in data) {
    if (data.nickname !== null && typeof data.nickname !== 'string')
      return { ok: false, error: 'Apodo inválido' };
    const nickname = (data.nickname ?? '').trim().replace(/\s+/g, ' ');
    if (nickname.length > NICKNAME_MAX)
      return { ok: false, error: `El apodo no puede superar ${NICKNAME_MAX} caracteres` };
    value.nickname = nickname || null;
  }

  if ('shirt_number' in data) {
    if (data.shirt_number !== null && !isIntInRange(data.shirt_number, 1, 99))
      return { ok: false, error: 'El dorsal debe ser un número entre 1 y 99' };
    value.shirt_number = data.shirt_number as number | null;
  }

  if ('avatar_color' in data) {
    if (
      data.avatar_color !== null &&
      !(AVATAR_COLORS as readonly unknown[]).includes(data.avatar_color)
    )
      return { ok: false, error: 'Color inválido' };
    value.avatar_color = data.avatar_color as string | null;
  }

  if ('birth_date' in data) {
    const birth = data.birth_date;
    if (
      typeof birth !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(birth) ||
      Number.isNaN(Date.parse(`${birth}T00:00:00Z`)) ||
      birth > today ||
      birth < '1940-01-01'
    )
      return { ok: false, error: 'Fecha de nacimiento inválida' };
    value.birth_date = birth;
  }

  return { ok: true, value };
}

// ---------- Consultas ----------

export const INQUIRY_SUBJECT_MAX = 100;
export const INQUIRY_MESSAGE_MAX = 1000;

const cleanText = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function validateInquiryMessage(data: unknown): Result<string> {
  const body = cleanText(isObject(data) ? data.body : undefined);
  if (!body) return { ok: false, error: 'Escribe un mensaje' };
  if (body.length > INQUIRY_MESSAGE_MAX)
    return { ok: false, error: `El mensaje no puede superar ${INQUIRY_MESSAGE_MAX} caracteres` };
  return { ok: true, value: body };
}

export function validateInquiry(
  data: unknown,
): Result<{ subject: string; body: string; anonymous: boolean }> {
  if (!isObject(data)) return { ok: false, error: 'Datos inválidos' };
  const subject = cleanText(data.subject).replace(/\s+/g, ' ');
  if (subject.length < 3) return { ok: false, error: 'Escribe un asunto (mínimo 3 caracteres)' };
  if (subject.length > INQUIRY_SUBJECT_MAX)
    return { ok: false, error: `El asunto no puede superar ${INQUIRY_SUBJECT_MAX} caracteres` };
  const message = validateInquiryMessage(data);
  if (!message.ok) return message;
  if (data.anonymous !== undefined && typeof data.anonymous !== 'boolean')
    return { ok: false, error: 'Datos inválidos' };
  return { ok: true, value: { subject, body: message.value, anonymous: data.anonymous === true } };
}
