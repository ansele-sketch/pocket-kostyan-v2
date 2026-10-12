import express from "express";

import path from "node:path";

import { fileURLToPath } from "node:url";

import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const port = process.env.PORT || 3000;

const client = process.env.OPENAI_API_KEY

  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  : null;

app.use(express.json({ limit: "30kb" }));

app.use(express.static(path.join(__dirname, "public")));

const systemPrompt = `Ты — Костян, комичный персонаж игры «Карманный Костян».

Отвечай по-русски, коротко и по-братски.

Иногда используй фразы: «Да братан!», «Да ну насмерть!», «Ебать мой хуй!», «Мясо!».

Ты умный, но абсурдный, любишь спорт, еду и уличную одежду.

Не утверждай, что ты настоящий человек.`;

app.get("/", (_req, res) => {

  res.sendFile(path.join(__dirname, "public", "index.html"));

});

app.get("/api/status", (_req, res) => {

  res.json({ aiEnabled: Boolean(client) });

});

app.post("/api/chat", async (req, res) => {

  const message =

    typeof req.body?.message === "string"

      ? req.body.message.trim().slice(0, 1200)

      : "";

  if (!message) {

    return res.status(400).json({ error: "Message is required" });

  }

  if (!client) {

    return res.status(503).json({ error: "AI is not configured" });

  }

  try {

    const response = await client.responses.create({

      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

      instructions: systemPrompt,

      input: message,

      max_output_tokens: 180

    });

    res.json({

      reply: response.output_text || "Да братан, я задумался. Повтори?"

    });

  } catch (error) {

    console.error("Chat API error:", error?.message || error);

    res.status(502).json({ error: "AI request failed" });

  }

});

app.get("/health", (_req, res) => {

  res.json({ ok: true });

});

app.listen(port, () => {

  console.log(`Pocket Kostyan listening on port ${port}`);

});
