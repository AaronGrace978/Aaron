import type { Mission } from '../types';

export const MISSIONS: Mission[] = [
  {
    id: 'moving-water',
    title: 'Find moving water',
    instruction: 'Locate a stream, fountain, or any water in motion. Watch it for one minute.',
    durationSeconds: 60,
    category: 'water',
    voiceIntro: 'Your quest: find moving water. Watch it for one minute, then come back.'
  },
  {
    id: 'barefoot-grass',
    title: 'Barefoot on grass',
    instruction: 'Stand barefoot on grass for 2 minutes. Feel the ground beneath you.',
    durationSeconds: 120,
    category: 'ground',
    voiceIntro: 'Your quest: stand barefoot on grass for two minutes. Feel the earth.'
  },
  {
    id: 'watch-sky',
    title: 'Watch the sky',
    instruction: 'Look up at the sky for 60 seconds. Notice color, clouds, or open space.',
    durationSeconds: 60,
    category: 'sky',
    voiceIntro: 'Your quest: watch the sky for sixty seconds. Just look up.'
  },
  {
    id: 'touch-tree',
    title: 'Touch a tree',
    instruction: 'Find a tree and place your palm on its bark for 30 seconds.',
    durationSeconds: 30,
    category: 'plants',
    voiceIntro: 'Your quest: find a tree and rest your hand on its bark for half a minute.'
  },
  {
    id: 'listen-outside',
    title: 'Listen outside',
    instruction: 'Step outside and listen to natural sounds for 90 seconds without your phone.',
    durationSeconds: 90,
    category: 'stillness',
    voiceIntro: 'Your quest: step outside and listen for ninety seconds. No phone, just ears.'
  },
  {
    id: 'slow-walk',
    title: 'Slow walk',
    instruction: 'Take a slow 3-minute walk and notice three things you can see in nature.',
    durationSeconds: 180,
    category: 'movement',
    voiceIntro: 'Your quest: take a slow three minute walk. Notice three natural things.'
  },
  {
    id: 'find-green',
    title: 'Find something green',
    instruction: 'Find the greenest living thing nearby and study it for 45 seconds.',
    durationSeconds: 45,
    category: 'plants',
    voiceIntro: 'Your quest: find the greenest living thing near you and study it.'
  },
  {
    id: 'feel-wind',
    title: 'Feel the wind',
    instruction: 'Stand still for one minute and notice any breeze on your skin.',
    durationSeconds: 60,
    category: 'sky',
    voiceIntro: 'Your quest: stand still for one minute and feel the air on your skin.'
  },
  {
    id: 'sit-ground',
    title: 'Sit on the ground',
    instruction: 'Sit directly on grass, dirt, or a rock for 2 minutes.',
    durationSeconds: 120,
    category: 'ground',
    voiceIntro: 'Your quest: sit on the ground for two minutes. Let yourself settle.'
  },
  {
    id: 'cloud-shape',
    title: 'One cloud shape',
    instruction: 'Find one cloud and watch it change shape for 60 seconds.',
    durationSeconds: 60,
    category: 'sky',
    voiceIntro: 'Your quest: pick one cloud and watch it shift for a minute.'
  }
];

export function pickRandomMission(excludeId?: string): Mission {
  const pool = excludeId ? MISSIONS.filter((m) => m.id !== excludeId) : MISSIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem ? `${mins}m ${rem}s` : `${mins} min`;
}
