import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth';
import { sendToUser } from '@/lib/push';

// Notificación de prueba a todos los dispositivos del usuario actual
export async function POST() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const delivered = await sendToUser(session.role, session.user.id, {
      title: 'Notificación de prueba 🔔',
      body: '¡Funciona! Así te llegarán los avisos de Wellness Olympia.',
      tag: `test-${Date.now()}`, // etiqueta nueva cada vez: con la misma, el sistema la sustituye sin avisar
    });
    if (!delivered)
      return NextResponse.json(
        { error: 'No se pudo enviar a ningún dispositivo. Desactiva y vuelve a activar las notificaciones.' },
        { status: 404 },
      );
    return NextResponse.json({ delivered });
  } catch (err) {
    console.error('❌ Error en push de prueba:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
