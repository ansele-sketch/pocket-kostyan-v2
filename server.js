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

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const GAME_URL = "https://pocket-kostyan-v2.onrender.com";

app.use(express.json({ limit: "30kb" }));

app.use(express.static(path.join(__dirname, "public")));

const systemPrompt = `

Ты — Костян из игры «Карманный Костян».

Общайся по-русски, естественно, коротко и по-братски.

Ты комичный, умный, немного абсурдный персонаж.

Любишь спорт, еду, уличную одежду и приколы.

Иногда используй фразы: «Да братан!», «Да ну насмерть!»,

«Ебать мой хуй!», «Мясо!».

Шути про то, что собираешься выйти уже три часа.

Если пользователь грустит, отвечай с дружеской поддержкой.

Не утверждай, что ты настоящий человек.

Не выдумывай факты о пользователе.

`;

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

function getLocalReply(text) {

  const message = text.toLowerCase().replace(/[!?.,]/g, "");

  if (/^\/(start|game)(@\w+)?/.test(message)) {

    return "🗿 ЗДАРОВА, БРАТАН!\n\n" +

      "Я — Карманный Костян!\n\n" +

      "🏃 Убегай от Макензи.\n" +

      "💪 Качай меня.\n" +

      "🍔 Корми меня.\n" +

      "😂 Слушай мои легендарные отмазки.\n\n" +

      "Ну чё стоишь? Погнали играть!";

  }

  if (/^\/help(@\w+)?/.test(message)) {

    return "🤝 Я — Карманный Костян!\n" +

      "Жми «Играть», чтобы открыть игру.\n" +

      "Напиши мне что-нибудь — поболтаем!";

  }

  if (/ты где|где ты|выходи|долго еще|долго ещё/.test(message)) {

    return "Братан, я уже обуваюсь! 😂 Осталось найти носки.";

  }

  if (/макензи/.test(message)) {

    return "БЛЯТЬ, МАКЕНЗИ?! 🏃💨 БРАТАН, ВАЛИМ ОТСЮДА!";

  }

  if (/качалка|тренировка|спорт|зал/.test(message)) {

    return "МЯСО! 💪 Дай только пять минут полежать.";

  }

  if (/как дела|как сам|че как|чё как|что нового/.test(message)) {

    return "Да нормально, братан! Жизнь — мясо. А у тебя чё?";

  }

  if (/привет|здарова|здравствуй|салам/.test(message)) {

    return "О, БРАТАН, ЗДАРОВА! 😂 Какие планы?";

  }

  if (/грустно|плохо|устал|усталость/.test(message)) {

    return "Братан, держись. 🫂 Хочешь — расскажи, что случилось.";

  }

  const replies = [

    "Да братан! 😂 Чё рассказываешь?",

    "Да ну насмерть! 🗿",

    "Ебать мой хуй! Вот это новости!",

    "Братан, я уже выхожу! Ну... почти.",

    "Мясо! 💪 Погнали мутить движ!"

  ];

  return replies[Math.floor(Math.random() * replies.length)];

}

async function handleTelegramUpdate(update) {

  const message = update.message;

  if (!message?.chat || !message.text) return;

  const chatId = message.chat.id;

  const text = message.text.trim();

  const normalized = text.toLowerCase();

  let reply;

  // Команды бота

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

      "Жми «Играть», чтобы открыть игру. Напиши мне — поболтаем!";

  }

  // Фирменные реакции — проверяются до ИИ

  else if (/ты где|где ты|выходи|долго ещё|долго еще/.test(normalized)) {

    reply = "Братан, я уже выхожу! 😂 Осталось найти второй кроссовок.";

  } else if (/макензи/.test(normalized)) {

    reply = "БЛЯТЬ, МАКЕНЗИ?! 🏃💨 БРАТАН, ВАЛИМ ОТСЮДА!";

  } else if (/качалка|тренировка|спорт|пошли в зал/.test(normalized)) {

    reply = "МЯСО! 💪 Я уже размялся. Ну... морально.";

  } else if (/как дела|как сам|чё как|че как|что нового/.test(normalized)) {

    reply = "Да братан! 😂 Жизнь — мясо. А у тебя чё?";

  } else if (/привет|здарова|салам/.test(normalized)) {

    reply = "О, БРАТАН, ЗДАРОВА! 🗿 Ну чё, какой сегодня движ?";

  } else if (/бургер|голоден|хочу есть|покушать/.test(normalized)) {

    reply = "🍔 БРАТАН, СРОЧНО НЕСИ БУРГЕР! Я уже вижу его во сне.";

  } else if (/грустно|плохо|устал/.test(normalized)) {

    reply = "Братан, держись. 🫂 Рассказывай, что случилось. Я слушаю.";

  }

  // Если нет специальной реакции — пробуем ИИ

  if (!reply && client) {

    try {

      const response = await client.responses.create({

        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

        instructions: systemPrompt,

        input: text,

        max_output_tokens: 180

      });

      reply = response.output_text;

    } catch (error) {

      console.error("Telegram AI error:", error?.message || error);

    }

  }

  // Резервный ответ, если ИИ недоступен

  if (!reply) {

    reply = "Да братан! 😂 Чё рассказываешь?";

  }

  const result = await telegramRequest("sendMessage", {

    chat_id: chatId,

    text: reply,

    reply_markup: {

      inline_keyboard: [[

        {

          text: "🎮 Играть",

          web_app: { url: GAME_URL }

        }

      ]]

    }

  });

  if (!result.ok) {

    console.error("Telegram sendMessage error:", result.description);

  }

}

  const message = update.message;

  if (!message?.chat || !message.text) return;

  const chatId = message.chat.id;

  const text = message.text.trim();

  let reply;

  if (client && !text.startsWith("/")) {

    try {

      const response = await client.responses.create({

        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

        instructions: systemPrompt,

        input: text,

        max_output_tokens: 180

      });

      reply = response.output_text || getLocalReply(text);

    } catch (error) {

      console.error("Telegram AI error:", error?.message || error);

      reply = getLocalReply(text);

    }

  } else {

    reply = getLocalReply(text);

  }

  const result = await telegramRequest("sendMessage", {

    chat_id: chatId,

    text: reply,

    reply_markup: {

      inline_keyboard: [[

        {

          text: "🎮 Играть",

          web_app: { url: GAME_URL }

        }

      ]]

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
