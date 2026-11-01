// lib/news.ts
// "Novedades": se muestran una vez por cuenta. Para anunciar algo nuevo, añade una entrada con
// version + 1 (quien ya vio las anteriores solo verá la nueva).

export type NewsRole = 'player' | 'coach';
export type NewsItem = { emoji: string; title: string; text: string };

export const NEWS: { version: number; items: Record<NewsRole, NewsItem[]> }[] = [
  {
    version: 1,
    items: {
      player: [
        {
          emoji: '🔐',
          title: 'Tu propia contraseña',
          text: 'Ahora entras con tu identificador y tu contraseña. Nadie más puede ver tus datos.',
        },
        {
          emoji: '🔔',
          title: 'Recordatorios',
          text: 'Activa las notificaciones y te avisamos si aún no has rellenado el wellness o el RPE.',
        },
        {
          emoji: '👤',
          title: 'Tu perfil',
          text: 'Elige apodo, dorsal y color, y mira tu racha y tu evolución de los últimos 14 días.',
        },
        {
          emoji: '⚡',
          title: 'Formularios más rápidos',
          text: 'Respuestas con un toque y un botón de enviar siempre a mano.',
        },
        {
          emoji: '💬',
          title: 'Consultas',
          text: 'Escribe al club desde tu perfil, incluso de forma anónima, y recibe la respuesta en la app.',
        },
      ],
      coach: [
        {
          emoji: '📊',
          title: 'Panel renovado',
          text: 'Resumen del día, gráficos más claros y funciona bien en el móvil.',
        },
        {
          emoji: '🔎',
          title: 'Detalle de cada jugadora',
          text: 'Toca una jugadora para ver sus últimos 14 días de wellness, sueño y RPE.',
        },
        {
          emoji: '🔔',
          title: 'Avisos',
          text: 'Activa los avisos en el menú: te llegará una notificación si una jugadora indica una lesión o pide restablecer su contraseña.',
        },
        {
          emoji: '🔑',
          title: 'Contraseñas',
          text: 'Restablece la contraseña de una jugadora desde su ficha y cambia la tuya desde el menú.',
        },
        {
          emoji: '💬',
          title: 'Consultas',
          text: 'Escribe al administrador desde el menú y recibe la respuesta en la app.',
        },
      ],
    },
  },
];

export const LATEST_NEWS_VERSION = Math.max(...NEWS.map((n) => n.version));

// Novedades que aún no ha visto (las más recientes primero)
export function pendingNews(role: NewsRole, seen: number): NewsItem[] {
  return NEWS.filter((n) => n.version > seen)
    .sort((a, b) => b.version - a.version)
    .flatMap((n) => n.items[role]);
}
