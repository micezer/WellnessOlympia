'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SessionChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 🔥 IGNORAR completamente la página de instalación
    if (pathname === '/install') {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/verify-auth', {
          credentials: 'include',
        });

        const data = await res.json();

        if (res.ok && data.isAuthenticated) {
          // Usuario autenticado - redirigir a su dashboard
          if (pathname === '/') {
            router.replace(data.redirectUrl);
          }
        } else {
          // Usuario NO autenticado - solo redirigir si está en una ruta protegida
          const protectedRoutes = ['/coach', '/player', '/dashboard', '/admin'];
          const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route));

          if (isProtectedRoute) {
            router.replace('/');
          }
        }
      } catch (error) {
        console.error('Error verificando auth:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isChecking && pathname !== '/' && pathname !== '/install') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[rgb(33,37,41)]">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return null;
}
