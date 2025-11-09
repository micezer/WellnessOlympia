'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type MusclePain = {
  abductores: number;
  cuadriceps: number;
  gemelos: number;
  isquiotibiales: number;
  lumbar: number;
  dorsal: number;
  cervical: number;
  rodilla: number;
  tobillo: number;
  hombro: number;
  otras: string;
};

type LoadData = {
  rpe: number;
  musclePain: MusclePain;
};

export default function LoadFormPage() {
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<LoadData>({
    rpe: 1,
    musclePain: {
      abductores: 1,
      cuadriceps: 1,
      gemelos: 1,
      isquiotibiales: 1,
      lumbar: 1,
      dorsal: 1,
      cervical: 1,
      rodilla: 1,
      tobillo: 1,
      hombro: 1,
      otras: '',
    },
  });

  useEffect(() => {
    // Prevenir scroll en el body principal
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    fetch('/api/player/forms/load', { method: 'GET', credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setLastDate(data.load));

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación adicional
    if (formData.rpe < 1) {
      alert('Por favor, selecciona un valor de RPE entre 1 y 10');
      return;
    }

    const res = await fetch('/api/player/forms/load', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setSubmitted(true);
      setLastDate(new Date().toISOString().split('T')[0]);
    } else {
      const data = await res.json();
      alert(data.error || 'Error al enviar');
    }
  };

  if (submitted)
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen w-full fixed top-0 left-0"
        style={{ backgroundColor: 'rgb(33, 37, 41)' }}
      >
        <h2 className="text-3xl font-bold text-green-400 mb-2">Formulario enviado ✅</h2>
        <p className="text-gray-300 text-center px-4 mb-6">
          ¡Gracias por completar tu cuestionario de carga!
        </p>
        <Link href="/player/welcome">
          <button
            style={{
              backgroundColor: 'rgb(0, 255, 127)',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(0, 230, 115)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgb(0, 255, 127)')}
            className="text-black font-semibold py-2 px-6 rounded-lg shadow-md"
          >
            Volver
          </button>
        </Link>
      </div>
    );

  const handlePainChange = (muscle: keyof MusclePain, value: number | string) => {
    setFormData({
      ...formData,
      musclePain: { ...formData.musclePain, [muscle]: value },
    });
  };

  return (
    <div
      className="min-h-screen w-full fixed top-0 left-0 flex items-start justify-center px-4 py-8"
      style={{ backgroundColor: 'rgb(33, 37, 41)' }}
    >
      {/* Contenedor con scroll interno */}
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 text-white"
        style={{ backgroundColor: 'rgb(33, 37, 41)' }}
      >
        <h1 className="text-3xl font-extrabold text-center mb-4">CUESTIONARIO RPE</h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          Último registro: <span className="font-medium">{lastDate || 'Nunca'}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* RPE - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              RPE (Esfuerzo Percibido 1–10) <span className="text-red-400">*</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={formData.rpe}
              onChange={(e) => setFormData({ ...formData, rpe: Number(e.target.value) })}
              className="w-full accent-green-400"
              required
            />
            <p className="text-right text-sm text-gray-400">{formData.rpe}/10</p>
          </div>

          {/* DOLOR / MOLESTIA - TODOS REQUERIDOS */}
          <h2 className="text-lg font-semibold mt-2">
            Dolor o Molestia (1–10) <span className="text-red-400">*</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(formData.musclePain) as (keyof MusclePain)[])
              .filter((key) => key !== 'otras')
              .map((muscle) => (
                <div key={muscle} className="flex flex-col">
                  <label className="capitalize text-white">
                    {muscle.replace(/_/g, ' ')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.musclePain[muscle] as number}
                    onChange={(e) => handlePainChange(muscle, Number(e.target.value))}
                    className="accent-green-400"
                    required
                  />
                  <p className="text-right text-xs text-gray-400">
                    {formData.musclePain[muscle]}/10
                  </p>
                </div>
              ))}
          </div>

          {/* OTRAS MOLESTIAS - OPCIONAL */}
          <div>
            <label className="block font-semibold mb-1">Otras (indica)</label>
            <textarea
              rows={3}
              placeholder="Describe otras molestias o zonas afectadas..."
              value={formData.musclePain.otras}
              onChange={(e) => handlePainChange('otras', e.target.value)}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none resize-none"
            ></textarea>
          </div>

          {/* BOTONES */}
          <button
            type="submit"
            style={{
              backgroundColor: 'rgb(0, 255, 127)',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(0, 230, 115)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgb(0, 255, 127)')}
            className="text-black font-semibold py-3 rounded-lg shadow-md mt-2"
          >
            Enviar
          </button>

          <Link href="/player/welcome">
            <button
              type="button"
              style={{
                backgroundColor: 'rgb(0, 255, 127)',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(0, 230, 115)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgb(0, 255, 127)')}
              className="text-black font-semibold py-3 rounded-lg shadow-md mt-2 w-full"
            >
              Volver
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}
