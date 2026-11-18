/**
 * LilyWebdev — backend kecil untuk chat widget AI.
 *
 * Server ini melakukan dua hal:
 *  1. Menyajikan website portofolio statis (index.html dkk.) dari folder atas.
 *  2. Meneruskan pesan chat dari widget ke OpenRouter (POST /api/chat).
 *
 * API key OpenRouter TIDAK PERNAH ada di kode frontend — key hanya dibaca
 * dari environment variable OPENROUTER_API_KEY di server ini.
 * Jangan pernah commit file .env (sudah masuk .gitignore).
 */
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenRouter } from "@openrouter/sdk";

const app = express();
app.use(express.json({ limit: "100kb" }));

const PORT = Number(process.env.PORT ?? 3000);
const MODEL = process.env.OPENROUTER_MODEL ?? "inclusionai/ling-3.2-flash:free";
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_ITEMS = 10;
const UPSTREAM_TIMEOUT_MS = 30_000;

// Batas sederhana per IP supaya kredit OpenRouter tidak cepat habis
// kalau ada yang spam widget: 10 pesan per menit per IP.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const hitsByIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (hitsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  hitsByIp.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

// ✏️ BISA DIUBAH: kepribadian & pengetahuan asisten di widget chat.
// Model menjawab sebagai Lucy, asisten portofolio Adit.
const SYSTEM_PROMPT = [
  "Kamu adalah Lucy, asisten AI di website portofolio Adit (lilyxdity).",
  "Jawab dengan ramah, singkat, dan jelas. Ikuti bahasa yang dipakai pengunjung (Indonesia atau Inggris).",
  "Fakta tentang Adit yang boleh kamu ceritakan:",
  "- Adit adalah pelajar web development dari Indonesia yang menjelajahi crypto/Web3 dan AI agent.",
  "- DUSTFALL: game FPS taktis 3v3 buatannya untuk bounty make.fun — mode plant/defuse, bot AI, ekonomi in-game, dibuat dengan Three.js.",
  "- Flint Trading: paper trading berbantuan AI di Flint Devnet Trading Competition, dengan 10.000 test USDC (dana demo, bukan uang asli), maksimal 10 trade per hari.",
  "- Riset keamanan smart contract di protokol DeFi besar (Across, Relay, Cow Protocol, Beanstalk) — pernah menemukan celah Medium di Beanstalk.",
  "- Tech stack: Frontend (HTML, CSS, JavaScript, Three.js); Web3 & Tools (Node.js, Git & GitHub, Binance Wallet, AI Agents).",
  "- Kontak: form Contact di website ini, GitHub https://github.com/LilyxDity, dan X @AdityaVll.",
  "Kalau ditanya hal di luar portofolio Adit, jawab sejujurnya bahwa kamu hanya tahu soal portofolio Adit, lalu arahkan ke topik yang kamu tahu.",
  "Jangan pernah mengarang proyek, penghargaan, atau kontak yang tidak ada di daftar ini.",
].join("\n");

type ChatRole = "user" | "assistant";
interface HistoryItem {
  role: ChatRole;
  content: string;
}

function isHistoryItem(value: unknown): value is HistoryItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string" &&
    item.content.length > 0 &&
    item.content.length <= MAX_MESSAGE_CHARS
  );
}

/** Ambil teks jawaban dari respons OpenRouter (content bisa string atau array). */
function extractReply(result: unknown): string | null {
  const choices = (result as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim() || null;
  if (Array.isArray(content)) {
    const text = content
      .filter((part): part is { type: "text"; text: string } =>
        typeof part === "object" &&
        part !== null &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string",
      )
      .map((part) => part.text)
      .join("");
    return text.trim() || null;
  }
  return null;
}

function upstreamStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const status = (error as { status?: unknown; statusCode?: unknown }).status ??
    (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : null;
}

app.get("/api/health", (_req, res) => {
  // Hanya boolean — key-nya sendiri tidak pernah dikirim ke client.
  res.json({ ok: true, model: MODEL, keyConfigured: Boolean(process.env.OPENROUTER_API_KEY) });
});

app.post("/api/chat", async (req, res) => {
  if (rateLimited(req.ip ?? "unknown")) {
    res.status(429).json({ error: "Terlalu banyak pesan, coba lagi sebentar lagi." });
    return;
  }

  const { message, history } = (req.body ?? {}) as {
    message?: unknown;
    history?: unknown;
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Pesan tidak boleh kosong." });
    return;
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    res.status(400).json({ error: `Pesan maksimal ${MAX_MESSAGE_CHARS} karakter.` });
    return;
  }
  if (history !== undefined && (!Array.isArray(history) || !history.every(isHistoryItem))) {
    res.status(400).json({ error: "Riwayat chat tidak valid." });
    return;
  }
  const cleanHistory = ((history ?? []) as HistoryItem[]).slice(-MAX_HISTORY_ITEMS);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error:
        "Asisten AI belum dikonfigurasi di server ini (OPENROUTER_API_KEY belum di-set).",
    });
    return;
  }

  const openRouter = new OpenRouter({ apiKey });

  try {
    const result = await Promise.race([
      openRouter.chat.send({
        chatRequest: {
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...cleanHistory,
            { role: "user", content: message.trim() },
          ],
          maxTokens: 500,
          temperature: 0.7,
        },
      }),
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error("upstream timeout")), UPSTREAM_TIMEOUT_MS),
      ),
    ]);

    const reply = extractReply(result);
    if (!reply) {
      res.status(502).json({ error: "Model tidak mengembalikan jawaban." });
      return;
    }
    res.json({ reply });
  } catch (error) {
    // Log hanya status + pesan singkat — tidak pernah key atau body mentah.
    const status = upstreamStatus(error);
    console.error("OpenRouter error:", status ?? "unknown", (error as Error)?.message ?? error);

    if (error instanceof Error && error.message === "upstream timeout") {
      res.status(504).json({ error: "Model AI lambat merespons, coba lagi." });
      return;
    }
    if (status === 401) {
      res.status(502).json({ error: "API key OpenRouter tidak valid." });
      return;
    }
    if (status === 402) {
      res.status(502).json({ error: "Saldo OpenRouter habis, isi ulang dulu." });
      return;
    }
    if (status === 429) {
      res.status(502).json({ error: "OpenRouter sedang sibuk, coba lagi sebentar lagi." });
      return;
    }
    res.status(502).json({ error: "Layanan AI sedang bermasalah, coba lagi nanti." });
  }
});

// Sajikan website statis (index.html, script.js, styles.css) dari folder repo.
// File ini jalan dari server/dist/ (hasil build) atau server/src/, jadi naik 2 level.
const siteRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
app.use(express.static(siteRoot));

app.listen(PORT, () => {
  console.log(`LilyWebdev jalan di http://localhost:${PORT} (model: ${MODEL})`);
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("Peringatan: OPENROUTER_API_KEY belum di-set — /api/chat akan menjawab 503.");
  }
});
