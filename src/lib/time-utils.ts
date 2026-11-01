// lib/time-utils.ts
// Única fuente de verdad para fechas/horas de España (Europe/Madrid, con horario de verano).
const TIME_ZONE = 'Europe/Madrid';

// Ventanas horarias de los formularios: [start, end) en horas de España
export const WELLNESS_WINDOW = { start: 8, end: 12 };
export const LOAD_WINDOW = { start: 20, end: 24 };

export function formatWindow(window: { start: number; end: number }): string {
  return `${window.start}:00 a ${window.end - 1}:59`;
}

// Fecha de hoy en España como 'YYYY-MM-DD' (independiente de la zona del servidor/dispositivo)
export function getSpainDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// 'YYYY-MM-DD' → 'sábado, 31 oct' (la fecha ya es de España: se formatea en UTC para no desplazarla)
export function formatDateLong(dateString: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${dateString}T00:00:00Z`));
}

// 'YYYY-MM-DD' → 'hoy' / 'ayer' / '29 oct'
export function formatDateRelative(dateString: string | null): string {
  if (!dateString) return 'nunca';
  const today = getSpainDateString();
  if (dateString === today) return 'hoy';
  if (dateString === addDays(today, -1)) return 'ayer';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateString}T00:00:00Z`),
  );
}

export function getCurrentHourInSpain(): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(new Date()),
  );
}

// Suma días a una fecha 'YYYY-MM-DD' sin depender de la zona horaria
export function addDays(dateString: string, days: number): string {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

// Solo para pruebas locales: NEXT_PUBLIC_FORMS_ALWAYS_OPEN=1 (en .env.local, que Vercel no usa) abre los
// formularios a cualquier hora. Se lee al compilar: hay que hacer build de nuevo al quitarla.
const formsAlwaysOpen = process.env.NEXT_PUBLIC_FORMS_ALWAYS_OPEN === '1';

function isInWindow(window: { start: number; end: number }): boolean {
  if (formsAlwaysOpen) return true;
  const hour = getCurrentHourInSpain();
  return hour >= window.start && hour < window.end;
}

export function isWellnessAvailable(): boolean {
  return isInWindow(WELLNESS_WINDOW);
}

export function isLoadAvailable(): boolean {
  return isInWindow(LOAD_WINDOW);
}
