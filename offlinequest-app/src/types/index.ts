export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type QuestPhase =
  | 'welcome'
  | 'mood_before'
  | 'mission'
  | 'mood_after'
  | 'complete'
  | 'history';

export type MissionCategory = 'water' | 'ground' | 'sky' | 'plants' | 'stillness' | 'movement';

export interface Mission {
  id: string;
  title: string;
  instruction: string;
  durationSeconds?: number;
  category: MissionCategory;
  voiceIntro: string;
}

export interface QuestLog {
  id: string;
  missionId: string;
  missionTitle: string;
  moodBefore: MoodScore;
  moodAfter: MoodScore;
  moodBeforeNote?: string;
  moodAfterNote?: string;
  startedAt: string;
  completedAt: string;
}

export interface VoiceResult {
  transcript: string;
  reply: string;
  audioBase64?: string;
  mime?: string;
  parsedMood?: MoodScore;
  parsedNote?: string;
}

export const MOOD_LABELS: Record<MoodScore, string> = {
  1: 'Heavy',
  2: 'Low',
  3: 'Neutral',
  4: 'Calm',
  5: 'Bright'
};

export const MOOD_EMOJI: Record<MoodScore, string> = {
  1: '🌧',
  2: '🌫',
  3: '🌤',
  4: '🌿',
  5: '☀️'
};
