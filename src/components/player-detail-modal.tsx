'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Player } from './players-table';
import { Progress } from '@/components/ui/progress';

export function PlayerDetailModal({ player, onClose }: { player: Player; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {player.firstname} {player.lastname}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p>
            <strong>Edad:</strong> {player.age}
          </p>
          <p>
            <strong>Posición:</strong> {player.position}
          </p>
          <p>
            <strong>Equipo:</strong> {player.team}
          </p>
          <p>
            <strong>Lesionada:</strong> {player.injured ? 'Sí' : 'No'}
          </p>
          <hr />
          <p>
            <strong>Último RPE:</strong>{' '}
            {player.last_rpe_date ? new Date(player.last_rpe_date).toLocaleDateString() : 'N/A'}
          </p>
          <p>
            <strong>Último Wellness:</strong>{' '}
            {player.last_wellness_date
              ? new Date(player.last_wellness_date).toLocaleDateString()
              : 'N/A'}
          </p>

          <div>
            <strong>Carga (%)</strong>
            <Progress value={player.load_percentage ?? 0} className="mt-1" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
