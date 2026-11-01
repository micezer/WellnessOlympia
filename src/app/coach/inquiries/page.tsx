'use client';
import { useState } from 'react';
import { InquiryList, NewInquiryForm } from '@/components/inquiries';

export default function CoachInquiriesPage() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
        <p className="text-sm text-gray-500">Escribe al administrador. Te avisaremos cuando responda.</p>
      </div>
      <NewInquiryForm
        variant="light"
        anonymousLabel="Enviar de forma anónima"
        onCreated={() => setReloadKey((k) => k + 1)}
      />
      <InquiryList variant="light" basePath="/coach/inquiries" reloadKey={reloadKey} />
    </div>
  );
}
