export default {
  expo: {
    name: 'Offline Quest',
    slug: 'offlinequest',
    extra: {
      serverUrl: process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://192.168.1.23:3000'
    },
    ios: {
      infoPlist: {
        NSMicrophoneUsageDescription:
          'Offline Quest uses your microphone for voice check-ins and mood logging.'
      }
    },
    android: {
      permissions: ['RECORD_AUDIO']
    }
  }
};
