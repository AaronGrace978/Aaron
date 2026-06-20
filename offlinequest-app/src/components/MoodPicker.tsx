import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { MoodScore } from '../types';
import { MOOD_EMOJI, MOOD_LABELS } from '../types';

interface MoodPickerProps {
  value?: MoodScore;
  onChange: (score: MoodScore) => void;
  label: string;
}

export function MoodPicker({ value, onChange, label }: MoodPickerProps) {
  const scores: MoodScore[] = [1, 2, 3, 4, 5];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {scores.map((score) => {
          const selected = value === score;
          return (
            <Pressable
              key={score}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(score);
              }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={styles.emoji}>{MOOD_EMOJI[score]}</Text>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {MOOD_LABELS[score]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: {
    color: '#a8b5a0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center'
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#1a2218',
    borderColor: '#2a3526',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 12
  },
  chipSelected: {
    backgroundColor: '#243522',
    borderColor: '#7cb87a'
  },
  emoji: { fontSize: 22, marginBottom: 4 },
  chipText: { color: '#8a9684', fontSize: 11, fontWeight: '600' },
  chipTextSelected: { color: '#d7ead4' }
});
