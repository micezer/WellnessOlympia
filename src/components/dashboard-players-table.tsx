'use client';

import { Player } from '@/types/player';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function DashboardPlayersTable({ players }: { players: Player[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Foto</TableHead>
          <TableHead>Jugadora</TableHead>
          <TableHead>% Carga</TableHead>
          <TableHead>Último RPE</TableHead>
          <TableHead>Último Wellness</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => (
          <TableRow key={player.id}>
            <TableCell>
              <Avatar className="h-9 w-9">
                <AvatarImage src={player.picture} alt={`${player.firstname} ${player.lastname}`} />
                <AvatarFallback>{player.firstname[0]}</AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell>
              {player.firstname} {player.lastname}
            </TableCell>
            <TableCell>{player.load_percentage}%</TableCell>
            <TableCell>{player.last_rpe_date}</TableCell>
            <TableCell>{player.last_wellness_date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
