'use client';
// "Editar perfil": apodo, dorsal, color del avatar y fecha de nacimiento
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil, X } from 'lucide-react';
import { AVATAR_COLORS, NICKNAME_MAX } from '@/lib/forms';
import { getSpainDateString } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { Avatar } from './avatar';
import { Button } from './button';

type Profile = {
  firstname: string;
  lastname: string;
  nickname: string | null;
  shirt_number: number | null;
  avatar_color: string | null;
  birth_date: string | null;
};

const inputClass =
  'w-full rounded-xl border border-ink-600 bg-ink-950 text-white px-3 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand';

export function ProfileEdit({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname ?? '');
  const [shirt, setShirt] = useState(profile.shirt_number?.toString() ?? '');
  const [color, setColor] = useState<string | null>(profile.avatar_color);
  const [birthDate, setBirthDate] = useState(profile.birth_date ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    const shirtNumber = shirt.trim() === '' ? null : Number(shirt);
    if (shirtNumber !== null && (!Number.isInteger(shirtNumber) || shirtNumber < 1 || shirtNumber > 99))
      return setError('El dorsal debe ser un número entre 1 y 99');

    setSaving(true);
    try {
      const res = await fetch('/api/player/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          shirt_number: shirtNumber,
          avatar_color: color,
          ...(birthDate ? { birth_date: birthDate } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data.error || 'No se pudo guardar');
      }
      setOpen(false);
      router.refresh(); // vuelve a pintar el perfil (componente de servidor) con los datos nuevos
    } catch {
      setError('Sin conexión. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="min-h-10 px-4 text-sm">
        <Pencil className="w-4 h-4" /> Editar perfil
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div
            className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-ink-800 rounded-t-3xl sm:rounded-3xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-white text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Editar perfil</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ink-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vista previa del avatar */}
            <div className="flex justify-center mb-5">
              <Avatar firstname={profile.firstname} lastname={profile.lastname} color={color} size="lg" />
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">¿Cómo quieres que te llamemos?</span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={NICKNAME_MAX}
                  placeholder={profile.firstname}
                  className={`${inputClass} mt-1`}
                />
                <span className="text-xs text-gray-400">Apodo (opcional). Lo verá también tu entrenador.</span>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Dorsal</span>
                <input
                  value={shirt}
                  onChange={(e) => setShirt(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  inputMode="numeric"
                  placeholder="Ej. 10"
                  className={`${inputClass} mt-1`}
                />
              </label>

              <div>
                <span className="text-sm font-medium">Color del avatar</span>
                <div className="grid grid-cols-8 gap-2 mt-2" role="radiogroup">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={color === c}
                      aria-label={`Color ${c}`}
                      onClick={() => setColor(c)}
                      className={cn(
                        'aspect-square rounded-full flex items-center justify-center ring-offset-2 ring-offset-ink-800 transition',
                        color === c && 'ring-2 ring-white',
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Fecha de nacimiento</span>
                <input
                  type="date"
                  value={birthDate}
                  max={getSpainDateString()}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-3 mt-1 bg-white text-black"
                />
              </label>
            </div>

            {error && <p role="alert" className="text-sm text-red-400 mt-4">{error}</p>}

            <Button onClick={save} loading={saving} className="w-full mt-5">
              Guardar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
