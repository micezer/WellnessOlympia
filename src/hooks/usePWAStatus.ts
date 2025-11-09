'use client';
import { useState, useEffect } from 'react';

// Interface para navigator con standalone
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function usePWAStatus() {
  const [isPWA, setIsPWA] = useState<boolean | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si está en modo standalone (PWA instalada)
    const isInStandaloneMode = () => {
      if (typeof window !== 'undefined') {
        return (
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as NavigatorWithStandalone).standalone === true ||
          document.referrer.includes('android-app://')
        );
      }
      return false;
    };

    // Detectar si el navegador soporta instalación de PWA
    const canInstall = () => {
      if (typeof window !== 'undefined') {
        return 'BeforeInstallPromptEvent' in window;
      }
      return false;
    };

    setIsPWA(isInStandaloneMode());
    setIsInstalled(canInstall());
  }, []);

  return { isPWA, isInstalled };
}
