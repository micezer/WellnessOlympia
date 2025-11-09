'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSideBar } from '@/components/sidebar';
import { Header } from '@/components/header';

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <AppSideBar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Header />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
