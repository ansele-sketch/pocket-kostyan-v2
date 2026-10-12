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
// Telegram bot for Pocket Kostyan

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const GAME_URL = "https://pocket-kostyan-v2.onrender.com";

async function telegramRequest(method, data = {}) {

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

  if (!message || !message.chat) return;

  const chatId = message.chat.id;

  const text = (message.text || "").trim().toLowerCase();

  let reply;

  if (text.startsWith("/start") || text.startsWith("/game")) {

    reply =

      "🗿 ЗДАРОВА, БРАТАН!\n\n" +

      "Я — Карманный Костян!\n\n" +

      "🏃 Убегай от Макензи.\n" +

      "💪 Качай меня.\n" +

      "🍔 Корми меня.\n" +

      "😂 Слушай мои легендарные отмазки.\n\n" +

      "Ну чё стоишь? Погнали играть!";

  } else if (text.startsWith("/help")) {

    reply =

      "🤝 Я — Карманный Костян!\n\n" +

      "Жми «Играть», чтобы открыть игру.\n" +

      "А мне можешь написать что-нибудь в } else if (text) {

  const message = text.replace(/[!?.,]/g, "");

  if (/ты где|где ты|выходи|долго еще|долго ещё/.test(message)) {

    reply = "Братан, я уже обуваюсь! 😂 Ну... осталось найти носки.";

  } else if (/как дела|как сам|че как|чё как|что нового/.test(message)) {

    reply = "Да нормально, братан! Жизнь — мясо. А у тебя чё?";

  } else if (/качалка|тренировка|качать|спорт|зал/.test(message)) {

    reply = "МЯСО! 💪 Братан, я уже настроился. Только дай полежать пять минут.";

  } else if (/макензи/.test(message)) {

    reply = "БЛЯТЬ, МАКЕНЗИ?! 🏃💨 БРАТАН, ВАЛИМ ОТСЮДА!";

  } else if (/поесть|есть|голод|еда|бургер/.test(message)) {

    reply = "Братан, я готов уничтожить три бургера. 🍔 Организм требует топлива!";

  } else if (/привет|здарова|здравствуй|салам/.test(message)) {

    reply = "О, БРАТАН, ЗДАРОВА! 😂 Какие планы на сегодня?";

  } else if (/спасибо|благодарю/.test(message)) {

    reply = "Да братан, без проблем! 🤝 Для своих вообще всё.";

  } else if (/грустно|плохо|устал|усталость/.test(message)) {

    reply = "Братан, держись. 🫂 Иногда надо просто выдохнуть. Хочешь — рассказывай, чё случилось.";

  } else if (/люблю|девушка|отношения|бывшая/.test(message)) {

    reply = "БРАТАН, тут без резких движений. 😂 Рассказывай, что там у тебя произошло?";

  } else if (/деньги|заработать|богатый|бизнес/.test(message)) {

    reply = "Братан, делаем движ, но без мутных схем. 💸 Есть идея — давай разберём!";

  } else {

    const replies = [

      "Да братан! 😂 Чё рассказываешь?",

      "Да ну насмерть! 🗿",

      "Ебать мой хуй! Вот это новости!",

      "Братан, я уже выхожу! Ну... почти.",

      "Мясо! 💪 Погнали мутить движ!",

      "Так, братан, объясни нормально, а то я только проснулся. 😂"

    ];

    reply = replies[Math.floor(Math.random() * replies.length)];

  }

} else {

    return;

  }

  await telegramRequest("sendMessage", {

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

          console.error("Telegram message error:", error);

        }

      }

    } catch (error) {

      console.error("Telegram connection error:", error);

      await new Promise(resolve => setTimeout(resolve, 5000));

    }

  }

}

startTelegramBot();
app.listen(port, () => {

  console.log(`Pocket Kostyan listening on port ${port}`);

});
