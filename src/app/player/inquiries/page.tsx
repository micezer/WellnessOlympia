'use client';
import { useState } from 'react';
import { PlayerShell } from '@/components/brand/player-shell';
import { InquiryList, NewInquiryForm } from '@/components/inquiries';

export default function PlayerInquiriesPage() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <PlayerShell title="Consultas" backHref="/player/profile">
      <p className="text-sm text-gray-400 mb-4">
        Escribe al club cualquier duda, sugerencia o problema. Te avisaremos cuando te respondan.
      </p>
      <NewInquiryForm
        variant="dark"
        anonymousLabel="Enviar de forma anónima"
        onCreated={() => setReloadKey((k) => k + 1)}
      />
      <div className="mt-6">
        <InquiryList variant="dark" basePath="/player/inquiries" reloadKey={reloadKey} />
      </div>
    </PlayerShell>
  );
}
