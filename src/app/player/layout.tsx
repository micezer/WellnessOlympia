'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Lista de rutas donde NO quieres mostrar el TabBar
  const hideTabBarRoutes = ['/player/forms/wellness', '/player/forms/load'];

  const showTabBar = !hideTabBarRoutes.includes(pathname);

  return <div className="min-h-screen flex flex-col pb-40 relative">{children}</div>;
}
