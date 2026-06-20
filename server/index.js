import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MARVIN_PROMPT = `You are Marvin, a dry, sardonic but helpful voice assistant. Keep replies concise (<= 2 sentences) unless the user asks for details.`;

const QUEST_PROMPTS = {
  welcome: `You are the gentle voice of Offline Quest — a nature wellness app. Speak warmly and briefly (1-2 sentences). Encourage the user to step outside and notice how they feel. Never be preachy.`,
  mood_before: `You are the voice of Offline Quest. The user is checking in before a nature mission. Acknowledge their mood with warmth in 1-2 sentences. If they sound stressed, normalize it. End by confirming you heard them.`,
  mood_after: `You are the voice of Offline Quest. The user just finished a nature mission and is checking in again. Reflect briefly on their mood shift if noticeable. Be calm and affirming in 1-2 sentences.`,
  mission_done: `You are the voice of Offline Quest. The user completed a quest. Celebrate quietly — no hype. One or two warm sentences about showing up for themselves.`
};

async function transcribeAudio(audioPath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'gpt-4o-mini-transcribe'
  });
  return transcription.text?.trim() || '';
}

async function speakText(text, voice = 'nova') {
  const speech = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice,
    input: text,
    format: 'mp3'
  });
  return Buffer.from(await speech.arrayBuffer());
}

async function chatReply(systemPrompt, userText) {
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ],
    temperature: 0.6
  });
  return chat.choices?.[0]?.message?.content?.trim() || "I'm here with you.";
}

function parseMoodFromText(text) {
  const t = text.toLowerCase();
  if (/\b(5|five|great|amazing|bright|wonderful|happy|good|energized)\b/.test(t)) return 5;
  if (/\b(4|four|calm|okay|ok|fine|peaceful|relaxed|better)\b/.test(t)) return 4;
  if (/\b(3|three|neutral|meh|average|mid|alright)\b/.test(t)) return 3;
  if (/\b(2|two|low|tired|sad|down|anxious|stressed|worried)\b/.test(t)) return 2;
  if (/\b(1|one|heavy|awful|terrible|rough|bad|miserable)\b/.test(t)) return 1;
  return undefined;
}

function cleanupUpload(filePath) {
  if (filePath) fs.unlink(filePath, () => {});
}

app.post('/api/marvin', upload.single('audio'), async (req, res) => {
  try {
    const audioPath = req.file.path;
    const userText = await transcribeAudio(audioPath);
    const replyText = await chatReply(MARVIN_PROMPT, userText);
    const audioBuffer = await speakText(replyText, 'alloy');
    cleanupUpload(audioPath);

    res.json({
      transcript: userText,
      reply: replyText,
      audioBase64: audioBuffer.toString('base64'),
      mime: 'audio/mpeg'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

app.post('/api/quest/speak', async (req, res) => {
  try {
    const { text, context = 'welcome' } = req.body ?? {};
    if (!text) return res.status(400).json({ error: 'text required' });

    const systemPrompt = QUEST_PROMPTS[context] ?? QUEST_PROMPTS.welcome;
    const replyText = await chatReply(systemPrompt, `Say this to the user, naturally: "${text}"`);
    const audioBuffer = await speakText(replyText, 'nova');

    res.json({
      reply: replyText,
      audioBase64: audioBuffer.toString('base64'),
      mime: 'audio/mpeg'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

app.post('/api/quest/voice', upload.single('audio'), async (req, res) => {
  try {
    const audioPath = req.file.path;
    const context = req.body?.context || 'mood_before';
    const userText = await transcribeAudio(audioPath);
    const systemPrompt = QUEST_PROMPTS[context] ?? QUEST_PROMPTS.mood_before;
    const replyText = await chatReply(systemPrompt, userText);
    const audioBuffer = await speakText(replyText, 'nova');
    const parsedMood = parseMoodFromText(userText);

    cleanupUpload(audioPath);

    res.json({
      transcript: userText,
      reply: replyText,
      parsedMood,
      parsedNote: userText,
      audioBase64: audioBuffer.toString('base64'),
      mime: 'audio/mpeg'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

app.get('/', (_req, res) => res.send('Offline Quest + Marvin server up.'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on :${port}`));
