'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

import { Home, Users, Dumbbell, FileText, Settings } from 'lucide-react';

const sideBarItems = [
  {
    name: 'Panel de Control',
    href: '/coach/dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  {
    name: 'Jugadoras',
    href: '/coach/players',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Carga Interna',
    href: '/coach/load',
    icon: <Dumbbell className="w-5 h-5" />,
  },
  {
    name: 'Informes',
    href: '/coach/reports',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    name: 'Ajustes',
    href: '/coach/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default sideBarItems;

export function AppSideBar() {
  return (
    <Sidebar side="left">
      <SidebarHeader>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sideBarItems.map((item, index) => (
            <SidebarMenuItem key={index} value={item.href}>
              <SidebarMenuButton>
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
