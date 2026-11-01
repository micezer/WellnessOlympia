'use client';
import { useEffect } from 'react';

// La app se maneja solo con sus botones: cada navegación sustituye la entrada del historial en
// vez de añadir una, así deslizar desde el borde (iPhone) o "atrás" no lleva a ninguna pantalla.
// Next.js navega con history.pushState, así que basta con convertirlo en replaceState.
export default function NoHistoryNavigation() {
  useEffect(() => {
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args: Parameters<History['pushState']>) {
      return window.history.replaceState(...args);
    };
    return () => {
      window.history.pushState = originalPushState;
    };
  }, []);

  return null;
}
