'use client';
// Cambiar contraseña para coach y admin (tema claro, en un diálogo)
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChangePasswordForm, PASSWORD_CHANGED_MESSAGE } from '@/components/brand/change-password';

export function ChangePasswordDialog({
  identifier,
  open,
  onOpenChange,
}: {
  identifier: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [done, setDone] = useState(false);
  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) setDone(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            {done ? PASSWORD_CHANGED_MESSAGE : 'Los demás dispositivos tendrán que entrar de nuevo.'}
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <button
            onClick={() => handleOpenChange(false)}
            className="w-full rounded-lg border px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        ) : (
          <ChangePasswordForm identifier={identifier} variant="light" onDone={() => setDone(true)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
