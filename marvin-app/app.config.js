export default {
  expo: {
    name: 'Marvin',
    slug: 'marvin',
    extra: {},
    experiments: { typedRoutes: true },
    ios: { infoPlist: { NSMicrophoneUsageDescription: 'Marvin needs mic access to hear you.' } },
    android: { permissions: [ 'RECORD_AUDIO' ] }
  }
};
