'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Player {
  firstname: string;
  lastname: string;
  team: string;
  birth_date: string | null;
}

interface FormStatus {
  player: Player;
  wellness: string | null;
  load: string | null;
  birth_date: string | null;
}

export default function PlayerWelcomePage() {
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    async function fetchStatus() {
      const res = await fetch('/api/player/forms/status');
      if (!res.ok) return;
      const data: FormStatus = await res.json();

      // DEBUG DETALLADO
      console.log('🔵 === DEBUG COMPLETO ===');
      console.log('📅 Fecha HOY (frontend):', today);
      console.log('🕒 Hora actual:', now.toString());
      console.log('🌍 Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log('📊 Wellness del API:', data.wellness);
      console.log('📊 Load del API:', data.load);
      console.log('🔍 Wellness === Today:', data.wellness === today);
      console.log('🔍 Load === Today:', data.load === today);
      console.log('🔄 Tipo de datos - Today:', typeof today);
      console.log('🔄 Tipo de datos - Wellness:', typeof data.wellness);
      console.log('🔄 Tipo de datos - Load:', typeof data.load);
      console.log('========================');

      setStatus(data);
      setShowBirthModal(!data.player.birth_date);
    }
    fetchStatus();

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []);

  if (!status) return <p className="text-white text-center mt-10">Cargando...</p>;

  // Debug en el render también
  console.log('🎯 === RENDER ===');
  console.log('✅ Wellness completado hoy?', status.wellness === today);
  console.log('✅ Load completado hoy?', status.load === today);

  const alreadyDone = {
    wellness: status.wellness === today,
    load: status.load === today,
  };

  // También muestra visualmente qué está pasando
  return (
    <main
      className="flex flex-col items-center min-h-screen w-full fixed top-0 left-0 overflow-hidden"
      style={{ backgroundColor: 'rgb(33, 37, 41)' }}
    >
      {/* Header */}
      <header className="w-full text-white shadow-md text-center flex flex-col items-center gap-4 py-4">
        <div className="flex justify-center items-center gap-8">
          <Image src="/logos/app_logo.png" alt="Wellness" width={130} height={130} />
        </div>
        <h1 className="text-2xl font-bold">
          Bienvenida, {status.player.firstname} {status.player.lastname}
        </h1>
        <p className="text-sm opacity-90">Equipo: {status.player.team}</p>

        {/* DEBUG VISUAL */}
        <div className="text-xs bg-black/50 p-2 rounded mt-2">
          <p>🔍 Debug: Hoy es {today}</p>
          <p>
            📊 Wellness: {status.wellness} | Load: {status.load}
          </p>
          <p>✅ Wellness hoy: {alreadyDone.wellness ? 'SÍ' : 'NO'}</p>
          <p>✅ Load hoy: {alreadyDone.load ? 'SÍ' : 'NO'}</p>
        </div>
      </header>

      {/* Resto de tu código... */}
      <div
        className="shadow-md rounded-2xl p-8 w-full max-w-md mx-auto"
        style={{ backgroundColor: 'rgb(45, 50, 55)' }}
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-white">📋 Formularios diarios</h1>
        <div className="space-y-6">
          {/* Wellness */}
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: 'rgb(55, 60, 65)', color: 'white' }}
          >
            <h2 className="font-semibold mb-2">Wellness</h2>
            <p className="text-sm text-gray-300 mb-3">
              Último formulario: {status.wellness || 'No completado'}
            </p>
            {alreadyDone.wellness ? (
              <p className="text-green-400 font-medium">✅ Formulario completado hoy</p>
            ) : (
              <Link href="/player/forms/wellness">
                <button
                  className="w-full py-2 rounded-md font-semibold text-black"
                  style={{ backgroundColor: 'rgb(0, 255, 127)' }}
                >
                  Rellenar Wellness
                </button>
              </Link>
            )}
          </div>

          {/* Load */}
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: 'rgb(55, 60, 65)', color: 'white' }}
          >
            <h2 className="font-semibold mb-2">Carga de entrenamiento</h2>
            <p className="text-sm text-gray-300 mb-3">
              Último formulario: {status.load || 'No completado'}
            </p>
            {alreadyDone.load ? (
              <p className="text-green-400 font-medium">✅ Formulario completado hoy</p>
            ) : (
              <Link href="/player/forms/load">
                <button
                  className="w-full py-2 rounded-md font-semibold text-black"
                  style={{ backgroundColor: 'rgb(0, 255, 127)' }}
                >
                  Rellenar Carga
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-gray-400 text-sm py-4 mt-auto">Última actualización: {today}</footer>
    </main>
  );
}
