import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import type { VoiceResult } from '../types';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://192.168.1.23:3000';

type VoiceContext = 'welcome' | 'mood_before' | 'mood_after' | 'mission_done';

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  onReply?: (text: string) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const playAudioBase64 = useCallback(async (audioBase64: string) => {
    const outPath = `${FileSystem.cacheDirectory}quest-${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(outPath, audioBase64, {
      encoding: FileSystem.EncodingType.Base64
    });
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true
    });
    const { sound } = await Audio.Sound.createAsync({ uri: outPath });
    await sound.playAsync();
  }, []);

  const speakFromServer = useCallback(
    async (text: string, context: VoiceContext = 'welcome') => {
      setProcessing(true);
      setError(null);
      try {
        const res = await fetch(`${SERVER_URL}/api/quest/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, context })
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = (await res.json()) as VoiceResult;
        setLastReply(data.reply || text);
        options.onReply?.(data.reply || text);
        if (data.audioBase64) await playAudioBase64(data.audioBase64);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not speak');
      } finally {
        setProcessing(false);
      }
    },
    [options, playAudioBase64]
  );

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) throw new Error('Microphone permission denied');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start recording');
      setListening(false);
    }
  }, []);

  const stopRecordingAndSend = useCallback(
    async (context: VoiceContext): Promise<VoiceResult | null> => {
      const recording = recordingRef.current;
      if (!recording) return null;

      setListening(false);
      setProcessing(true);
      setError(null);

      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;
        if (!uri) throw new Error('No recording captured');

        const fileType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/3gpp';
        const fileName = Platform.OS === 'ios' ? 'quest.m4a' : 'quest.3gp';

        const form = new FormData();
        form.append('audio', { uri, type: fileType, name: fileName } as unknown as Blob);
        form.append('context', context);

        const res = await fetch(`${SERVER_URL}/api/quest/voice`, {
          method: 'POST',
          body: form
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = (await res.json()) as VoiceResult;

        setLastTranscript(data.transcript || '');
        setLastReply(data.reply || '');
        options.onTranscript?.(data.transcript || '');
        options.onReply?.(data.reply || '');

        if (data.audioBase64) await playAudioBase64(data.audioBase64);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Voice request failed');
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [options, playAudioBase64]
  );

  return {
    listening,
    processing,
    lastTranscript,
    lastReply,
    error,
    startRecording,
    stopRecordingAndSend,
    speakFromServer
  };
}

export { SERVER_URL };
