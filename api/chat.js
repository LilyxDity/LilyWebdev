/**
 * LilyWebdev — chat widget AI versi serverless (Vercel).
 *
 * Fungsi ini adalah padanan POST /api/chat dari server/src/index.ts,
 * ditulis ulang untuk Vercel Serverless Function: file statis (index.html,
 * script.js, styles.css) dilayani langsung oleh Vercel dari root repo,
 * sementara endpoint /api/chat dipetakan ke file ini.
 *
 * Kalau mengubah SYSTEM_PROMPT atau logika di sini, samakan juga di
 * server/src/index.ts (dipakai untuk jalan lokal / Koyeb / Render).
 *
 * API key OpenRouter TIDAK PERNAH ada di kode — key hanya dibaca dari
 * environment variable OPENROUTER_API_KEY di dashboard Vercel.
 */
import { OpenRouter } from "@openrouter/sdk";

const MODEL = process.env.OPENROUTER_MODEL ?? "inclusionai/ling-3.2-flash:free";
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_ITEMS = 10;
// Vercel Hobby biasanya memotong fungsi di 10 detik, tapi vercel.json
// meminta maxDuration 60 — timeout internal ini mengikuti yang lebih longgar.
// Kalau platform memotong duluan, widget di frontend otomatis kembali ke
// jawaban keyword (lihat script.js: askAi()).
const UPSTREAM_TIMEOUT_MS = 55_000;

// Batas sederhana per IP supaya kredit OpenRouter tidak cepat habis
// kalau ada yang spam widget: 10 pesan per menit per IP.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const hitsByIp = new Map();

function rateLimited(ip) {
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

function isHistoryItem(value) {
  if (typeof value !== "object" || value === null) return false;
  return (
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    value.content.length > 0 &&
    value.content.length <= MAX_MESSAGE_CHARS
  );
}

/** Ambil teks jawaban dari respons OpenRouter (content bisa string atau array). */
function extractReply(result) {
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim() || null;
  if (Array.isArray(content)) {
    const text = content
      .filter(
        (part) =>
          typeof part === "object" &&
          part !== null &&
          part.type === "text" &&
          typeof part.text === "string",
      )
      .map((part) => part.text)
      .join("");
    return text.trim() || null;
  }
  return null;
}

function upstreamStatus(error) {
  if (typeof error !== "object" || error === null) return null;
  const status = error.status ?? error.statusCode;
  return typeof status === "number" ? status : null;
}

/** Baca body request: Vercel biasanya sudah parse JSON, tapi jaga-jaga. */
async function readBody(req) {
  if (req.body === undefined || req.body === null) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  }
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
  return req.body;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Hanya POST yang didukung." });
    return;
  }

  if (rateLimited(clientIp(req))) {
    res.status(429).json({ error: "Terlalu banyak pesan, coba lagi sebentar lagi." });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.status(400).json({ error: "Body request tidak valid." });
    return;
  }

  const { message, history } = body ?? {};

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
  const cleanHistory = (history ?? []).slice(-MAX_HISTORY_ITEMS);

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
      new Promise((_resolve, reject) =>
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
    console.error("OpenRouter error:", status ?? "unknown", error?.message ?? error);

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
}
