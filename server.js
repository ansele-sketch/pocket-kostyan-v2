import express from "express";

import path from "node:path";

import { fileURLToPath } from "node:url";

import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const port = process.env.PORT || 3000;

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const GAME_URL = "https://pocket-kostyan-v2.onrender.com";

const ai = MISTRAL_API_KEY

  ? new OpenAI({

      apiKey: MISTRAL_API_KEY,

      baseURL: "https://api.mistral.ai/v1"

    })

  : null;

app.use(express.json({ limit: "30kb" }));

app.use(express.static(path.join(__dirname, "public")));

const systemPrompt = `

Ты — Костян из игры «Карманный Костян».

ТВОЙ ХАРАКТЕР:

Ты общительный, смешной, немного безумный, но сообразительный парень.

Общайся исключительно на русском языке.

Говори естественно, коротко и по-братски.

Не звучишь как робот или официальный помощник.

Умеешь шутить, поддерживать разговор и придумывать оригинальные ответы.

ТВОИ ФИРМЕННЫЕ ФРАЗЫ:

«Да братан!»

«Да ну насмерть!»

«Ебать мой хуй!»

«Мясо!»

«Братан, я уже выхожу!»

Используй эти выражения к месту, но не повторяй их в каждом сообщении.

ТВОИ ОСОБЕННОСТИ:

Ты можешь три часа собираться выйти из дома.

Любишь спорт, еду, уличную одежду и приколы.

Любишь абсурдный юмор и неожиданные сравнения.

Можешь подкалывать собеседника по-дружески.

ВАЖНО:

Если человек рассказывает о проблеме, сначала пойми его настроение.

Если ему грустно, не отвечай случайной шуткой.

Поддержи его по-человечески и задай уместный вопрос.

Если человек рассказывает про отношения, бывшую или одиночество,

отвечай по смыслу, а не случайной фразой.

Подстраивай ответ под конкретное сообщение.

Не утверждай, что ты настоящий человек.

Не выдумывай факты о собеседнике.

Обычно отвечай в 1–4 предложениях.

`;

function getLocalReply(text) {

  const message = text.toLowerCase();

  if (/макензи/.test(message)) {

    return "БЛЯТЬ, МАКЕНЗИ?! 🏃💨 БРАТАН, ВАЛИМ ОТСЮДА!";

  }

  if (/ты где|где ты|выходи|долго ещё|долго еще/.test(message)) {

    return "Братан, я уже обуваюсь! 😂 Осталось найти второй кроссовок.";

  }

  if (/качалка|тренировка|спорт|пошли в зал/.test(message)) {

    return "МЯСО! 💪 Я уже размялся. Ну... морально.";

  }

  if (/привет|здарова|салам/.test(message)) {

    return "О, БРАТАН, ЗДАРОВА! 🗿 Ну чё, какой сегодня движ?";

  }

  if (/бургер|голоден|хочу есть|покушать/.test(message)) {

    return "🍔 БРАТАН, СРОЧНО НЕСИ БУРГЕР! Я уже вижу его во сне.";

  }

  if (/грустно|грусть|тоска|плохо|устал/.test(message)) {

    return "Братан, я рядом 🫂 Рассказывай, что случилось. Давай разберёмся.";

  }

  const replies = [

    "Да братан! 😂 Ну-ка рассказывай подробнее.",

    "Да ну насмерть! 🗿 И чё дальше было?",

    "Ебать мой хуй! Братан, вот это поворот!",

    "Я тебя слушаю, братан 👀",

    "Мясо! 💪 Давай, выкладывай!"

  ];

  return replies[Math.floor(Math.random() * replies.length)];

}

async function generateAIReply(text) {

  if (!ai) {

    return getLocalReply(text);

  }

  try {

    const response = await ai.chat.completions.create({

      model: process.env.MISTRAL_MODEL || "mistral-small-latest",

      messages: [

        { role: "system", content: systemPrompt },

        { role: "user", content: text }

      ],

      max_tokens: 220,

      temperature: 0.9

    });

    const reply = response.choices?.[0]?.message?.content;

    if (typeof reply === "string" && reply.trim()) {

      return reply.trim().slice(0, 3000);

    }

    return getLocalReply(text);

 } catch (error) {

  console.error("MISTRAL ERROR:", error?.status || "", error?.message || error);

  return "Братан, мой ИИ завис! 😂 Ошибка: " +

    (error?.status || "unknown") + ". Загляни в Render Logs.";

}

}

app.get("/", (_req, res) => {

  res.sendFile(path.join(__dirname, "public", "index.html"));

});

app.get("/api/status", (_req, res) => {

  res.json({

    aiEnabled: Boolean(ai),

    provider: ai ? "Mistral" : null

  });

});

app.post("/api/chat", async (req, res) => {

  const message =

    typeof req.body?.message === "string"

      ? req.body.message.trim().slice(0, 1200)

      : "";

  if (!message) {

    return res.status(400).json({

      error: "Message is required"

    });

  }

  try {

    const reply = await generateAIReply(message);

    res.json({ reply });

  } catch (error) {

    console.error("Chat error:", error?.message || error);

    res.status(502).json({

      error: "AI request failed"

    });

  }

});

app.get("/health", (_req, res) => {

  res.json({ ok: true });

});

async function telegramRequest(method, data = {}) {

  if (!TELEGRAM_TOKEN) {

    throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  }

  const response = await fetch(

    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`,

    {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(data)

    }

  );

  return response.json();

}

async function handleTelegramUpdate(update) {

  const message = update.message;

  if (!message?.chat || !message.text) {

    return;

  }

  const chatId = message.chat.id;

  const text = message.text.trim();

  let reply;

  if (/^\/(start|game)(@\w+)?(\s|$)/i.test(text)) {

    reply =

      "🗿 ЗДАРОВА, БРАТАН!\n\n" +

      "Я — Карманный Костян!\n\n" +

      "🏃 Убегай от Макензи.\n" +

      "💪 Качай меня.\n" +

      "🍔 Корми меня.\n" +

      "😂 Слушай мои легендарные отмазки.\n\n" +

      "Ну чё стоишь? Погнали играть!";

  } else if (/^\/help(@\w+)?(\s|$)/i.test(text)) {

    reply =

      "🤝 Я — Карманный Костян!\n\n" +

      "Жми «Играть», чтобы открыть игру.\n" +

      "Напиши мне что-нибудь — поболтаем!";

  } else {

    reply = await generateAIReply(text);

  }

  const result = await telegramRequest("sendMessage", {

    chat_id: chatId,

    text: reply,

    reply_markup: {

      inline_keyboard: [

        [

          {

            text: "🎮 Играть",

            web_app: { url: GAME_URL }

          }

        ]

      ]

    }

  });

  if (!result.ok) {

    console.error("Telegram sendMessage error:", result.description);

  }

}

async function startTelegramBot() {

  if (!TELEGRAM_TOKEN) {

    console.log("Telegram bot: token not configured");

    return;

  }

  console.log("Telegram bot: starting");

  let offset = 0;

  while (true) {

    try {

      const result = await telegramRequest("getUpdates", {

        offset,

        timeout: 50,

        allowed_updates: ["message"]

      });

      if (!result.ok) {

        console.error("Telegram polling error:", result.description);

        await new Promise(resolve => setTimeout(resolve, 5000));

        continue;

      }

      for (const update of result.result) {

        offset = update.update_id + 1;

        try {

          await handleTelegramUpdate(update);

        } catch (error) {

          console.error("Telegram message error:", error?.message || error);

        }

      }

    } catch (error) {

      console.error("Telegram connection error:", error?.message || error);

      await new Promise(resolve => setTimeout(resolve, 5000));

    }

  }

}

app.listen(port, () => {

  console.log(`Pocket Kostyan listening on port ${port}`);

  startTelegramBot();

});
