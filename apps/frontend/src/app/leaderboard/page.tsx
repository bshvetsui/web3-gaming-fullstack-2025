'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  level?: number;
  tournamentWins?: number;
}

type Category = 'level' | 'tournaments' | 'achievements' | 'pvp' | 'weekly';

export default function LeaderboardPage() {
  const [category, setCategory] = useState<Category>('level');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [category]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockEntries: LeaderboardEntry[] = Array.from({ length: 50 }, (_, i) => ({
        rank: i + 1,
        playerId: `player${i + 1}`,
        playerName: `Player${i + 1}`,
        score: 10000 - i * 100,
        level: 50 - i,
        tournamentWins: 20 - i,
      }));

      setEntries(mockEntries);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: Category): string => {
    const labels = {
      level: 'Top Players by Level',
      tournaments: 'Tournament Champions',
      achievements: 'Achievement Hunters',
      pvp: 'PvP Rankings',
      weekly: 'Weekly Top Players',
    };
    return labels[cat];
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🏆 Leaderboards</h1>
        <p>Compete with players worldwide</p>
      </header>

      <div className={styles.categories}>
        {(['level', 'tournaments', 'achievements', 'pvp', 'weekly'] as Category[]).map(
          (cat) => (
            <button
              key={cat}
              className={`${styles.categoryBtn} ${
                category === cat ? styles.active : ''
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ),
        )}
      </div>

      <div className={styles.content}>
        <h2>{getCategoryLabel(category)}</h2>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.rank}>Rank</div>
              <div className={styles.player}>Player</div>
              <div className={styles.score}>Score</div>
            </div>
            {entries.map((entry) => (
              <div
                key={entry.playerId}
                className={`${styles.row} ${entry.rank <= 3 ? styles.topThree : ''}`}
              >
                <div className={styles.rank}>
                  {entry.rank <= 3 ? (
                    <span className={styles.medal}>
                      {entry.rank === 1
                        ? '🥇'
                        : entry.rank === 2
                          ? '🥈'
                          : '🥉'}
                    </span>
                  ) : (
                    entry.rank
                  )}
                </div>
                <div className={styles.player}>
                  <span className={styles.playerName}>{entry.playerName}</span>
                  {entry.level && (
                    <span className={styles.level}>Lvl {entry.level}</span>
                  )}
                </div>
                <div className={styles.score}>{entry.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
