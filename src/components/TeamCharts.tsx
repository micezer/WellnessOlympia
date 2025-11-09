// src/components/TeamCharts.tsx
'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Player = {
  id: number;
  firstname: string;
  lastname: string;
  team: string;
  load_percentage: number;
  last_wellness_percentage: number;
  rpe: number; // valor de 0 a 10
};

type TeamChartsProps = {
  players: Player[];
};

const COLORS = ['#0088FE', '#00C49F'];

export function TeamCharts({ players }: TeamChartsProps) {
  // Cálculo de porcentajes de carga y wellness
  const avgLoad =
    players.reduce((acc, p) => acc + (p.load_percentage || 0), 0) / (players.length || 1);
  const avgWellness =
    players.reduce((acc, p) => acc + (p.last_wellness_percentage || 0), 0) / (players.length || 1);

  const loadData = [
    { name: 'Carga', value: avgLoad },
    { name: 'Resto', value: 100 - avgLoad },
  ];

  const wellnessData = [
    { name: 'Wellness', value: avgWellness },
    { name: 'Resto', value: 100 - avgWellness },
  ];

  // Datos RPE (0 a 10)
  const rpeZones = Array.from({ length: 11 }, (_, i) => i);
  const rpeData = rpeZones.map((zone) => {
    const count = players.filter((p) => p.rpe === zone).length;
    const percentage = (count / (players.length || 1)) * 100;
    return { zone, percentage };
  });

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-around flex-wrap mb-4">
        <div style={{ width: 200, height: 200 }}>
          <h6 className="text-center">Carga general (%)</h6>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={loadData}
                dataKey="value"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
              >
                {loadData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: 200, height: 200 }}>
          <h6 className="text-center">Wellness (%)</h6>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={wellnessData}
                dataKey="value"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
              >
                {wellnessData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <h6 className="text-center">RPE (%)</h6>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rpeData}>
            <XAxis dataKey="zone" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="percentage" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
