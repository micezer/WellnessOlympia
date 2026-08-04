// lib/time-utils.ts
export function getCurrentHourInSpain(): number {
  const now = new Date();
  const spainTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  return spainTime.getHours();
}

export function isWellnessAvailable(): boolean {
  const hour = getCurrentHourInSpain();
  return hour >= 9 && hour < 12; // de 9:00 a 11:59 (hasta las 12:00 exclusive)
}

export function isLoadAvailable(): boolean {
  const hour = getCurrentHourInSpain();
  return hour >= 19 && hour <= 23; // de 19:00 a 23:59
}
