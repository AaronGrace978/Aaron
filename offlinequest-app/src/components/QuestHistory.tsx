import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { QuestLog } from '../types';
import { MOOD_EMOJI } from '../types';
import { moodDelta } from '../storage/questLogs';

interface QuestHistoryProps {
  logs: QuestLog[];
  onBack: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function QuestHistory({ logs, onBack }: QuestHistoryProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Quest log</Text>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </View>

      {logs.length === 0 ? (
        <Text style={styles.empty}>No quests yet. Step outside and start one.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const delta = moodDelta(item.moodBefore, item.moodAfter);
            const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;
            return (
              <View style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.mission}>{item.missionTitle}</Text>
                  <Text style={styles.date}>{formatDate(item.completedAt)}</Text>
                </View>
                <View style={styles.moodRow}>
                  <Text style={styles.mood}>{MOOD_EMOJI[item.moodBefore]} → {MOOD_EMOJI[item.moodAfter]}</Text>
                  <Text style={[styles.delta, delta > 0 && styles.deltaUp, delta < 0 && styles.deltaDown]}>
                    {deltaLabel}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: '100%' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  title: { color: '#eef5eb', fontSize: 24, fontWeight: '800' },
  back: { color: '#7cb87a', fontSize: 16, fontWeight: '600' },
  empty: { color: '#8a9684', fontSize: 16, lineHeight: 24, marginTop: 24 },
  list: { gap: 12, paddingBottom: 24 },
  row: {
    backgroundColor: '#1a2218',
    borderColor: '#2a3526',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8
  },
  mission: { color: '#eef5eb', flex: 1, fontSize: 16, fontWeight: '700' },
  date: { color: '#7a8a74', fontSize: 12 },
  moodRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  mood: { color: '#b8c4b2', fontSize: 18 },
  delta: { color: '#8a9684', fontSize: 14, fontWeight: '700' },
  deltaUp: { color: '#7cb87a' },
  deltaDown: { color: '#c4877a' }
});
