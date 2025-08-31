import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Marvin’s personality — dry but kind.
const SYSTEM_PROMPT = `You are Marvin, a dry, sardonic but helpful voice assistant. Keep replies concise (<= 2 sentences) unless the user asks for details.`;

app.post('/api/marvin', upload.single('audio'), async (req, res) => {
  try {
    const audioPath = req.file.path;

    // 1) Speech -> Text
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      // Use a current STT model. Options often include 'gpt-4o-mini-transcribe' or 'whisper-1'.
      model: 'gpt-4o-mini-transcribe'
    });
    const userText = transcription.text?.trim() || '';

    // 2) Chat reply (Marvin’s voice in text)
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText }
      ],
      temperature: 0.7
    });
    const replyText = chat.choices?.[0]?.message?.content?.trim() || "I'm here.";

    // 3) Text -> Speech (voice back to phone)
    const speech = await openai.audio.speech.create({
      // Options often include 'gpt-4o-mini-tts' or 'tts-1' / 'tts-1-hd'
      model: 'gpt-4o-mini-tts',
      voice: 'alloy', // alloy | echo | fable | onyx | nova | shimmer
      input: replyText,
      format: 'mp3'
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    // Clean up temp file
    fs.unlink(audioPath, () => {});

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

app.get('/', (_req, res) => res.send('Marvin server up.'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Marvin server listening on :${port}`));

