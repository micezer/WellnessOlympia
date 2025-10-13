import Image from 'next/image';
import { title } from 'process';
import { MetricCards, type Metric } from '../components/metric-cards';
import { PlayersTable, type Player } from '@/components/players-table';
import { Users, CircleAlert, ClipboardCheck, BedSingle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const metrics: Metric[] = [
  {
    title: 'Carga total semanal',
    value: '8,420 AU',
    change: '+5.2% vs semana anterior',
    icon: <Users className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: 'Nivel promedio de wellness',
    value: '7.8 / 10',
    change: '↓ 0.3 puntos',
    icon: '🌙',
  },
  {
    title: 'Jugadoras en riesgo de sobrecarga',
    value: '3',
    change: '+1 desde ayer',
    icon: <CircleAlert className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: 'Fatiga promedio',
    value: '6.1 / 10',
    change: '↑ 0.8 puntos',
    icon: '🔥',
  },
  {
    title: 'Dormido promedio',
    value: '7.2 h',
    change: '↑ 0.5h vs media semanal',
    icon: <BedSingle className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: 'Jugadoras activas hoy',
    value: '18 / 22',
    change: '+2 desde ayer',
    icon: <ClipboardCheck className="h-4 w-4 text-muted-foreground" />,
  },
];

const players: Player[] = [
  // 🧤 PORTERAS
  { id: '1', firstName: 'Andrea', lastName: 'Andrea', age: 21, position: 'Portera' },
  { id: '2', firstName: 'Laura', lastName: 'Laura', age: 22, position: 'Portera' },

  // 🛡️ DEFENSAS
  { id: '3', firstName: 'Tamara', lastName: 'Tamara', age: 23, position: 'Defensa' },
  { id: '4', firstName: 'A.', lastName: 'Totana', age: 25, position: 'Defensa' },
  { id: '5', firstName: 'Masa', lastName: 'Masa', age: 24, position: 'Defensa' },
  { id: '6', firstName: 'Elisa', lastName: 'Elisa', age: 26, position: 'Defensa' },
  { id: '7', firstName: 'Ana', lastName: 'Ana', age: 23, position: 'Defensa' },
  { id: '8', firstName: 'Alfayate', lastName: 'Alfayate', age: 27, position: 'Defensa' },
  { id: '9', firstName: 'Laura', lastName: 'González', age: 22, position: 'Defensa' },

  // ⚙️ CENTROCAMPISTAS
  { id: '10', firstName: 'Gema', lastName: 'Prieto', age: 24, position: 'Centrocampista' },
  { id: '11', firstName: 'Marta', lastName: 'Moreno', age: 25, position: 'Centrocampista' },
  { id: '12', firstName: 'C.', lastName: 'Rincón', age: 23, position: 'Centrocampista' },
  { id: '13', firstName: 'Yoli', lastName: 'Yoli', age: 26, position: 'Centrocampista' },
  { id: '14', firstName: 'Rosita', lastName: 'Rosita', age: 22, position: 'Centrocampista' },
  { id: '15', firstName: 'Ainara', lastName: 'Ainara', age: 24, position: 'Centrocampista' },
  { id: '16', firstName: 'Marina', lastName: 'Marina', age: 25, position: 'Centrocampista' },
  { id: '17', firstName: 'María', lastName: 'Herrero', age: 23, position: 'Centrocampista' },

  // 🎯 DELANTERAS
  { id: '18', firstName: 'Rocio', lastName: 'Zafra', age: 24, position: 'Delantera' },
  { id: '19', firstName: 'M.', lastName: 'Bravo', age: 22, position: 'Delantera' },
  { id: '20', firstName: 'Belén', lastName: 'Belén', age: 26, position: 'Delantera' },
  { id: '21', firstName: 'L.', lastName: 'Viñas', age: 23, position: 'Delantera' },
  { id: '22', firstName: 'Clara', lastName: 'Clara', age: 21, position: 'Delantera' },
  { id: '23', firstName: 'Lucía', lastName: 'Sánchez', age: 25, position: 'Delantera' },
  { id: '24', firstName: 'Iratxe', lastName: 'Iratxe', age: 24, position: 'Delantera' },
  { id: '25', firstName: 'S.', lastName: 'Sánchez', age: 22, position: 'Delantera' },
  { id: '26', firstName: 'Lucía', lastName: 'Lucía', age: 23, position: 'Delantera' },
];

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>
      <MetricCards metrics={metrics} />

      <div>
        <PlayersTable players={players} />
      </div>
    </main>
  );
}
