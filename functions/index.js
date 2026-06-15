import { onRequest } from 'firebase-functions/v2/https';
// const logger = require('firebase-functions/logger');
import admin from 'firebase-admin';
// var admin = require('firebase-admin');
// const functions = require('firebase-functions');
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started
import { MongoClient } from 'mongodb';
// const {MongoClient} = require('mongodb');

import serviceAccount from'./project2-197c0-firebase-adminsdk-wgo9a-4a0448ab63.json' with { type: "json" } ;;

// const serviceAccount = require('./project2-197c0-firebase-adminsdk-wgo9a-4a0448ab63.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://project2-197c0-default-rtdb.firebaseio.com',
});

const client = new MongoClient(
  'mongodb://thuvienphapluat:ZvQn9683p8NnPXFMdR1VX53HTK3Da1WqyXJpvtgMMASTRdDkyu87lFAL7aR5DiiN@46.225.145.42:6980/?directConnection=true',
);

const clientAI = new MongoClient(
  'mongodb+srv://ngotritoan33:bookertandtajiri33@location.bijatuf.mongodb.net',
);


export const searchLawDescription = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawSearchDescription');

      const keywords = req.body.input.trim().split(/\s+/).filter(Boolean);

      const regexConditions = keywords.map(word => ({
        $or: [
          { _id: new RegExp(word, 'i') },
          { 'info.lawDescription': new RegExp(word, 'i') },
          { 'info.lawNameDisplay': new RegExp(word, 'i') },
        ],
      }));

      LawContent.find({
        $and: regexConditions,
      })
        .project({ info: 1 })
        .sort({ 'info.lawDaySign': -1 })
        .toArray()
        .then(o => res.json(o));
    } finally {
    }
  }
});

export const countAllLaw = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawSearchDescription');

      const estimate = await LawContent.countDocuments();

      res.json(estimate);
    } finally {
    }
  }
});

export const searchContent = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const database = client.db('LawMachine');
      const LawSearch = database.collection('LawSearchContent');
      LawSearch.find({ fullText: new RegExp(`${req.body.input}`, 'i') })
        .project({ info: 1 })
        .sort({ 'info.lawDaySign': -1 })
        .toArray()
        .then(o => res.json(o));
    } finally {
    }
  }
});

export const callOneLaw = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    let a;

    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawCollection');
      // Query for a movie that has the title 'Back to the Future'

      a = await LawContent.findOne({ _id: req.body.screen });
    } finally {
    }

    res.json(a);
  }
});

export const getlastedlaws = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawSearchDescription');

      LawContent.find()
        .limit(50)
        .project({ info: 1 })
        .sort({ 'info.lawDaySign': -1 })
        .toArray()
        .then(o => res.json(o));
    } finally {
    }
  }
});

export const askLawAI = onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS phải xử lý TRƯỚC khi set streaming headers
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { question, history = [] } = req.body;
  if (!question) {
    res.status(400).json({ error: 'Missing question' });
    return;
  }

  // Chỉ set streaming headers SAU khi đã qua các early return
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // ── BƯỚC 1: Embed câu hỏi ──────────────────────────────────────────
    const embedRes = await fetch('https://ollama.pixelplaces.net/api/embed', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "bge-m3", input: question }),
    });

    const embedData = await embedRes.json();
    const questionVector = embedData.embedding[0];

    // ── BƯỚC 2: Tìm chunks từ MongoDB ──────────────────────────────────
    const database = client.db('LawMachine');
    const LawContent = database.collection('LawChunks');

    const chunks = await LawContent.find(
      { embedding: { $exists: true } },
      { projection: { fullText: 1, embedding: 1, _id: 0 } },
    )
      .limit(2000)
      .toArray();

    const cosineSimilarity = (a, b) => {
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const scored = chunks
      .map(chunk => ({
        fullText: chunk.fullText,
        score: cosineSimilarity(questionVector, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const results = scored.filter(r => r.score > 0.3);

    if (results.length === 0) {
      // Stream về lỗi theo SSE format rồi đóng
      res.write(`data: ${JSON.stringify({ text: 'Không tìm thấy thông tin phù hợp.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // ── BƯỚC 3: Gọi LLM và stream về client ───────────────────────────
    const systemMsg = {
      role: 'system',
      content: `Bạn là AI tư vấn pháp luật Việt Nam.
Nhiệm vụ:
- Chỉ dùng thông tin trong CONTEXT
- Trả lời NGẮN GỌN, dễ hiểu.
- KHÔNG copy nguyên văn dữ liệu.
- Hãy diễn giải lại bằng ngôn ngữ tự nhiên.
- Nếu không đủ thông tin thì nói: "Không tìm thấy thông tin phù hợp."`,
    };

    const userMsg = {
      role: 'user',
      content: `Dữ liệu tham khảo:
${results.map((x, i) => `[Tài liệu ${i + 1}]\n${x.fullText}`).join('\n\n')}

Câu hỏi:
${question}
Hãy trả lời ngắn gọn và diễn giải lại.`,
    };

    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it:free',
        messages: [...history, systemMsg, userMsg],
        temperature: 0.2,
        max_tokens: 500,
        stream: true,
      }),
    });

    const reader = llmRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          res.end(); // ← end() chỉ gọi MỘT lần ở đây
          return;
        }
        try {
          const json = JSON.parse(data);
          const text = json.choices?.[0]?.delta?.content;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        } catch (e) {}
      }
    }

    // Trường hợp stream kết thúc mà không có [DONE]
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('askLawAI error:', err);
    // Nếu stream chưa đóng thì gửi lỗi về
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});