'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSideBar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { WhatsNew } from '@/components/whats-new';

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden">
        <AppSideBar />
        <main className="flex-1 min-w-0 overflow-auto bg-gray-50">
          <Header />
          {children}
        </main>
        <WhatsNew variant="light" />
      </div>
    </SidebarProvider>
  );
}
