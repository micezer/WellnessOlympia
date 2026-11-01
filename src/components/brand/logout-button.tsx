'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from './button';
import { detachPushSubscription } from '@/hooks/usePushSubscription';

// Cerrar sesión con confirmación (tema oscuro)
export function LogoutButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await detachPushSubscription();
      const res = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) return router.replace('/');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
    setLoggingOut(false);
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setConfirming(true)} className="w-full text-red-400">
        <LogOut className="w-5 h-5" /> Cerrar sesión
      </Button>

      {confirming && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-ink-800 p-6 rounded-2xl shadow-lg w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-2">Cerrar sesión</h2>
            <p className="text-gray-300 mb-6">¿Estás segura de que quieres cerrar sesión?</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirming(false)}
                disabled={loggingOut}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleLogout} loading={loggingOut} className="flex-1">
                Salir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
