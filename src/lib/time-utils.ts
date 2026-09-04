// lib/time-utils.ts
export function getCurrentHourInSpain(): number {
  const now = new Date();
  const spainTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  return spainTime.getHours();
}

export function isWellnessAvailable(): boolean {
  const hour = getCurrentHourInSpain();
  return hour >= 8 && hour <= 12; // de 8:00 a 11:59 (hasta las 12:00 exclusive)
}

export function isLoadAvailable(): boolean {
  const hour = getCurrentHourInSpain();
  return hour >= 20 && hour <= 23; // de 20:00 a 23:59
}
