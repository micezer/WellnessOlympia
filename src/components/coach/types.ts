// Tipos de /api/coach/dashboard compartidos por los componentes del dashboard
export interface WellnessForm {
  id: number;
  date: string;
  fatigue_level: number;
  tiredness_level: number;
  stress_level: number;
  mood: string;
  sleep_hours: number;
  is_injured: boolean;
  injury_details?: string | null;
  menstrual_phase?: string | null;
  discomfort?: string | null;
}

export interface LoadForm {
  id: number;
  date: string;
  rpe: number;
  muscle_pain: Record<string, number | string>;
}

export interface DashboardPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  nickname: string | null;
  shirtNumber: number | null;
  avatarColor: string | null;
  position: string | null;
  loadScore: number;
  wellnessScore: number;
  mood: string | null;
  lastWellness: WellnessForm | null;
  lastLoad: LoadForm | null;
  wellnessToday: boolean;
  loadToday: boolean;
  isInjured: boolean;
  hasPassword: boolean;
  resetRequested: boolean;
}

export interface DailyAverage {
  date: string;
  avgLoad: number | null;
  avgWellness: number | null;
  avgMood: number | null;
}

export interface DashboardData {
  coachName: string;
  team: string;
  date: string;
  players: DashboardPlayer[];
  dailyAverages: DailyAverage[];
  resetRequests: { id: number; name: string; requestedAt: string }[];
}

// Carga media (7 días) a partir de la cual se marca como alta
export const HIGH_LOAD = 70;

// Colores de series (validados para daltonismo y contraste sobre fondo claro)
export const SERIES = {
  wellness: '#2a78d6',
  load: '#eb6834',
};

// "#10 · Delantera"
export const playerSubtitle = (p: DashboardPlayer) =>
  [p.shirtNumber !== null && `#${p.shirtNumber}`, p.position ?? 'Sin posición'].filter(Boolean).join(' · ');
