/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  deleted?: boolean;
  bestWpm: number;
  lastWpm?: number;
  avgAccuracy: number;
  points: number;
  level: number;
  matchesPlayed?: number;
  wins?: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar?: string;
  bestWpm: number;
  avgAccuracy: number;
  level: number;
  wins: number;
  points: number;
}

export interface PlayerProgress {
  id: string;
  username: string;
  avatar?: string;
  wpm: number;
  accuracy: number;
  progress: number; // 0 to 1
  isReady: boolean;
  isFinished: boolean;
  finishTime?: number;
  carId: string;
  rewards?: {
    points: number;
  };
}

export interface Room {
  id: string;
  hostId: string;
  players: PlayerProgress[];
  status: 'waiting' | 'starting' | 'racing' | 'finished';
  text: string;
  startTime?: number;
}

export interface GameState {
  rooms: Record<string, Room>;
}

export interface BotDifficulty {
  name: string;
  wpm: number;
  accuracy: number;
}

export interface RaceHistoryEntry {
  id: number;
  user_id: string;
  wpm: number;
  accuracy: number;
  mode: string;
  won: boolean;
  coins_earned?: number;
  timestamp: string;
}

export const BOT_DIFFICULTIES: Record<number, BotDifficulty> = {
  10: { name: 'Trainee', wpm: 10, accuracy: 0.85 },
  20: { name: 'Novice', wpm: 20, accuracy: 0.88 },
  30: { name: 'Amateur', wpm: 30, accuracy: 0.90 },
  40: { name: 'Racer', wpm: 40, accuracy: 0.92 },
  50: { name: 'Pro', wpm: 50, accuracy: 0.94 },
  60: { name: 'Elite', wpm: 60, accuracy: 0.95 },
  70: { name: 'Master', wpm: 70, accuracy: 0.96 },
  80: { name: 'Legend', wpm: 80, accuracy: 0.97 },
  90: { name: 'Champion', wpm: 90, accuracy: 0.98 },
  100: { name: 'Type God', wpm: 100, accuracy: 0.99 },
};
