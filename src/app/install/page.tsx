'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/brand/button';

// Define el tipo para el evento de instalación
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop';
type Step = { title: string; text: React.ReactNode };

function detectPlatform(userAgent: string): Platform {
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  return 'desktop';
}

function instructions(platform: Platform, userAgent: string): { heading: string; steps: Step[] } {
  if (platform === 'ios')
    return {
      heading: '🍎 iPhone / iPad (Safari)',
      steps: [
        { title: 'Abre el menú compartir', text: <>Toca el icono de <strong>compartir</strong> 📤 en la barra.</> },
        {
          title: 'Añadir a pantalla de inicio',
          text: <>Desliza hacia abajo y elige <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.</>,
        },
        { title: 'Confirma', text: <>Toca <strong>&quot;Añadir&quot;</strong> arriba a la derecha.</> },
      ],
    };
  if (platform === 'android')
    return {
      heading: '🤖 Android',
      steps: [
        {
          title: 'Abre el menú del navegador',
          text: <>Toca los <strong>tres puntos</strong> ⋮ arriba a la derecha.</>,
        },
        {
          title: 'Instalar app',
          text: <>Elige <strong>&quot;Instalar app&quot;</strong> o <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.</>,
        },
        { title: 'Confirma', text: <>Toca <strong>&quot;Instalar&quot;</strong>.</> },
      ],
    };
  if (/firefox/.test(userAgent))
    return {
      heading: '💻 Ordenador',
      steps: [
        {
          title: 'Abre la app en Chrome o Edge',
          text: 'Firefox no permite instalar aplicaciones web. Copia esta dirección en Chrome o Edge.',
        },
      ],
    };
  if (/safari/.test(userAgent) && !/chrome|chromium|edg/.test(userAgent))
    return {
      heading: '💻 Mac (Safari)',
      steps: [
        { title: 'Abre el menú Archivo', text: 'En la barra de menús de Safari.' },
        { title: 'Añadir al Dock', text: <>Elige <strong>&quot;Añadir al Dock&quot;</strong> y confirma.</> },
      ],
    };
  return {
    heading: '💻 Ordenador (Chrome / Edge)',
    steps: [
      {
        title: 'Busca el icono de instalar',
        text: <>A la derecha de la barra de direcciones aparece un icono de <strong>instalar</strong> (una pantalla con una flecha).</>,
      },
      {
        title: 'O desde el menú',
        text: <>Menú ⋮ → <strong>&quot;Guardar y compartir&quot; → &quot;Instalar página como aplicación&quot;</strong> (en Edge: &quot;Aplicaciones&quot; → &quot;Instalar este sitio&quot;).</>,
      },
      { title: 'Confirma', text: <>Pulsa <strong>&quot;Instalar&quot;</strong>; la app se abrirá en su propia ventana.</> },
    ],
  };
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    setUserAgent(navigator.userAgent.toLowerCase());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      // Recargar para que detecte como PWA
      window.location.reload();
    }
  };

  const platform = detectPlatform(userAgent);
  const { heading, steps } = instructions(platform, userAgent);

  return (
    <div className="min-h-dvh bg-ink-900 text-white px-4 py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
      <div className="max-w-lg mx-auto text-center">
        <Image src="/logos/app_logo.png" alt="Wellness" width={110} height={110} className="mx-auto mb-6" />

        <h1 className="text-3xl font-bold mb-2">Instala la app</h1>
        <p className="text-gray-300 mb-8">
          Para usar Wellness Olympia tienes que instalarla en tu dispositivo.
        </p>

        {/* Instalación directa (Chrome/Edge en Android y ordenador) */}
        {deferredPrompt && (
          <div className="mb-8">
            <Button onClick={handleInstall} className="w-full text-lg">
              ⚡ Instalar ahora
            </Button>
            <p className="text-sm text-gray-400 mt-2">Un toque y listo</p>
          </div>
        )}

        {userAgent && (
          <section className="mb-8 p-5 bg-ink-800 rounded-2xl text-left">
            <h2 className="text-xl font-bold mb-4 text-center">{heading}</h2>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={step.title} className="flex items-start gap-3 p-3 bg-ink-700 rounded-xl">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-brand text-black font-bold flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-gray-300">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-xl text-left">
          <h3 className="font-semibold text-blue-300 mb-1">💡 Después de instalar</h3>
          <p className="text-sm text-blue-200">
            Abre la app desde su icono ({platform === 'desktop' ? 'escritorio o menú de inicio' : 'pantalla de inicio'}), no desde el navegador.
          </p>
        </div>

        <Button variant="secondary" onClick={() => window.location.reload()} className="mt-6">
          🔄 Ya la he instalado
        </Button>
      </div>
    </div>
  );
}
