import { SidebarTrigger } from './ui/sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-2 px-2 md:px-4">
        <SidebarTrigger />
        <span className="font-semibold text-gray-700 md:hidden">Wellness Olympia</span>
      </div>
    </header>
  );
}
