'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Interface para navigator con standalone
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function PWARedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPWA, setIsPWA] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPWA = () => {
      if (typeof window === 'undefined') return false;

      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone).standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    setIsPWA(checkPWA());
  }, []);

  useEffect(() => {
    if (isPWA === null) return;

    const allowedPaths = ['/install', '/api', '/_next', '/manifest.json', '/sw.js'];
    const isAllowedPath = allowedPaths.some((path) => pathname?.startsWith(path));

    // 🔥 OBLIGATORIO: Si NO es PWA y NO está en página de instalación -> REDIRIGIR
    if (!isPWA && !isAllowedPath) {
      router.replace('/install');
    }

    // Si ES PWA y está en página de instalación -> redirigir a home
    else if (isPWA && pathname === '/install') {
      router.replace('/');
    }
  }, [isPWA, pathname, router]);

  return null;
}
