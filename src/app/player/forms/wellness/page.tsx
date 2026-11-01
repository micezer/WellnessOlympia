'use client';
import { useEffect, useState } from 'react';
import { formatDateRelative } from '@/lib/time-utils';
import {
  MOODS,
  MOOD_LABELS,
  MENSTRUAL_PHASES,
  MENSTRUAL_PHASE_LABELS,
} from '@/lib/forms';
import { PlayerShell } from '@/components/brand/player-shell';
import { Button } from '@/components/brand/button';
import { ChipGroup, Field, ScaleInput, Stepper, textareaClass } from '@/components/brand/fields';
import { FormSubmitted } from '@/components/brand/form-submitted';

type Mood = (typeof MOODS)[number];
type Phase = (typeof MENSTRUAL_PHASES)[number];

type WellnessData = {
  fatigue_level: number;
  tiredness_level: number;
  stress_level: number;
  sleep_hours: number | null;
  mood: Mood | '';
  menstrual_phase: Phase | '';
  discomfort: string;
  injured: 'si' | 'no';
  injury_detail: string;
};

const MOOD_OPTIONS = MOODS.map((value) => ({ value, label: MOOD_LABELS[value] }));
const PHASE_OPTIONS = MENSTRUAL_PHASES.map((value) => ({
  value,
  label: MENSTRUAL_PHASE_LABELS[value],
}));
const INJURED_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'si', label: 'Sí' },
] as const;

const LEVELS = [
  { key: 'fatigue_level', label: 'Nivel de fatiga' },
  { key: 'tiredness_level', label: 'Nivel de cansancio' },
  { key: 'stress_level', label: 'Nivel de estrés' },
] as const;

export default function WellnessFormPage() {
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<WellnessData>({
    fatigue_level: 1,
    tiredness_level: 1,
    stress_level: 1,
    sleep_hours: null,
    mood: '',
    menstrual_phase: '',
    discomfort: '',
    injured: 'no',
    injury_detail: '',
  });

  const update = (changes: Partial<WellnessData>) => {
    setError('');
    setFormData((prev) => ({ ...prev, ...changes }));
  };

  useEffect(() => {
    fetch('/api/player/forms/wellness', { method: 'GET', credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setLastDate(data.wellness ?? null))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing = [
      !formData.mood && 'estado de ánimo',
      formData.sleep_hours === null && 'horas de sueño',
      formData.injured === 'si' && !formData.injury_detail.trim() && 'detalle de la lesión',
      !formData.menstrual_phase && 'fase del ciclo',
    ].filter(Boolean);
    if (missing.length) return setError(`Falta: ${missing.join(', ')}`);

    setSending(true);
    try {
      const res = await fetch('/api/player/forms/wellness', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fatigue_level: formData.fatigue_level,
          tiredness_level: formData.tiredness_level,
          stress_level: formData.stress_level,
          mood: formData.mood,
          sleep_hours: formData.sleep_hours,
          is_injured: formData.injured === 'si',
          injury_details: formData.injured === 'si' ? formData.injury_detail : null,
          menstrual_phase: formData.menstrual_phase,
          discomfort: formData.discomfort,
        }),
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
    return <FormSubmitted message="¡Gracias por registrar tu estado de bienestar!" />;

  return (
    <PlayerShell
      title="Wellness"
      backHref="/player/welcome"
      footer={
        <>
          {error && (
            <p role="alert" className="text-red-400 text-sm mb-2 text-center">
              {error}
            </p>
          )}
          <Button type="submit" form="wellness-form" loading={sending} className="w-full">
            Enviar
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-400 mb-4">Último registro: {formatDateRelative(lastDate)}</p>

      <form id="wellness-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {LEVELS.map(({ key, label }) => (
          <Field key={key} label={label} required>
            <ScaleInput
              value={formData[key]}
              onChange={(value) => update({ [key]: value })}
              minLabel="1 · Nada"
              maxLabel="10 · Máximo"
              ariaLabel={label}
            />
          </Field>
        ))}

        <Field label="Estado de ánimo" required>
          <ChipGroup options={MOOD_OPTIONS} value={formData.mood} onChange={(mood) => update({ mood })} />
        </Field>

        <Field label="Horas de sueño" required hint="Horas que dormiste anoche">
          <Stepper
            value={formData.sleep_hours}
            onChange={(sleep_hours) => update({ sleep_hours })}
            min={0}
            max={24}
            start={8}
            unit="h"
          />
        </Field>

        <Field label="¿Estás lesionada actualmente?" required>
          <ChipGroup
            options={INJURED_OPTIONS}
            value={formData.injured}
            onChange={(injured) => update({ injured })}
          />
          {formData.injured === 'si' && (
            <textarea
              rows={2}
              placeholder="Indica la lesión..."
              value={formData.injury_detail}
              onChange={(e) => update({ injury_detail: e.target.value })}
              className={`${textareaClass} mt-3`}
              maxLength={500}
            />
          )}
        </Field>

        <Field label="Fase del ciclo menstrual" required>
          <ChipGroup
            options={PHASE_OPTIONS}
            value={formData.menstrual_phase}
            onChange={(menstrual_phase) => update({ menstrual_phase })}
          />
        </Field>

        <Field label="Molestia o carga" hint="Opcional">
          <textarea
            rows={3}
            placeholder="Describe cualquier molestia o carga..."
            value={formData.discomfort}
            onChange={(e) => update({ discomfort: e.target.value })}
            className={textareaClass}
            maxLength={500}
          />
        </Field>
      </form>
    </PlayerShell>
  );
}
