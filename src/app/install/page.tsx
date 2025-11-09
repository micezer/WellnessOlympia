'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// Define el tipo para el evento de instalación
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    // Detectar dispositivo y navegador
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    setIsChrome(/chrome/.test(userAgent));

    // Manejar evento de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        // Recargar para que detecte como PWA
        window.location.reload();
      }
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[rgb(33,37,41)] text-white p-6 overflow-y-auto">
      <div className="text-center max-w-2xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logos/app_logo.png"
            alt="Wellness"
            width={120}
            height={120}
            className="mx-auto"
          />
        </div>

        <h1 className="text-4xl font-bold mb-2">📲 Instalar App</h1>
        <p className="text-lg mb-8 text-gray-300">
          Para acceder a la aplicación, debes instalarla en tu dispositivo
        </p>

        {/* Botón de instalación directa (solo para Android/Chrome) */}
        {deferredPrompt && isAndroid && (
          <div className="mb-8">
            <button
              onClick={handleInstall}
              className="w-full max-w-md bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-8 rounded-lg text-lg transition shadow-lg mb-4"
            >
              ⚡ Instalar App Ahora
            </button>
            <p className="text-sm text-gray-400">
              Instalación directa disponible para tu dispositivo
            </p>
          </div>
        )}

        {/* Instrucciones para Android */}
        {(isAndroid || !isIOS) && (
          <div className="mb-8 p-6 bg-[rgb(45,50,55)] rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
              <span>🤖</span> Instrucciones para Android
            </h2>

            {isChrome ? (
              // Instrucciones para Chrome Android
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                  <span className="text-xl">1️⃣</span>
                  <div className="text-left">
                    <p className="font-semibold">Abre el menú de Chrome</p>
                    <p className="text-sm text-gray-300">
                      Toca los <strong>tres puntos verticales</strong> ⋮ en la esquina superior
                      derecha
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                  <span className="text-xl">2️⃣</span>
                  <div className="text-left">
                    <p className="font-semibold">Selecciona &quot;Instalar app&quot;</p>
                    <p className="text-sm text-gray-300">
                      Busca la opción <strong>&quot;Instalar app&quot;</strong> o{' '}
                      <strong>&quot;Add to Home Screen&quot;</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                  <span className="text-xl">3️⃣</span>
                  <div className="text-left">
                    <p className="font-semibold">Confirma la instalación</p>
                    <p className="text-sm text-gray-300">
                      Toca <strong>&quot;Instalar&quot;</strong> o <strong>&quot;Add&quot;</strong>{' '}
                      en el diálogo de confirmación
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Instrucciones genéricas para Android
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                  <span className="text-xl">1️⃣</span>
                  <div className="text-left">
                    <p className="font-semibold">Abre el menú del navegador</p>
                    <p className="text-sm text-gray-300">
                      Busca el menú (tres puntos o líneas) en la esquina superior
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                  <span className="text-xl">2️⃣</span>
                  <div className="text-left">
                    <p className="font-semibold">Busca &quot;Añadir a pantalla principal&quot;</p>
                    <p className="text-sm text-gray-300">
                      Selecciona la opción para instalar o añadir a inicio
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                  <span className="text-xl">3️⃣</span>
                  <div className="text-left">
                    <p className="font-semibold">Confirma la instalación</p>
                    <p className="text-sm text-gray-300">
                      Sigue las instrucciones para completar la instalación
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instrucciones para iOS */}
        {isIOS && (
          <div className="mb-8 p-6 bg-[rgb(45,50,55)] rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
              <span>🍎</span> Instrucciones para iPhone/iPad
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                <span className="text-xl">1️⃣</span>
                <div className="text-left">
                  <p className="font-semibold">Abre el menú compartir</p>
                  <p className="text-sm text-gray-300">
                    Toca el ícono de <strong>compartir</strong> 📤 en la barra.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                <span className="text-xl">2️⃣</span>
                <div className="text-left">
                  <p className="font-semibold">Desplaza y selecciona</p>
                  <p className="text-sm text-gray-300">
                    Desliza hacia arriba y busca <strong>&quot;Add to Home Screen&quot;</strong> o{' '}
                    <strong>&quot;Añadir a pantalla de inicio&quot;</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[rgb(55,60,65)] rounded-lg">
                <span className="text-xl">3️⃣</span>
                <div className="text-left">
                  <p className="font-semibold">Confirma la instalación</p>
                  <p className="text-sm text-gray-300">
                    Toca <strong>&quot;Add&quot;</strong> en la esquina superior derecha
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje final */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h3 className="font-semibold text-blue-300 mb-2">💡 Después de instalar:</h3>
          <p className="text-sm text-blue-200">
            La app aparecerá en tu pantalla de inicio como una aplicación nativa. Ábrela desde allí
            para comenzar a usarla.
          </p>
        </div>

        {/* Botón de verificación (para cuando ya instalaron) */}
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            🔄 Ya instalé la app
          </button>
        </div>
      </div>
    </div>
  );
}
