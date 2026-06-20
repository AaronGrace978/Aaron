import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Mission } from '../types';
import { formatDuration } from '../data/missions';

interface MissionCardProps {
  mission: Mission;
}

export function MissionCard({ mission }: MissionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.category}>{mission.category}</Text>
      <Text style={styles.title}>{mission.title}</Text>
      <Text style={styles.instruction}>{mission.instruction}</Text>
      {mission.durationSeconds ? (
        <Text style={styles.duration}>~{formatDuration(mission.durationSeconds)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a2218',
    borderColor: '#3d5238',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    width: '100%'
  },
  category: {
    color: '#7cb87a',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  title: {
    color: '#eef5eb',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 10
  },
  instruction: {
    color: '#b8c4b2',
    fontSize: 16,
    lineHeight: 24
  },
  duration: {
    color: '#7a8a74',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14
  }
});
