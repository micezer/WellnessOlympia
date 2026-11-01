'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { InquiryThread } from '@/components/inquiries';

export default function AdminInquiryPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-dvh bg-gray-50 px-4 py-6 md:p-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/admin?tab=consultas" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" /> Consultas
        </Link>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <InquiryThread variant="light" id={Number(id)} isAdmin />
        </div>
      </div>
    </div>
  );
}
