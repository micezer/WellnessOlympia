import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import SessionChecker from '@/components/SessionChecker';
import PWARedirect from '@/components/PWARedirect';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import NoHistoryNavigation from '@/components/NoHistoryNavigation';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// ✅ Metadata SIN themeColor
export const metadata = {
  title: 'Wellness Olympia',
  description: 'Seguimiento de wellness y carga de entrenamiento',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'Wellness Olympia',
  },
};

// themeColor = fondo oscuro de la app (barra de estado del móvil)
export const viewport = {
  themeColor: '#212529',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // permite usar env(safe-area-inset-*) en iPhone
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="bg-[rgb(30,35,40)]">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="application-name" content="Wellness Olympia" />
        <meta name="apple-mobile-web-app-title" content="Wellness Olympia" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Meta tags adicionales para PWA */}
        <meta name="msapplication-TileColor" content="#212529" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[rgb(30,35,40)]`}
      >
        <SessionChecker />
        <PWARedirect />
        <ServiceWorkerRegister />
        <NoHistoryNavigation />
        {children}
      </body>
    </html>
  );
}
