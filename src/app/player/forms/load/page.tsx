'use client';
import { useEffect, useState } from 'react';
import { formatDateRelative } from '@/lib/time-utils';
import { MUSCLES, MUSCLE_LABELS, type MusclePain } from '@/lib/forms';
import { PlayerShell } from '@/components/brand/player-shell';
import { Button } from '@/components/brand/button';
import { Field, ScaleInput, textareaClass } from '@/components/brand/fields';
import { FormSubmitted } from '@/components/brand/form-submitted';

type LoadData = {
  rpe: number;
  musclePain: MusclePain;
};

const initialPain = {
  ...Object.fromEntries(MUSCLES.map((muscle) => [muscle, 1])),
  otras: '',
} as MusclePain;

export default function LoadFormPage() {
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<LoadData>({ rpe: 1, musclePain: initialPain });

  useEffect(() => {
    fetch('/api/player/forms/load', { method: 'GET', credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setLastDate(data.load ?? null))
      .catch(() => {});
  }, []);

  const handlePainChange = (muscle: keyof MusclePain, value: number | string) => {
    setError('');
    setFormData((prev) => ({ ...prev, musclePain: { ...prev.musclePain, [muscle]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/player/forms/load', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) return setSubmitted(true);
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Error al enviar');
    } catch {
      setError('Sin conexión. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (submitted)
    return <FormSubmitted message="¡Gracias por completar tu cuestionario de carga!" />;

  return (
    <PlayerShell
      title="Carga de entrenamiento"
      backHref="/player/welcome"
      footer={
        <>
          {error && (
            <p role="alert" className="text-red-400 text-sm mb-2 text-center">
              {error}
            </p>
          )}
          <Button type="submit" form="load-form" loading={sending} className="w-full">
            Enviar
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-400 mb-4">Último registro: {formatDateRelative(lastDate)}</p>

      <form id="load-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="RPE · Esfuerzo percibido" required hint="¿Cómo de duro ha sido el entrenamiento?">
          <ScaleInput
            value={formData.rpe}
            onChange={(rpe) => {
              setError('');
              setFormData((prev) => ({ ...prev, rpe }));
            }}
            minLabel="1 · Muy suave"
            maxLabel="10 · Máximo"
            ariaLabel="RPE"
          />
        </Field>

        <Field label="Dolor o molestia por zona" required hint="1 = sin molestia · 10 = dolor máximo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {MUSCLES.map((muscle) => (
              <div key={muscle}>
                <p className="text-sm text-gray-200 mb-1">{MUSCLE_LABELS[muscle]}</p>
                <ScaleInput
                  value={formData.musclePain[muscle]}
                  onChange={(value) => handlePainChange(muscle, value)}
                  compact
                  ariaLabel={MUSCLE_LABELS[muscle]}
                />
              </div>
            ))}
          </div>
        </Field>

        <Field label="Otras molestias" hint="Opcional">
          <textarea
            rows={3}
            placeholder="Describe otras molestias o zonas afectadas..."
            value={formData.musclePain.otras}
            onChange={(e) => handlePainChange('otras', e.target.value)}
            className={textareaClass}
            maxLength={500}
          />
        </Field>
      </form>
    </PlayerShell>
  );
}
