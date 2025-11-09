'use client';
import { useState } from 'react';
import { Modal, Button, Table, Image, ProgressBar } from 'react-bootstrap';

export type Player = {
  id: number;
  firstname: string;
  lastname: string;
  age: number;
  position: string;
  injured: boolean;
  team: string;
  picture?: string;
  load_percentage?: number;
  last_rpe_date?: string | null;
  last_wellness_date?: string | null;
};

export function PlayersTable({ players }: { players: Player[] }) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <>
      <Table striped bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Edad</th>
            <th>Posición</th>
            <th>Equipo</th>
            <th>Lesionada</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <Image
                  src={player.picture || '/globe.svg'}
                  alt={`${player.firstname} ${player.lastname}`}
                  roundedCircle
                  width={40}
                  height={40}
                />
              </td>
              <td>
                {player.firstname} {player.lastname}
              </td>
              <td>{player.age}</td>
              <td>{player.position}</td>
              <td>{player.team}</td>
              <td>{player.injured ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal de detalle */}
      <Modal show={!!selectedPlayer} onHide={() => setSelectedPlayer(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedPlayer?.firstname} {selectedPlayer?.lastname}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlayer && (
            <div>
              <p>
                <strong>Edad:</strong> {selectedPlayer.age}
              </p>
              <p>
                <strong>Posición:</strong> {selectedPlayer.position}
              </p>
              <p>
                <strong>Equipo:</strong> {selectedPlayer.team}
              </p>
              <p>
                <strong>Lesionada:</strong> {selectedPlayer.injured ? 'Sí' : 'No'}
              </p>
              <p>
                <strong>Carga (%):</strong>
              </p>
              <ProgressBar
                now={selectedPlayer.load_percentage || 0}
                label={`${selectedPlayer.load_percentage || 0}%`}
              />
              <p>
                <strong>Último RPE:</strong> {selectedPlayer.last_rpe_date || 'N/A'}
              </p>
              <p>
                <strong>Último Wellness:</strong> {selectedPlayer.last_wellness_date || 'N/A'}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedPlayer(null)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
