'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { PlayerShell } from './player-shell';
import { buttonClass } from './button';

const RETURN_AFTER_MS = 2500;

// Confirmación tras enviar un formulario; vuelve sola al inicio
export function FormSubmitted({ message }: { message: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/player/welcome'), RETURN_AFTER_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <PlayerShell className="flex flex-col items-center justify-center text-center">
      <CheckCircle2 className="w-20 h-20 text-brand mb-4" />
      <h1 className="text-3xl font-bold mb-2">Formulario enviado</h1>
      <p className="text-gray-300 mb-8">{message}</p>
      <Link href="/player/welcome" replace className={buttonClass('primary', 'w-full max-w-xs')}>
        Volver al inicio
      </Link>
    </PlayerShell>
  );
}
