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
import { Home, RefreshCcw, LogOut, KeyRound, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { detachPushSubscription } from '@/hooks/usePushSubscription';
import { PushToggle } from '@/components/push-toggle';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { usePathname, useRouter } from 'next/navigation';

// ✅ Define el tipo para el coach
interface Coach {
  identifier: string;
  firstname: string;
  secondname: string;
  chosen_team?: string;
}

type SidebarItem = {
  name: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  className?: string;
  badge?: number;
};

export function AppSideBar() {
  const pathname = usePathname();
  const router = useRouter();
  // ✅ Cambia any por Coach | null
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [unreadInquiries, setUnreadInquiries] = useState(0);

  // Respuestas sin leer en Consultas (se vuelve a mirar al cambiar de página)
  useEffect(() => {
    fetch('/api/inquiries', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUnreadInquiries(data.unread))
      .catch(() => {});
  }, [pathname]);

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
    await detachPushSubscription(); // este dispositivo deja de recibir avisos de esta cuenta
    await fetch('/api/logout', { method: 'POST' }); // endpoint que borra la cookie
    window.location.replace('/');
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
      name: 'Consultas',
      href: '/coach/inquiries',
      icon: <MessageCircle className="w-5 h-5" />,
      badge: unreadInquiries,
    },
    {
      name: 'Cambiar contraseña',
      action: () => setPasswordOpen(true),
      icon: <KeyRound className="w-5 h-5" />,
    },
    {
      name: 'Cerrar sesión',
      action: handleLogout,
      icon: <LogOut className="w-5 h-5" />, // 🔹 icono de logout
      className: 'text-red-600 font-semibold',
    },
  ];

  return (
    <>
      <Sidebar side="left" className="w-64 bg-gray-100 text-black">
        <SidebarHeader className="p-4 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <Image src="/logos/app_logo.png" alt="Wellness" width={40} height={40} />
            <div className="min-w-0">
              <p className="font-bold leading-tight">Wellness Olympia</p>
              {!loading && coach && (
                <p className="text-sm text-gray-500 truncate">
                  {coach.firstname} {coach.secondname}
                  {coach.chosen_team && ` · ${coach.chosen_team}`}
                </p>
              )}
            </div>
          </div>
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
                      {!!item.badge && (
                        <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </Link>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <PushToggle
            className="mx-2 mt-6"
            description="Te avisamos si una jugadora indica una lesión o pide restablecer su contraseña."
          />
        </SidebarContent>
      </Sidebar>
      {/* Fuera del Sidebar: en móvil el menú se cierra y desmontaría el diálogo */}
      {coach && (
        <ChangePasswordDialog
          identifier={coach.identifier}
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
        />
      )}
    </>
  );
}
