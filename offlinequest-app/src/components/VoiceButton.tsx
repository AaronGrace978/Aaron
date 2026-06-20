import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface VoiceButtonProps {
  listening: boolean;
  processing: boolean;
  label?: string;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function VoiceButton({
  listening,
  processing,
  label = 'Hold to speak',
  onPressIn,
  onPressOut
}: VoiceButtonProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={processing}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPressIn();
        }}
        onPressOut={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressOut();
        }}
        style={[styles.button, listening && styles.buttonActive, processing && styles.buttonDisabled]}
      >
        {processing ? (
          <ActivityIndicator color="#d7ead4" />
        ) : (
          <>
            <Text style={styles.icon}>🎙</Text>
            <Text style={styles.text}>{listening ? 'Listening…' : label}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%' },
  button: {
    alignItems: 'center',
    backgroundColor: '#1f2a1c',
    borderColor: '#3d5238',
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 88,
    paddingHorizontal: 32,
    paddingVertical: 20,
    width: '100%'
  },
  buttonActive: {
    backgroundColor: '#2a3d26',
    borderColor: '#7cb87a',
    transform: [{ scale: 1.02 }]
  },
  buttonDisabled: { opacity: 0.7 },
  icon: { fontSize: 28, marginBottom: 6 },
  text: { color: '#d7ead4', fontSize: 17, fontWeight: '700' }
});
