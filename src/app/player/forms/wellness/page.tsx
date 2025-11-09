'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type WellnessData = {
  fatigue_level: number;
  tiredness_level: number;
  sleep_hours: number;
  stress_level: number;
  mood: string;
  menstrual_phase: string;
  discomfort: string;
  injured: string;
  injury_detail: string;
};

export default function WellnessFormPage() {
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<WellnessData>({
    fatigue_level: 1, // Cambiado de 0 a 1 para que tenga valor por defecto
    tiredness_level: 1, // Cambiado de 0 a 1
    sleep_hours: 0,
    stress_level: 1, // Cambiado de 0 a 1
    mood: '',
    menstrual_phase: '',
    discomfort: '',
    injured: 'no',
    injury_detail: '',
  });

  useEffect(() => {
    // Prevenir scroll en el body principal
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    fetch('/api/player/forms/wellness', { method: 'GET', credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setLastDate(data.wellness));

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación adicional
    if (formData.sleep_hours < 0 || formData.sleep_hours > 24) {
      alert('Por favor, ingresa un número válido de horas de sueño (0-24)');
      return;
    }

    const res = await fetch('/api/player/forms/wellness', {
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
          ¡Gracias por registrar tu estado de bienestar!
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
        <h1 className="text-3xl font-extrabold text-center mb-4 text-green-400">WELLNESS</h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          Último registro: <span className="font-medium">{lastDate || 'Nunca'}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* NIVEL DE FATIGA - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              Nivel de Fatiga <span className="text-red-400">*</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={formData.fatigue_level}
              onChange={(e) => setFormData({ ...formData, fatigue_level: Number(e.target.value) })}
              className="w-full accent-green-400"
              required
            />
            <p className="text-right text-sm text-gray-400">{formData.fatigue_level}/10</p>
          </div>

          {/* NIVEL DE CANSANCIO - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              Nivel de Cansancio <span className="text-red-400">*</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={formData.tiredness_level}
              onChange={(e) =>
                setFormData({ ...formData, tiredness_level: Number(e.target.value) })
              }
              className="w-full accent-green-400"
              required
            />
            <p className="text-right text-sm text-gray-400">{formData.tiredness_level}/10</p>
          </div>

          {/* NIVEL DE ESTRÉS - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              Nivel de Estrés <span className="text-red-400">*</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={formData.stress_level}
              onChange={(e) => setFormData({ ...formData, stress_level: Number(e.target.value) })}
              className="w-full accent-green-400"
              required
            />
            <p className="text-right text-sm text-gray-400">{formData.stress_level}/10</p>
          </div>

          {/* ESTADO DE ÁNIMO - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              Estado de Ánimo <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            >
              <option value="">Seleccionar...</option>
              <option value="bien">Bien</option>
              <option value="feliz">Feliz</option>
              <option value="energica">Enérgica</option>
              <option value="motivada">Motivada</option>
              <option value="cambios_de_humor">Cambios de Humor</option>
              <option value="triste">Triste</option>
              <option value="irritable">Irritable</option>
              <option value="frustrada">Frustrada</option>
            </select>
          </div>

          {/* HORAS DE SUEÑO - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              Horas de Sueño <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={formData.sleep_hours}
              onChange={(e) => setFormData({ ...formData, sleep_hours: Number(e.target.value) })}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {/* LESIONADA - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              ¿Estás lesionada actualmente? <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.injured}
              onChange={(e) => setFormData({ ...formData, injured: e.target.value })}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            >
              <option value="no">No</option>
              <option value="si">Sí</option>
            </select>
          </div>

          {/* DETALLE DE LA LESIÓN - REQUERIDO SI ESTÁ LESIONADA */}
          {formData.injured === 'si' && (
            <div>
              <label className="block font-semibold mb-1">
                Indica la lesión <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Describe la lesión..."
                value={formData.injury_detail}
                onChange={(e) => setFormData({ ...formData, injury_detail: e.target.value })}
                className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                required={formData.injured === 'si'}
              ></textarea>
            </div>
          )}

          {/* FASE CICLO MENSTRUAL - REQUERIDO */}
          <div>
            <label className="block font-semibold mb-1">
              Fase del Ciclo Menstrual <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.menstrual_phase}
              onChange={(e) => setFormData({ ...formData, menstrual_phase: e.target.value })}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            >
              <option value="">Seleccionar...</option>
              <option value="folicular">Folicular</option>
              <option value="ovulatoria">Ovulatoria</option>
              <option value="lutea">Lútea</option>
              <option value="menstrual">Menstrual</option>
              <option value="no_aplica">No aplica</option>
            </select>
          </div>

          {/* INDICAR MOLESTIA - OPCIONAL */}
          <div>
            <label className="block font-semibold mb-1">Indicar Molestia o Carga</label>
            <textarea
              rows={3}
              placeholder="Describe cualquier molestia o carga..."
              value={formData.discomfort}
              onChange={(e) => setFormData({ ...formData, discomfort: e.target.value })}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
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
