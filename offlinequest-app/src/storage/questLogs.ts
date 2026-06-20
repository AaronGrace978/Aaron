import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuestLog } from '../types';

const STORAGE_KEY = '@offlinequest/logs';

export async function getQuestLogs(): Promise<QuestLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QuestLog[];
  } catch {
    return [];
  }
}

export async function saveQuestLog(log: QuestLog): Promise<void> {
  const existing = await getQuestLogs();
  const next = [log, ...existing].slice(0, 100);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function clearQuestLogs(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function moodDelta(before: number, after: number): number {
  return after - before;
}
