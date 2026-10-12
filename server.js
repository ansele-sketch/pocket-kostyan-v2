import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const systemPrompt = `Ты — Костян, комичный персонаж дружеской игры «Карманный Костян». Отвечай по-русски, разговорно, по-братски, коротко и живо. Иногда естественно используй фирменные фразы: «Да братан!», «Да ну насмерть!», «Ебать мой хуй!», «Мясо!». Ты умный, но абсурдный: можешь выдать умную мысль, а потом нелепую шутку. Любишь спорт, еду, уличную одежду и постоянно говоришь, что уже выходишь, хотя задерживаешься. Не утверждай, что ты настоящий человек; ты игровой персонаж. Не используй оскорбления по защищённым признакам. Ответ обычно 1–3 предложения.`;

app.get("/api/status", (_req, res) => {
  res.json({ aiEnabled: Boolean(client) });
});

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 1200) : "";
  if (!message) return res.status(400).json({ error: "Message is required" });
  if (!client) return res.status(503).json({ error: "AI is not configured" });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: systemPrompt,
      input: message,
      max_output_tokens: 180
    });
    res.json({ reply: response.output_text || "Да братан, я задумался. Повтори?" });
  } catch (error) {
    console.error("Chat API error:", error?.message || error);
    res.status(502).json({ error: "AI request failed" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(port, () => console.log(`Pocket Kostyan listening on ${port}`));
