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

  // Mover la función dentro del componente para evitar dependencias
  const getToday = () => {
    const now = new Date();
    const offset = 1; // España UTC+1
    const spainTime = new Date(now.getTime() + offset * 60 * 60 * 1000);
    return spainTime.toISOString().split('T')[0];
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    async function fetchStatus() {
      const res = await fetch('/api/player/forms/status');
      if (!res.ok) return;
      const data: FormStatus = await res.json();
      setStatus(data);
      setShowBirthModal(!data.player.birth_date);
    }
    fetchStatus();

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []); // Eliminar dependencias problemáticas

  if (!status) return <p className="text-white text-center mt-10">Cargando...</p>;

  const today = getToday(); // Para el render
  const alreadyDone = {
    wellness: status.wellness === today,
    load: status.load === today,
  };

  const handleSaveBirthDate = async () => {
    if (!birthDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/player/update-birth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_date: birthDate }),
      });
      if (res.ok) {
        setShowBirthModal(false);
        setStatus({
          ...status,
          player: { ...status.player, birth_date: birthDate },
        });
      } else {
        console.error('Error actualizando fecha de nacimiento');
      }
    } catch (err) {
      console.error('Error al guardar fecha de nacimiento:', err);
    } finally {
      setSaving(false);
    }
  };

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
      </header>

      {/* Formularios */}
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
      <footer className="text-gray-400 text-sm py-4 mt-auto">
        Última actualización: {getToday()}
      </footer>

      {/* Modal fecha de nacimiento */}
      {showBirthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-[rgb(33,37,41)] p-6 rounded-2xl shadow-lg w-80 text-center">
            <h2 className="text-xl font-bold text-white mb-4">Introduce tu fecha de nacimiento</h2>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-2 rounded-md mb-4"
              max={getToday()}
            />
            <button
              onClick={handleSaveBirthDate}
              disabled={saving}
              className="w-full py-2 rounded-md font-semibold text-black"
              style={{ backgroundColor: 'rgb(0, 255, 127)' }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
