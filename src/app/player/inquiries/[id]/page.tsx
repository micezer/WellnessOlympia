'use client';
import { useParams } from 'next/navigation';
import { PlayerShell } from '@/components/brand/player-shell';
import { InquiryThread } from '@/components/inquiries';

export default function PlayerInquiryPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <PlayerShell title="Consulta" backHref="/player/inquiries">
      <InquiryThread variant="dark" id={Number(id)} isAdmin={false} />
    </PlayerShell>
  );
}
