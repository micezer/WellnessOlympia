import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import SessionChecker from '@/components/SessionChecker';
import PWARedirect from '@/components/PWARedirect';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// ✅ Metadata SIN themeColor
export const metadata = {
  title: 'Tu App',
  description: 'Aplicación con fondo oscuro completo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tu App',
  },
};

// ✅ Viewport CON themeColor
export const viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[rgb(30,35,40)]">
      <head>
        {/* También puedes agregar theme-color aquí como backup */}
        <meta name="theme-color" content="#22c55e" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="application-name" content="Tu App" />
        <meta name="apple-mobile-web-app-title" content="Tu App" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Meta tags adicionales para PWA */}
        <meta name="msapplication-TileColor" content="#22c55e" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[rgb(30,35,40)]`}
      >
        <SessionChecker />
        <PWARedirect />
        {children}
      </body>
    </html>
  );
}
