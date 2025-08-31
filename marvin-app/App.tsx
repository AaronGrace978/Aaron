import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://192.168.1.23:3000';

export default function App() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) throw new Error('Mic permission denied');

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setListening(true);
    } catch (e) {
      console.warn(e);
      setListening(false);
    }
  }

  async function stopRecordingAndSend() {
    const recording = recordingRef.current;
    if (!recording) return;
    setListening(false);
    setThinking(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No recording URI');

      const fileType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/3gpp';
      const fileName = Platform.OS === 'ios' ? 'speech.m4a' : 'speech.3gp';

      const form = new FormData();
      form.append('audio', { uri, type: fileType, name: fileName } as any);

      const res = await fetch(`${SERVER_URL}/api/marvin`, {
        method: 'POST',
        body: form
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      setTranscript(data.transcript || '');
      setReply(data.reply || '');

      if (data.audioBase64) {
        const outPath = FileSystem.cacheDirectory + `marvin-${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(outPath, data.audioBase64, { encoding: FileSystem.EncodingType.Base64 });
        const { sound } = await Audio.Sound.createAsync({ uri: outPath });
        await sound.playAsync();
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setThinking(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marvin</Text>
      <Text style={styles.subtitle}>press, speak, release</Text>

      <Pressable
        onPressIn={startRecording}
        onPressOut={stopRecordingAndSend}
        style={[styles.mic, listening && styles.micActive]}
      >
        <Text style={styles.micText}>{listening ? 'Listening…' : 'Hold to Talk'}</Text>
      </Pressable>

      <View style={{ height: 12 }} />
      {thinking && <ActivityIndicator />}

      {transcript ? (
        <View style={styles.card}><Text style={styles.label}>You</Text><Text style={styles.text}>{transcript}</Text></View>
      ) : null}
      {reply ? (
        <View style={styles.card}><Text style={styles.label}>Marvin</Text><Text style={styles.text}>{reply}</Text></View>
      ) : null}

      <Text style={styles.footer}>Server: {SERVER_URL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 40, fontWeight: '800' },
  subtitle: { marginTop: 4, opacity: 0.6 },
  mic: { marginTop: 32, paddingVertical: 24, paddingHorizontal: 28, borderRadius: 999, borderWidth: 2 },
  micActive: { transform: [{ scale: 1.03 }] },
  micText: { fontSize: 18, fontWeight: '700' },
  card: { width: '100%', marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  label: { fontWeight: '700', marginBottom: 6 },
  text: { fontSize: 16, lineHeight: 22 },
  footer: { position: 'absolute', bottom: 16, opacity: 0.4 }
});
