import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

export type Player = {
  id: string; // unique ID (UUID or DB id)
  firstName: string;
  lastName: string;
  age?: number;
  position?: string; // e.g., "Defensa", "Delantera"
  team?: string; // team name or teamId if multiple teams
  photoUrl?: string; // profile photo
};

export function PlayersTable({ players }: { players: Player[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Jugadora</TableHead>
          <TableHead>Edad</TableHead>
          <TableHead>Posición</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => (
          <TableRow key={player.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={'/globe.svg'}
                    alt={`${player.firstName} ${player.lastName}`}
                  ></AvatarImage>
                  <AvatarFallback>{player.firstName ? player.firstName[0] : ''}</AvatarFallback>
                </Avatar>
              </div>
            </TableCell>
            <TableCell>
              {player.firstName} {player.lastName}
            </TableCell>
            <TableCell>{player.age}</TableCell>
            <TableCell>{player.position}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
