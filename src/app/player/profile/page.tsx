import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Image from 'next/image';
import { db } from '@/db/db';
import { players, player_wellness } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

export const metadata = {
  title: 'Perfil de Jugadora',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
};

export default async function PlayerProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('user_token')?.value;

  if (!token) redirect('/login');

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { identifier: string; role: string };

    if (decoded.role !== 'player') redirect('/coach/choose-team');

    // Obtener información del jugador
    const playerData = await db
      .select()
      .from(players)
      .where(eq(players.identifier, decoded.identifier));

    if (!playerData.length) redirect('/login');

    const player = playerData[0];

    // Calcular edad desde birth_date
    const birthDate = player.birth_date ? new Date(player.birth_date) : null;
    let age: number | string = '—';
    if (birthDate) {
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const hasHadBirthdayThisYear =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
      if (!hasHadBirthdayThisYear) age -= 1;
    }

    // Obtener último formulario wellness
    const lastWellness = await db
      .select()
      .from(player_wellness)
      .where(eq(player_wellness.player_id, player.id))
      .orderBy(desc(player_wellness.date))
      .limit(1);

    const latest = lastWellness[0];

    const currentLoad = latest?.fatigue_level ?? 0;
    const isInjured = latest?.is_injured ?? false;
    const mood = latest?.mood ?? '—';

    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'rgb(33, 37, 41)' }}
      >
        <div
          className="shadow-lg rounded-3xl p-8 max-w-md w-full border border-gray-700"
          style={{ backgroundColor: 'rgb(55, 60, 65)', color: 'white' }}
        >
          <h1 className="text-3xl font-extrabold text-center mb-6 text-white">
            Perfil de Jugadora
          </h1>

          {/* Foto */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 relative rounded-full overflow-hidden border-4 border-gray-500 shadow-md">
              <Image
                src={player.picture || '/default-player.png'}
                alt={`${player.firstname} ${player.lastname}`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Información */}
          <div className="space-y-3 text-gray-200 text-base">
            <p>
              <span className="font-semibold text-white">Nombre completo:</span> {player.firstname}{' '}
              {player.lastname}
            </p>
            <p>
              <span className="font-semibold text-white">Edad:</span> {age}
            </p>
            <p>
              <span className="font-semibold text-white">Posición:</span> {player.position ?? '—'}
            </p>
            <p>
              <span className="font-semibold text-white">Equipo:</span> {player.team ?? '—'}
            </p>
            <p>
              <span className="font-semibold text-white">Carga actual:</span>{' '}
              <span className="text-green-400 font-medium">{currentLoad}</span>
            </p>
            <p>
              <span className="font-semibold text-white">Estado físico:</span>{' '}
              {isInjured ? (
                <span className="text-red-400 font-semibold">Lesionada</span>
              ) : (
                <span className="text-green-400 font-semibold">Apta</span>
              )}
            </p>
            <p>
              <span className="font-semibold text-white">Estado de ánimo:</span> {mood}
            </p>
          </div>

          {/* Botón volver */}
          <div className="mt-8 text-center">
            <a
              href="/player/welcome"
              className="px-5 py-3 font-semibold text-black rounded-lg shadow-md transition"
              style={{
                backgroundColor: 'rgb(0, 255, 127)',
                boxShadow: '0 4px 10px rgba(0, 255, 127, 0.3)',
              }}
            >
              Volver
            </a>
          </div>
        </div>
      </main>
    );
  } catch (err) {
    console.error('❌ Token inválido o expirado:', err);
    redirect('/login');
  }
}
