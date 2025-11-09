'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Dialog } from '@headlessui/react';

interface WellnessForm {
  id: number;
  player_id: number;
  player_name: string;
  date: string;
  fatigue_level: number;
  tiredness_level: number;
  stress_level: number;
  mood: string;
  sleep_hours: number;
  is_injured: boolean;
  injury_details?: string;
  menstrual_phase?: string;
  discomfort?: string;
  created_at: string;
}

interface LoadForm {
  id: number;
  player_id: number;
  player_name: string;
  date: string;
  rpe: number;
  muscle_pain: Record<string, number>;
  created_at: string;
}

interface Player {
  id: number;
  name: string;
  position: string;
  loadScore: number;
  wellnessScore: number;
  moodScore: number;
  mood: string | null;
  lastWellness: WellnessForm | null;
  lastLoad: LoadForm | null;
  formsToday: number;
}

interface DailyAverage {
  date: string;
  avgLoad: number;
  avgWellness: number;
  avgMood: number;
}

interface DashboardData {
  coachName: string;
  team: string;
  date: string;
  formsCount: number;
  players: Player[];
  dailyAverages: DailyAverage[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [selectedTab, setSelectedTab] = useState<'jugadoras' | 'porteras'>('jugadoras');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<Player | null>(null);
  const [modalType, setModalType] = useState<'wellness' | 'load'>('wellness');

  const fetchData = async (date: string, tab: 'jugadoras' | 'porteras' = 'jugadoras') => {
    try {
      const res = await fetch(
        `/api/coach/dashboard?date=${date}&position=${tab === 'porteras' ? 'portera' : 'jugadora'}`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Error fetching dashboard data');
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedTab);
  }, [selectedDate, selectedTab]);

  const openModal = (player: Player, type: 'wellness' | 'load') => {
    setModalContent(player);
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  const formatMusclePain = (musclePain: Record<string, number>) => {
    return Object.entries(musclePain)
      .filter(([_, value]) => value > 0)
      .map(([muscle, value]) => `${muscle}: ${value}`)
      .join(', ');
  };

  if (!dashboardData) return <p>Cargando dashboard...</p>;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // 🔹 Filtra jugadoras según la pestaña seleccionada
  const filteredPlayers = dashboardData.players.filter((p) =>
    selectedTab === 'jugadoras'
      ? p.position.toLowerCase() !== 'portera'
      : p.position.toLowerCase() === 'portera',
  );

  console.log('Daily averages:', dashboardData?.dailyAverages);

  return (
    <div className="p-6 space-y-10 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{`${getGreeting()}, ${dashboardData.coachName}`}</h1>
        <div>
          <div className="flex space-x-4 mb-4">
            <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md flex-1 text-center">
              <p className="text-sm">Equipo</p>
              <p className="font-bold text-lg">{dashboardData.team}</p>
            </div>
            <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md flex-1 text-center">
              <p className="text-sm">Formularios hoy</p>
              <p className="font-bold text-lg">{dashboardData.formsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="mb-4">
        <label className="mr-2">Seleccionar fecha:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={() => fetchData(selectedDate, selectedTab)}
          className="ml-2 px-3 py-1 bg-green-500 text-white rounded"
        >
          Recargar
        </button>
        {/* 🔹 Tabs para jugadoras/porteras */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setSelectedTab('jugadoras')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              selectedTab === 'jugadoras'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Jugadoras de campo
          </button>
          <button
            onClick={() => setSelectedTab('porteras')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              selectedTab === 'porteras'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Porteras
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="space-y-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">Promedio diario - Wellness & Carga</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.dailyAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgWellness" stroke="#8884d8" name="Wellness" />
              <Line type="monotone" dataKey="avgLoad" stroke="#82ca9d" name="Carga %" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div className="flex items-center space-x-3">
              <span className="inline-block w-3 h-3 rounded-full bg-purple-500" />
              <p className="text-sm">
                <span className="font-semibold">Wellness:</span> valores altos indican buena
                recuperación, energía y estado físico óptimo. Valores bajos reflejan fatiga, estrés
                o falta de descanso.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
              <p className="text-sm">
                <span className="font-semibold">Carga %:</span> valores altos indican mayor carga de
                entrenamiento; valores bajos reflejan menor esfuerzo físico.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Carga por Jugadora</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredPlayers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="loadScore" fill="#82ca9d" name="Carga %" />
              <Bar dataKey="wellnessScore" fill="#8884d8" name="Wellness %" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div className="flex items-center space-x-3">
              <span className="inline-block w-3 h-3 rounded-full bg-purple-500" />
              <p className="text-sm">
                <span className="font-semibold">Wellness:</span> valores altos = buena recuperación;
                bajos = fatiga o estrés.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
              <p className="text-sm">
                <span className="font-semibold">Load %:</span> valores altos = mayor carga; bajos =
                menor esfuerzo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Mood Promedio Diario</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboardData.dailyAverages}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgMood" stroke="#ff7300" name="Mood" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center space-x-3 text-gray-700">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
          <p className="text-sm">
            <span className="font-semibold">Mood:</span> valores altos = estado de ánimo positivo;
            valores bajos = estado de ánimo negativo.
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div>
        <h2 className="text-xl font-semibold mb-4 mt-6">
          {selectedTab === 'jugadoras' ? 'Jugadoras de Campo' : 'Porteras'}
        </h2>
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Posición</th>
              <th className="px-4 py-2 text-left">Lesionada</th>
              <th className="px-4 py-2 text-left">Carga %</th>
              <th className="px-4 py-2 text-left">Wellness</th>
              <th className="px-4 py-2 text-left">Estado de ánimo</th>
              <th className="px-4 py-2 text-left">Último Wellness</th>
              <th className="px-4 py-2 text-left">Último Carga</th>
              <th className="px-4 py-2 text-left">Formularios hoy</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => {
              const isInjured = player.lastWellness?.is_injured ?? false;
              return (
                <tr
                  key={player.id}
                  className={`border-t ${isInjured ? 'bg-red-100 animate-pulse' : ''}`}
                >
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2">{player.position}</td>
                  <td className="px-4 py-2 text-center">{isInjured ? '✔' : '✖'}</td>
                  <td className="px-4 py-2">
                    <button
                      className={`px-2 py-1 rounded font-bold ${
                        player.loadScore > 70
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-green-500 text-white'
                      }`}
                      onClick={() => openModal(player, 'load')}
                    >
                      {player.loadScore}%
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="px-2 py-1 rounded bg-blue-500 text-white "
                      onClick={() => openModal(player, 'wellness')}
                    >
                      Ver
                    </button>
                  </td>
                  <td
                    className={`px-4 py-2 font-bold uppercase ${
                      ['triste', 'irritable', 'frustrada', 'cambios_de_humor'].includes(
                        player.mood || '',
                      )
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {player.mood ?? '-'}
                  </td>
                  <td>{player.lastWellness?.date ?? '-'}</td>
                  <td>{player.lastLoad?.date ?? '-'}</td>
                  <td className="px-4 py-2 text-center">
                    {player.formsToday === 2 ? (
                      <span className="text-green-600 font-bold">✅</span>
                    ) : (
                      <img
                        src="/logos/cross.png" // ❌ imagen de cruz
                        alt="No completado"
                        className="w-5 h-5 inline-block"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={closeModal} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="flex items-center justify-center min-h-screen p-4">
          <Dialog.Panel className="bg-white rounded max-w-md w-full p-6 z-20">
            <Dialog.Title className="text-xl font-bold mb-4">
              {modalType === 'wellness' ? 'Wellness' : 'Carga'} - {modalContent?.name}
            </Dialog.Title>

            {modalContent ? (
              modalType === 'wellness' ? (
                modalContent.lastWellness ? (
                  <div className="bg-white p-4 rounded-xl shadow-md space-y-4 w-full max-w-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Último registro de wellness
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between p-2 rounded-md bg-red-100">
                        <span className="font-medium text-gray-800">Nivel de Fatiga:</span>
                        <span className="font-bold text-red-600">
                          {modalContent.lastWellness.fatigue_level}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-md bg-yellow-100">
                        <span className="font-medium text-gray-800">Nivel de Cansancio:</span>
                        <span className="font-bold text-yellow-600">
                          {modalContent.lastWellness.tiredness_level}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-md bg-pink-100">
                        <span className="font-medium text-gray-800">Nivel de Estrés:</span>
                        <span className="font-bold text-pink-600">
                          {modalContent.lastWellness.stress_level}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-md bg-purple-100">
                        <span className="font-medium text-gray-800">Estado de ánimo:</span>
                        <span className="font-bold text-purple-600 capitalize">
                          {modalContent.lastWellness.mood}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-md bg-green-100">
                        <span className="font-medium text-gray-800">Horas de sueño:</span>
                        <span className="font-bold text-green-600">
                          {modalContent.lastWellness.sleep_hours}
                        </span>
                      </div>

                      <div className="flex justify-between p-2 rounded-md bg-gray-200">
                        <span className="font-medium text-gray-800">¿Lesionada?</span>
                        <span
                          className={`font-bold ${modalContent.lastWellness.is_injured ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {modalContent.lastWellness.is_injured ? 'Sí' : 'No'}
                        </span>
                      </div>

                      {modalContent.lastWellness.injury_details && (
                        <div className="flex justify-between p-2 rounded-md bg-red-50 col-span-2">
                          <span className="font-medium text-gray-800">Detalles de lesión:</span>
                          <span className="font-semibold text-gray-800">
                            {modalContent.lastWellness.injury_details}
                          </span>
                        </div>
                      )}

                      {modalContent.lastWellness.menstrual_phase && (
                        <div className="flex justify-between p-2 rounded-md bg-pink-50 col-span-2">
                          <span className="font-medium text-gray-800">
                            Fase del ciclo menstrual:
                          </span>
                          <span className="font-semibold text-gray-800">
                            {modalContent.lastWellness.menstrual_phase}
                          </span>
                        </div>
                      )}

                      {modalContent.lastWellness.discomfort && (
                        <div className="flex justify-between p-2 rounded-md bg-yellow-50 col-span-2">
                          <span className="font-medium text-gray-800">Molestias:</span>
                          <span className="font-semibold text-gray-800">
                            {modalContent.lastWellness.discomfort}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>No hay datos de Wellness</p>
                )
              ) : modalContent.lastLoad ? (
                <div className="bg-white p-4 rounded-xl shadow-md space-y-4 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Última sesión</h3>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">RPE:</span>
                    <span className="font-bold text-green-600">{modalContent.lastLoad.rpe}</span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Molestia Grupos Musculares:</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {Object.entries(modalContent.lastLoad.muscle_pain).map(([muscle, value]) => (
                        <div
                          key={muscle}
                          className={`flex justify-between px-2 py-1 rounded-md ${
                            muscle === 'otras'
                              ? 'bg-gray-100 text-gray-800' // sin color de intensidad
                              : value >= 7
                                ? 'bg-red-100 text-red-700'
                                : value >= 4
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <span className="capitalize">{muscle.replace('_', ' ')}:</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>No hay datos de Carga</p>
              )
            ) : (
              <p>No hay datos disponibles</p>
            )}

            <button className="mt-4 px-3 py-1 bg-gray-500 text-white rounded" onClick={closeModal}>
              Cerrar
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
