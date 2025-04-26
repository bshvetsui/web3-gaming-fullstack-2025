'use client';

import { useState, useEffect } from 'react';
import styles from './GuildPanel.module.css';

interface GuildMember {
  playerId: string;
  playerName: string;
  role: 'leader' | 'officer' | 'member';
  contributionPoints: number;
  joinedAt: Date;
  lastActive: Date;
}

interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderId: string;
  level: number;
  xp: number;
  maxMembers: number;
  treasury: number;
  members: GuildMember[];
  createdAt: Date;
}

export const GuildPanel = () => {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'treasury' | 'settings'>('members');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuildData();
  }, []);

  const fetchGuildData = async () => {
    try {
      // Mock data
      const mockGuild: Guild = {
        id: 'guild1',
        name: 'Dragon Knights',
        tag: 'DK',
        description: 'Elite warriors united for glory',
        leaderId: 'player1',
        level: 15,
        xp: 45000,
        maxMembers: 50,
        treasury: 125000,
        members: [
          {
            playerId: 'player1',
            playerName: 'DragonSlayer',
            role: 'leader',
            contributionPoints: 15000,
            joinedAt: new Date('2025-04-01'),
            lastActive: new Date(),
          },
          {
            playerId: 'player2',
            playerName: 'ShadowMage',
            role: 'officer',
            contributionPoints: 12000,
            joinedAt: new Date('2025-04-02'),
            lastActive: new Date(),
          },
          {
            playerId: 'player3',
            playerName: 'IronKnight',
            role: 'officer',
            contributionPoints: 10000,
            joinedAt: new Date('2025-04-03'),
            lastActive: new Date(),
          },
          {
            playerId: 'player4',
            playerName: 'StormArcher',
            role: 'member',
            contributionPoints: 8000,
            joinedAt: new Date('2025-04-05'),
            lastActive: new Date(),
          },
          {
            playerId: 'player5',
            playerName: 'FlameWizard',
            role: 'member',
            contributionPoints: 7500,
            joinedAt: new Date('2025-04-07'),
            lastActive: new Date(),
          },
        ],
        createdAt: new Date('2025-04-01'),
      };

      setGuild(mockGuild);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch guild data:', error);
      setLoading(false);
    }
  };

  const promoteMember = async (playerId: string) => {
    // TODO: Implement promotion
    console.log('Promote member:', playerId);
  };

  const demoteMember = async (playerId: string) => {
    // TODO: Implement demotion
    console.log('Demote member:', playerId);
  };

  const kickMember = async (playerId: string) => {
    // TODO: Implement kick
    console.log('Kick member:', playerId);
  };

  const contribute = async (amount: number) => {
    // TODO: Implement contribution
    console.log('Contribute:', amount);
  };

  if (loading) {
    return <div className={styles.loading}>Loading Guild...</div>;
  }

  if (!guild) {
    return <div className={styles.noGuild}>You are not in a guild</div>;
  }

  const nextLevelXP = guild.level * 5000;
  const levelProgress = (guild.xp / nextLevelXP) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.guildInfo}>
          <div className={styles.guildIcon}>🛡️</div>
          <div className={styles.guildDetails}>
            <h2>
              {guild.name} <span className={styles.tag}>[{guild.tag}]</span>
            </h2>
            <p className={styles.description}>{guild.description}</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>Level</span>
            <span className={styles.value}>{guild.level}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Members</span>
            <span className={styles.value}>
              {guild.members.length}/{guild.maxMembers}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Treasury</span>
            <span className={styles.value}>{guild.treasury.toLocaleString()} 💰</span>
          </div>
        </div>
      </div>

      <div className={styles.levelProgress}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${levelProgress}%` }} />
        </div>
        <span className={styles.progressText}>
          {guild.xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
        </span>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'treasury' ? styles.active : ''}`}
          onClick={() => setActiveTab('treasury')}
        >
          Treasury
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'members' && (
          <div className={styles.membersTab}>
            <table className={styles.membersTable}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Role</th>
                  <th>Contribution</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {guild.members
                  .sort((a, b) => b.contributionPoints - a.contributionPoints)
                  .map((member) => (
                    <tr key={member.playerId}>
                      <td>
                        <div className={styles.playerCell}>
                          <span className={styles.playerName}>{member.playerName}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.role} ${styles[member.role]}`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td>{member.contributionPoints.toLocaleString()}</td>
                      <td>{new Date(member.lastActive).toLocaleDateString()}</td>
                      <td>
                        {member.role === 'member' && (
                          <button
                            className={styles.actionBtn}
                            onClick={() => promoteMember(member.playerId)}
                          >
                            Promote
                          </button>
                        )}
                        {member.role === 'officer' && (
                          <button
                            className={styles.actionBtn}
                            onClick={() => demoteMember(member.playerId)}
                          >
                            Demote
                          </button>
                        )}
                        {member.role !== 'leader' && (
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => kickMember(member.playerId)}
                          >
                            Kick
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'treasury' && (
          <div className={styles.treasuryTab}>
            <div className={styles.treasuryInfo}>
              <h3>Guild Treasury</h3>
              <p className={styles.balance}>{guild.treasury.toLocaleString()} Gold</p>
            </div>

            <div className={styles.contributeSection}>
              <h4>Make a Contribution</h4>
              <div className={styles.contributeForm}>
                <input
                  type="number"
                  placeholder="Amount"
                  className={styles.input}
                />
                <button className={styles.contributeBtn} onClick={() => contribute(1000)}>
                  Contribute
                </button>
              </div>
            </div>

            <div className={styles.expenses}>
              <h4>Recent Expenses</h4>
              <ul className={styles.expensesList}>
                <li>Guild Level Up - 10,000 Gold</li>
                <li>War Banner Purchase - 5,000 Gold</li>
                <li>Guild Hall Upgrade - 25,000 Gold</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsTab}>
            <h3>Guild Settings</h3>
            <div className={styles.settingGroup}>
              <label>Guild Name</label>
              <input
                type="text"
                defaultValue={guild.name}
                className={styles.input}
              />
            </div>
            <div className={styles.settingGroup}>
              <label>Guild Tag</label>
              <input
                type="text"
                defaultValue={guild.tag}
                className={styles.input}
                maxLength={4}
              />
            </div>
            <div className={styles.settingGroup}>
              <label>Description</label>
              <textarea
                defaultValue={guild.description}
                className={styles.textarea}
                rows={4}
              />
            </div>
            <button className={styles.saveBtn}>Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
};
