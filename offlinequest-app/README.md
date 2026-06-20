# Offline Quest — Mobile App

Nature missions + mood check-ins, built as a **voice-first Expo mobile app**.

## What it does

1. **Mood before** — tap a mood or hold the mic and say how you feel  
2. **Mission** — get a small real-world quest (*find moving water*, *barefoot on grass*, *watch the sky*, etc.)  
3. **Go outside** — do the mission offline  
4. **Mood after** — log again when you return  
5. **History** — quest log saved locally on your phone  

## Run on your phone

```bash
cd offlinequest-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android). Your phone and computer must be on the same Wi‑Fi.

## Voice server

Voice replies use the shared backend (same as Marvin):

```bash
cd server
# set OPENAI_API_KEY in .env
npm install
npm run dev
```

Point the app at your machine's LAN IP:

```bash
# offlinequest-app/.env
EXPO_PUBLIC_SERVER_URL=http://192.168.x.x:3000
```

**Touch mood pickers work without the server.** Voice needs the server + OpenAI key.

## Stack

- Expo / React Native (mobile)
- expo-av (mic + playback)
- AsyncStorage (quest history on device)
- Express + OpenAI STT/TTS (voice)
