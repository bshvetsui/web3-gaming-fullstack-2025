'use client';

import { useState, useEffect } from 'react';
import styles from './TournamentBracket.module.css';

interface Match {
  id: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  winnerId?: string;
  score?: string;
  round: number;
  position: number;
  scheduledAt?: Date;
}

interface Tournament {
  id: string;
  name: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  maxPlayers: number;
  currentPlayers: number;
  totalRounds: number;
  matches: Match[];
}

export const TournamentBracket = ({ tournamentId }: { tournamentId: string }) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      // Mock data for 8-player tournament
      const mockTournament: Tournament = {
        id: tournamentId,
        name: 'Spring Championship 2025',
        status: 'in_progress',
        maxPlayers: 8,
        currentPlayers: 8,
        totalRounds: 3,
        matches: [
          // Round 1 (Quarterfinals)
          {
            id: 'm1',
            player1Id: 'p1',
            player1Name: 'DragonSlayer',
            player2Id: 'p2',
            player2Name: 'ShadowMage',
            winnerId: 'p1',
            score: '2-1',
            round: 1,
            position: 0,
          },
          {
            id: 'm2',
            player1Id: 'p3',
            player1Name: 'IronKnight',
            player2Id: 'p4',
            player2Name: 'StormArcher',
            winnerId: 'p3',
            score: '2-0',
            round: 1,
            position: 1,
          },
          {
            id: 'm3',
            player1Id: 'p5',
            player1Name: 'FlameWizard',
            player2Id: 'p6',
            player2Name: 'ThunderMage',
            winnerId: 'p6',
            score: '1-2',
            round: 1,
            position: 2,
          },
          {
            id: 'm4',
            player1Id: 'p7',
            player1Name: 'FrostArcher',
            player2Id: 'p8',
            player2Name: 'WindWarrior',
            winnerId: 'p7',
            score: '2-1',
            round: 1,
            position: 3,
          },
          // Round 2 (Semifinals)
          {
            id: 'm5',
            player1Id: 'p1',
            player1Name: 'DragonSlayer',
            player2Id: 'p3',
            player2Name: 'IronKnight',
            winnerId: 'p1',
            score: '2-0',
            round: 2,
            position: 0,
          },
          {
            id: 'm6',
            player1Id: 'p6',
            player1Name: 'ThunderMage',
            player2Id: 'p7',
            player2Name: 'FrostArcher',
            round: 2,
            position: 1,
          },
          // Round 3 (Finals)
          {
            id: 'm7',
            player1Id: 'p1',
            player1Name: 'DragonSlayer',
            player2Id: 'TBD',
            player2Name: 'TBD',
            round: 3,
            position: 0,
          },
        ],
      };

      setTournament(mockTournament);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tournament data:', error);
      setLoading(false);
    }
  };

  const getMatchesByRound = (round: number): Match[] => {
    if (!tournament) return [];
    return tournament.matches
      .filter((m) => m.round === round)
      .sort((a, b) => a.position - b.position);
  };

  const getRoundName = (round: number, totalRounds: number): string => {
    if (round === totalRounds) return 'Finals';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    return `Round ${round}`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading Tournament...</div>;
  }

  if (!tournament) {
    return <div className={styles.error}>Tournament not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{tournament.name}</h2>
        <div className={styles.status}>
          <span className={`${styles.statusBadge} ${styles[tournament.status]}`}>
            {tournament.status.replace('_', ' ')}
          </span>
          <span className={styles.players}>
            {tournament.currentPlayers}/{tournament.maxPlayers} Players
          </span>
        </div>
      </div>

      <div className={styles.bracket}>
        {Array.from({ length: tournament.totalRounds }, (_, i) => i + 1).map((round) => (
          <div key={round} className={styles.round}>
            <h3 className={styles.roundTitle}>
              {getRoundName(round, tournament.totalRounds)}
            </h3>
            <div className={styles.matches}>
              {getMatchesByRound(round).map((match) => (
                <div key={match.id} className={styles.matchCard}>
                  <div
                    className={`${styles.player} ${
                      match.winnerId === match.player1Id ? styles.winner : ''
                    } ${match.winnerId && match.winnerId !== match.player1Id ? styles.loser : ''}`}
                  >
                    <span className={styles.playerName}>
                      {match.player1Name}
                      {match.winnerId === match.player1Id && ' 👑'}
                    </span>
                  </div>
                  <div className={styles.vs}>
                    {match.score || (match.winnerId ? 'VS' : 'TBD')}
                  </div>
                  <div
                    className={`${styles.player} ${
                      match.winnerId === match.player2Id ? styles.winner : ''
                    } ${match.winnerId && match.winnerId !== match.player2Id ? styles.loser : ''}`}
                  >
                    <span className={styles.playerName}>
                      {match.player2Name}
                      {match.winnerId === match.player2Id && ' 👑'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
