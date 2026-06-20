import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { MissionCard } from './src/components/MissionCard';
import { MoodPicker } from './src/components/MoodPicker';
import { QuestHistory } from './src/components/QuestHistory';
import { VoiceButton } from './src/components/VoiceButton';
import { pickRandomMission } from './src/data/missions';
import { useVoice, SERVER_URL } from './src/hooks/useVoice';
import { getQuestLogs, saveQuestLog } from './src/storage/questLogs';
import type { MoodScore, QuestLog, QuestPhase } from './src/types';
import { MOOD_EMOJI } from './src/types';

function parseMoodFromVoice(data: { parsedMood?: MoodScore; transcript?: string }): MoodScore | undefined {
  if (data.parsedMood && data.parsedMood >= 1 && data.parsedMood <= 5) return data.parsedMood;
  const t = (data.transcript || '').toLowerCase();
  if (/\b(5|five|great|amazing|bright|wonderful|happy|good)\b/.test(t)) return 5;
  if (/\b(4|four|calm|okay|ok|fine|peaceful|relaxed)\b/.test(t)) return 4;
  if (/\b(3|three|neutral|meh|average|mid)\b/.test(t)) return 3;
  if (/\b(2|two|low|tired|sad|down|anxious|stressed)\b/.test(t)) return 2;
  if (/\b(1|one|heavy|awful|terrible|rough|bad)\b/.test(t)) return 1;
  return undefined;
}

export default function App() {
  const [phase, setPhase] = useState<QuestPhase>('welcome');
  const [moodBefore, setMoodBefore] = useState<MoodScore | undefined>();
  const [moodAfter, setMoodAfter] = useState<MoodScore | undefined>();
  const [moodBeforeNote, setMoodBeforeNote] = useState('');
  const [moodAfterNote, setMoodAfterNote] = useState('');
  const [mission, setMission] = useState(() => pickRandomMission());
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [logs, setLogs] = useState<QuestLog[]>([]);
  const [lastSaved, setLastSaved] = useState<QuestLog | null>(null);

  const voice = useVoice();

  const loadLogs = useCallback(async () => {
    setLogs(await getQuestLogs());
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (phase === 'welcome') {
      voice.speakFromServer(
        'Welcome to Offline Quest. Before we send you outside, check in with how you feel right now.',
        'welcome'
      );
      setPhase('mood_before');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMission = useCallback(async () => {
    if (!moodBefore) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStartedAt(new Date().toISOString());
    setPhase('mission');
    await voice.speakFromServer(mission.voiceIntro, 'welcome');
  }, [moodBefore, mission, voice]);

  const completeMission = useCallback(() => {
    setPhase('mood_after');
    voice.speakFromServer('Welcome back. How do you feel now?', 'mood_after');
  }, [voice]);

  const finishQuest = useCallback(async () => {
    if (!moodBefore || !moodAfter || !startedAt) return;

    const log: QuestLog = {
      id: `${Date.now()}`,
      missionId: mission.id,
      missionTitle: mission.title,
      moodBefore,
      moodAfter,
      moodBeforeNote: moodBeforeNote || undefined,
      moodAfterNote: moodAfterNote || undefined,
      startedAt,
      completedAt: new Date().toISOString()
    };

    await saveQuestLog(log);
    setLastSaved(log);
    setLogs(await getQuestLogs());
    setPhase('complete');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const delta = moodAfter - moodBefore;
    const shift =
      delta > 0
        ? 'Nice — your mood lifted a bit.'
        : delta < 0
          ? 'Thanks for checking in honestly.'
          : 'Steady — sometimes that is enough.';

    await voice.speakFromServer(`Quest complete. ${shift}`, 'mission_done');
  }, [moodBefore, moodAfter, moodBeforeNote, moodAfterNote, startedAt, mission, voice]);

  const resetQuest = useCallback(() => {
    setMoodBefore(undefined);
    setMoodAfter(undefined);
    setMoodBeforeNote('');
    setMoodAfterNote('');
    setStartedAt(null);
    setLastSaved(null);
    setMission(pickRandomMission(mission.id));
    setPhase('mood_before');
    voice.speakFromServer('New quest. How are you feeling before you head out?', 'mood_before');
  }, [mission.id, voice]);

  const handleVoiceBefore = useCallback(async () => {
    const result = await voice.stopRecordingAndSend('mood_before');
    if (!result) return;
    const mood = parseMoodFromVoice(result);
    if (mood) setMoodBefore(mood);
    if (result.transcript) setMoodBeforeNote(result.transcript);
  }, [voice]);

  const handleVoiceAfter = useCallback(async () => {
    const result = await voice.stopRecordingAndSend('mood_after');
    if (!result) return;
    const mood = parseMoodFromVoice(result);
    if (mood) setMoodAfter(mood);
    if (result.transcript) setMoodAfterNote(result.transcript);
  }, [voice]);

  const subtitle = useMemo(() => {
    switch (phase) {
      case 'mood_before':
        return 'Check in before you go outside';
      case 'mission':
        return 'Put the phone away — be in nature';
      case 'mood_after':
        return 'Check in when you return';
      case 'complete':
        return 'Quest saved on this device';
      case 'history':
        return 'Your past quests';
      default:
        return 'Small missions. Real world.';
    }
  }, [phase]);

  if (phase === 'history') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <QuestHistory logs={logs} onBack={() => setPhase('mood_before')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>Offline Quest</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {phase === 'mood_before' && (
          <>
            <MoodPicker value={moodBefore} onChange={setMoodBefore} label="Mood before" />
            <View style={styles.spacer} />
            <VoiceButton
              listening={voice.listening}
              processing={voice.processing}
              label="Hold — say how you feel"
              onPressIn={voice.startRecording}
              onPressOut={handleVoiceBefore}
            />
            {moodBeforeNote ? <Text style={styles.note}>"{moodBeforeNote}"</Text> : null}
            <Pressable
              style={[styles.primaryBtn, !moodBefore && styles.primaryBtnDisabled]}
              disabled={!moodBefore}
              onPress={startMission}
            >
              <Text style={styles.primaryBtnText}>Get my mission</Text>
            </Pressable>
          </>
        )}

        {phase === 'mission' && mission && (
          <>
            <MissionCard mission={mission} />
            <View style={styles.spacer} />
            <Text style={styles.hint}>When you're done, come back and tap below.</Text>
            <Pressable style={styles.primaryBtn} onPress={completeMission}>
              <Text style={styles.primaryBtnText}>I'm back</Text>
            </Pressable>
          </>
        )}

        {phase === 'mood_after' && (
          <>
            <MoodPicker value={moodAfter} onChange={setMoodAfter} label="Mood after" />
            <View style={styles.spacer} />
            <VoiceButton
              listening={voice.listening}
              processing={voice.processing}
              label="Hold — say how you feel now"
              onPressIn={voice.startRecording}
              onPressOut={handleVoiceAfter}
            />
            {moodAfterNote ? <Text style={styles.note}>"{moodAfterNote}"</Text> : null}
            <Pressable
              style={[styles.primaryBtn, !moodAfter && styles.primaryBtnDisabled]}
              disabled={!moodAfter}
              onPress={finishQuest}
            >
              <Text style={styles.primaryBtnText}>Save quest</Text>
            </Pressable>
          </>
        )}

        {phase === 'complete' && lastSaved && (
          <>
            <View style={styles.completeCard}>
              <Text style={styles.completeTitle}>Quest complete</Text>
              <Text style={styles.completeMission}>{lastSaved.missionTitle}</Text>
              <Text style={styles.completeMood}>
                {MOOD_EMOJI[lastSaved.moodBefore]} → {MOOD_EMOJI[lastSaved.moodAfter]}
              </Text>
            </View>
            <Pressable style={styles.primaryBtn} onPress={resetQuest}>
              <Text style={styles.primaryBtnText}>New quest</Text>
            </Pressable>
          </>
        )}

        {(voice.lastReply || voice.error) && (
          <View style={styles.voiceCard}>
            {voice.lastReply ? <Text style={styles.voiceReply}>{voice.lastReply}</Text> : null}
            {voice.error ? <Text style={styles.error}>{voice.error}</Text> : null}
          </View>
        )}

        <View style={styles.footerRow}>
          <Pressable onPress={() => setPhase('history')}>
            <Text style={styles.link}>Quest log ({logs.length})</Text>
          </Pressable>
          <Text style={styles.server}>{SERVER_URL.replace('http://', '')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#0f1410', flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 12
  },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  header: { marginBottom: 28 },
  brand: { color: '#eef5eb', fontSize: 34, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: '#8a9684', fontSize: 16, marginTop: 6 },
  spacer: { height: 20 },
  hint: { color: '#8a9684', fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  note: { color: '#a8b5a0', fontSize: 14, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: '#7cb87a',
    borderRadius: 16,
    marginTop: 20,
    paddingVertical: 16
  },
  primaryBtnDisabled: { backgroundColor: '#3d5238', opacity: 0.6 },
  primaryBtnText: { color: '#0f1410', fontSize: 17, fontWeight: '800' },
  completeCard: {
    alignItems: 'center',
    backgroundColor: '#1a2218',
    borderColor: '#3d5238',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24
  },
  completeTitle: { color: '#7cb87a', fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  completeMission: { color: '#eef5eb', fontSize: 22, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  completeMood: { fontSize: 32, marginTop: 12 },
  voiceCard: {
    backgroundColor: '#1a2218',
    borderRadius: 14,
    marginTop: 20,
    padding: 14
  },
  voiceReply: { color: '#b8c4b2', fontSize: 15, lineHeight: 22 },
  error: { color: '#c4877a', fontSize: 14, marginTop: 6 },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28
  },
  link: { color: '#7cb87a', fontSize: 14, fontWeight: '600' },
  server: { color: '#4a5646', fontSize: 11 }
});
