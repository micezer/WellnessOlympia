'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const teams = ['Senior A', 'Senior B', 'Senior C'];

export default function ChooseTeamPage() {
  const [team, setTeam] = useState('');
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentTeam = async () => {
      try {
        const res = await fetch('/api/coach/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.chosen_team) setCurrentTeam(data.chosen_team);
      } catch (err) {
        console.error('Error al obtener equipo actual:', err);
      }
    };
    fetchCurrentTeam();
  }, []);

  const handleChoose = async (selectedTeam: string) => {
    setError('');
    if (!selectedTeam) return setError('Selecciona un equipo');

    const res = await fetch('/api/coach/choose-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: selectedTeam }),
    });

    const data = await res.json();
    if (res.ok && data.redirectUrl) router.push(data.redirectUrl);
    else setError(data.error || 'Error al guardar');
  };

  const handleGoBack = () => {
    if (currentTeam) router.push(`/coach/dashboard/${currentTeam}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Elige tu equipo</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {teams.map((t) => (
            <button
              key={t}
              onClick={() => handleChoose(t)}
              className={`py-3 rounded-lg font-semibold transition-transform transform hover:scale-105 
                ${
                  team === t
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-800 hover:bg-green-100'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {currentTeam && (
          <button
            onClick={handleGoBack}
            className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Volver al dashboard
          </button>
        )}

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );
}
