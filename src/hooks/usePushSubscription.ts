'use client';
import { useCallback, useEffect, useState } from 'react';

// unsupported: navegador sin push (o iPhone sin la app instalada / iOS < 16.4)
// denied: el usuario bloqueó las notificaciones (solo se puede cambiar en ajustes del sistema)
export type PushState = 'loading' | 'unsupported' | 'denied' | 'off' | 'on';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

function isSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY
  );
}

// La clave pública VAPID viene en base64url; PushManager la quiere en bytes
function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const SW_READY_TIMEOUT_MS = 10000;

// serviceWorker.ready no termina nunca si no hay service worker: se corta con un timeout
function swReady(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Service worker no disponible')), SW_READY_TIMEOUT_MS),
    ),
  ]);
}

async function getSubscription() {
  const registration = await swReady();
  return registration.pushManager.getSubscription();
}

const saveSubscription = (subscription: PushSubscription) =>
  fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

const deleteOnServer = (endpoint: string) =>
  fetch('/api/push/subscribe', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });

// Al cerrar sesión: esta cuenta deja de recibir avisos en este dispositivo, pero el dispositivo
// sigue suscrito, así que al volver a entrar (esta u otra cuenta) se reactiva sin pedir nada.
// Hay que llamarla ANTES de /api/logout (el servidor necesita la sesión para borrarla).
export async function detachPushSubscription() {
  try {
    if (!isSupported()) return;
    const subscription = await getSubscription();
    if (subscription) await deleteOnServer(subscription.endpoint);
  } catch (err) {
    console.error('Error quitando la suscripción push:', err);
  }
}

// Desactivar a mano: además se da de baja el dispositivo (no se reactiva al volver a entrar)
async function removePushSubscription() {
  try {
    if (!isSupported()) return;
    const subscription = await getSubscription();
    if (!subscription) return;
    await deleteOnServer(subscription.endpoint);
    await subscription.unsubscribe();
  } catch (err) {
    console.error('Error quitando la suscripción push:', err);
  }
}

export function usePushSubscription() {
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Estado inicial; si ya estaba suscrito, se vuelve a enviar al servidor (por si cambió de cuenta)
  useEffect(() => {
    if (!isSupported()) return setState('unsupported');
    if (Notification.permission === 'denied') return setState('denied');
    getSubscription()
      .then((subscription) => {
        if (subscription && Notification.permission === 'granted') {
          setState('on');
          saveSubscription(subscription).catch(() => {});
        } else setState('off');
      })
      .catch(() => setState('unsupported'));
  }, []);

  // Debe llamarse desde un toque del usuario (iOS no deja pedir permiso de otra forma)
  const enable = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return false;
      }
      const registration = await swReady();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
        }));
      const res = await saveSubscription(subscription);
      if (!res.ok) throw new Error('No se pudo guardar');
      setState('on');
      return true;
    } catch (err) {
      console.error('Error activando notificaciones:', err);
      setError('No se pudieron activar las notificaciones');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setError('');
    await removePushSubscription();
    setState('off');
    setBusy(false);
  }, []);

  const sendTest = useCallback(async () => {
    setError('');
    const res = await fetch('/api/push/test', { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo enviar la prueba');
    }
  }, []);

  return { state, busy, error, enable, disable, sendTest };
}
