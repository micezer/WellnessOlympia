import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlayerShellProps = {
  children: React.ReactNode;
  // Cabecera fija con flecha atrás (formularios, perfil)
  title?: string;
  backHref?: string;
  headerRight?: React.ReactNode;
  // Barra inferior fija (botón Enviar)
  footer?: React.ReactNode;
  className?: string;
};

// Layout oscuro de la app de jugadoras: scroll natural, respeta notch y barra de inicio
export function PlayerShell({
  children,
  title,
  backHref,
  headerRight,
  footer,
  className,
}: PlayerShellProps) {
  return (
    // Contenedor fijo a pantalla completa: solo hace scroll si el contenido no cabe (formularios),
    // y sin efecto rebote en las páginas que caben en la pantalla
    <div className="fixed inset-0 overflow-y-auto overscroll-none flex flex-col bg-ink-900 text-white">
      {title || backHref ? (
        <header className="sticky top-0 z-20 bg-ink-900/95 backdrop-blur border-b border-ink-700 pt-[env(safe-area-inset-top)]">
          <div className="max-w-lg mx-auto h-14 px-2 flex items-center gap-1">
            {backHref && (
              <Link
                href={backHref}
                aria-label="Volver"
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-ink-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
            )}
            <h1 className="flex-1 text-lg font-bold truncate">{title}</h1>
            {headerRight}
          </div>
        </header>
      ) : (
        <div className="pt-[env(safe-area-inset-top)]" />
      )}

      <main className={cn('flex-1 w-full max-w-lg mx-auto px-4 py-5', className)}>{children}</main>

      {footer && (
        <div className="sticky bottom-0 z-20 bg-ink-900/95 backdrop-blur border-t border-ink-700 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-lg mx-auto px-4 py-3">{footer}</div>
        </div>
      )}
    </div>
  );
}
