'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { InquiryThread } from '@/components/inquiries';

export default function CoachInquiryPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
      <Link href="/coach/inquiries" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ChevronLeft className="w-4 h-4" /> Consultas
      </Link>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <InquiryThread variant="light" id={Number(id)} isAdmin={false} />
      </div>
    </div>
  );
}
