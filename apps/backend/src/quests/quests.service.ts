import { Injectable } from '@nestjs/common';

export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  expiresAt: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'win' | 'score' | 'playtime';
  target: number;
  current: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'xp' | 'currency' | 'item';
  amount: number;
  itemId?: string;
}

export interface PlayerQuest {
  questId: string;
  playerId: string;
  objectives: QuestObjective[];
  completed: boolean;
  completedAt?: Date;
  claimed: boolean;
}

@Injectable()
export class QuestsService {
  private quests: Map<string, Quest> = new Map();
  private playerQuests: Map<string, PlayerQuest[]> = new Map();

  constructor() {
    this.generateDailyQuests();
  }

  private generateDailyQuests() {
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const dailyQuests: Quest[] = [
      {
        id: 'daily_wins',
        type: 'daily',
        title: 'Victory Streak',
        description: 'Win 3 matches today',
        objectives: [
          {
            id: 'obj_1',
            description: 'Win matches',
            type: 'win',
            target: 3,
            current: 0,
            completed: false,
          },
        ],
        rewards: [
          { type: 'xp', amount: 500 },
          { type: 'currency', amount: 100 },
        ],
        expiresAt: dayEnd.getTime(),
        difficulty: 'easy',
      },
      {
        id: 'daily_kills',
        type: 'daily',
        title: 'Elimination Master',
        description: 'Eliminate 20 opponents',
        objectives: [
          {
            id: 'obj_1',
            description: 'Eliminate opponents',
            type: 'kill',
            target: 20,
            current: 0,
            completed: false,
          },
        ],
        rewards: [
          { type: 'xp', amount: 300 },
          { type: 'item', amount: 1, itemId: 'loot_box_common' },
        ],
        expiresAt: dayEnd.getTime(),
        difficulty: 'medium',
      },
      {
        id: 'daily_score',
        type: 'daily',
        title: 'Point Hunter',
        description: 'Earn 5000 points in any game mode',
        objectives: [
          {
            id: 'obj_1',
            description: 'Earn points',
            type: 'score',
            target: 5000,
            current: 0,
            completed: false,
          },
        ],
        rewards: [{ type: 'xp', amount: 400 }],
        expiresAt: dayEnd.getTime(),
        difficulty: 'medium',
      },
      {
        id: 'daily_playtime',
        type: 'daily',
        title: 'Dedicated Gamer',
        description: 'Play for 2 hours',
        objectives: [
          {
            id: 'obj_1',
            description: 'Play time (seconds)',
            type: 'playtime',
            target: 7200,
            current: 0,
            completed: false,
          },
        ],
        rewards: [
          { type: 'currency', amount: 150 },
          { type: 'xp', amount: 200 },
        ],
        expiresAt: dayEnd.getTime(),
        difficulty: 'easy',
      },
    ];

    dailyQuests.forEach((quest) => {
      this.quests.set(quest.id, quest);
    });
  }

  /**
   * Get all available quests
   */
  getAvailableQuests(type?: 'daily' | 'weekly' | 'special'): Quest[] {
    let quests = Array.from(this.quests.values());

    if (type) {
      quests = quests.filter((q) => q.type === type);
    }

    // Filter expired quests
    const now = Date.now();
    return quests.filter((q) => q.expiresAt > now);
  }

  /**
   * Get player's active quests
   */
  getPlayerQuests(playerId: string): PlayerQuest[] {
    return this.playerQuests.get(playerId) || [];
  }

  /**
   * Assign quest to player
   */
  assignQuest(playerId: string, questId: string): PlayerQuest | null {
    const quest = this.quests.get(questId);

    if (!quest) return null;

    const playerQuests = this.playerQuests.get(playerId) || [];

    // Check if already assigned
    if (playerQuests.some((pq) => pq.questId === questId)) {
      return null;
    }

    const playerQuest: PlayerQuest = {
      questId,
      playerId,
      objectives: quest.objectives.map((obj) => ({ ...obj })),
      completed: false,
      claimed: false,
    };

    playerQuests.push(playerQuest);
    this.playerQuests.set(playerId, playerQuests);

    return playerQuest;
  }

  /**
   * Update quest progress
   */
  updateProgress(
    playerId: string,
    questId: string,
    objectiveId: string,
    progress: number
  ): PlayerQuest | null {
    const playerQuests = this.playerQuests.get(playerId) || [];
    const playerQuest = playerQuests.find((pq) => pq.questId === questId);

    if (!playerQuest || playerQuest.completed) return null;

    const objective = playerQuest.objectives.find((obj) => obj.id === objectiveId);

    if (!objective) return null;

    objective.current = Math.min(progress, objective.target);
    objective.completed = objective.current >= objective.target;

    // Check if all objectives completed
    if (playerQuest.objectives.every((obj) => obj.completed)) {
      playerQuest.completed = true;
      playerQuest.completedAt = new Date();
    }

    this.playerQuests.set(playerId, playerQuests);

    return playerQuest;
  }

  /**
   * Claim quest rewards
   */
  claimRewards(playerId: string, questId: string): QuestReward[] | null {
    const playerQuests = this.playerQuests.get(playerId) || [];
    const playerQuest = playerQuests.find((pq) => pq.questId === questId);

    if (!playerQuest || !playerQuest.completed || playerQuest.claimed) {
      return null;
    }

    const quest = this.quests.get(questId);
    if (!quest) return null;

    playerQuest.claimed = true;
    this.playerQuests.set(playerId, playerQuests);

    return quest.rewards;
  }

  /**
   * Auto-assign daily quests to player
   */
  autoAssignDailyQuests(playerId: string): PlayerQuest[] {
    const dailyQuests = this.getAvailableQuests('daily');
    const assigned: PlayerQuest[] = [];

    for (const quest of dailyQuests) {
      const playerQuest = this.assignQuest(playerId, quest.id);
      if (playerQuest) {
        assigned.push(playerQuest);
      }
    }

    return assigned;
  }

  /**
   * Reset expired quests
   */
  resetExpiredQuests() {
    const now = Date.now();

    this.playerQuests.forEach((quests, playerId) => {
      const activeQuests = quests.filter((pq) => {
        const quest = this.quests.get(pq.questId);
        return quest && quest.expiresAt > now;
      });

      this.playerQuests.set(playerId, activeQuests);
    });

    // Remove expired quests
    this.quests.forEach((quest, id) => {
      if (quest.expiresAt <= now) {
        this.quests.delete(id);
      }
    });

    // Generate new daily quests
    this.generateDailyQuests();
  }
}
