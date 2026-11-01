// Código propio del service worker. next-pwa lo compila y lo añade a public/sw.js en cada build.

// Notificación push recibida: siempre se muestra (iOS y Chrome lo exigen)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Wellness Olympia', {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag, // misma etiqueta = sustituye a la anterior en vez de acumularse
      data: { url: data.url || '/' },
    }),
  );
});

// Al tocar la notificación: reutiliza una ventana abierta de la app o abre una nueva
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const appWindow = windows.find((w) => w.url.startsWith(self.location.origin));
      if (appWindow) return appWindow.focus().then((w) => (w || appWindow).navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
