'use client';
import { useEffect } from 'react';

// next-pwa 5.6 solo inyecta el registro en main.js (Pages Router); con App Router nunca se
// ejecuta, así que el service worker (caché offline y notificaciones push) se registra aquí.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => console.error('Error registrando el service worker:', err));
  }, []);

  return null;
}
