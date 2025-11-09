'use client';

import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, Users, RefreshCcw, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type SidebarItem = {
  name: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  className?: string;
};

export function AppSideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoach() {
      try {
        const res = await fetch('/api/coach/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setCoach(data);
      } catch (err) {
        console.error('Error fetching coach:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCoach();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const goToDashboard = async () => {
    try {
      let currentTeam = coach?.chosen_team;

      // Si aún no está en memoria, lo pedimos
      if (!currentTeam) {
        const res = await fetch('/api/coach/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          currentTeam = data.chosen_team;
          setCoach(data);
        }
      }

      // Solo mostramos error si realmente no hay equipo después del fetch
      if (!currentTeam) {
        return;
      }

      // Si sí hay equipo, redirigimos
      router.push(`/coach/dashboard/${encodeURIComponent(currentTeam)}`);
    } catch (err) {
      console.error('Error al redirigir al dashboard:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' }); // endpoint que borra la cookie
    window.location.href = '/login';
  };

  const sideBarItems: SidebarItem[] = [
    { name: 'Panel de Control', action: goToDashboard, icon: <Home className="w-5 h-5" /> },
    {
      name: 'Cambiar de equipo',
      href: '/coach/choose-team',
      icon: <RefreshCcw className="w-5 h-5" />,
      className: 'text-[rgb(34,197,94)] font-semibold',
    },
    {
      name: 'Cerrar sesión',
      action: handleLogout,
      icon: <LogOut className="w-5 h-5" />, // 🔹 icono de logout
      className: 'text-red-600 font-semibold',
    },
  ];

  return (
    <Sidebar side="left" className="w-64 bg-gray-100 text-black">
      <SidebarHeader className="p-4 border-b border-gray-300">
        {!loading && coach && (
          <h1 className="text-2xl font-bold">
            {`${getGreeting()}, ${coach.firstname} ${coach.secondname}`}
          </h1>
        )}
      </SidebarHeader>

      <SidebarContent className="mt-4">
        <SidebarMenu>
          {sideBarItems.map((item, index) => (
            <SidebarMenuItem key={index}>
              {item.action ? (
                <SidebarMenuButton
                  onClick={item.action}
                  className={`hover:bg-gray-200 text-black ${item.className || ''}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </SidebarMenuButton>
              ) : (
                <Link href={item.href || '#'}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    className={`hover:bg-gray-200 text-black ${item.className || ''}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </Link>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
