# LilyWebdev — Portofolio Adit

Website landing page portofolio pribadi **Adit** (GitHub: [lilyxdity](https://github.com/LilyxDity), X: [@AdityaVll](https://x.com/AdityaVll)).

Dibuat oleh **Lucy** untuk **pangeran ucup** alias Adit (lilyxdity).

## Isi Website

- **Loading screen** — nama "Adit" besar dengan garis progres
- **Navbar pill melayang** — tetap terlihat saat scroll, lengkap dengan toggle dark mode
- **Hero** — efek typing bergantian (Web Developer / Crypto Enthusiast / AI Agent Builder), tombol ke proyek dan GitHub, kartu melayang
- **About** — perkenalan singkat
- **Experience** — timeline perjalanan: AI Agent Projects & Web3 On-Chain Explorer
- **My Tech Stack** — Frontend dan Web3 & Tools
- **Selected Works** — DUSTFALL (game FPS Three.js), Flint Trading, DeFi Bug Bounty — detail lengkap di popup
- **Contact** — form kontak (demo statis)
- **Lucy Assistant** — widget chat AI di pojok kanan bawah. Dengan backend (`server/`) ia menjawab lewat model AI sungguhan (OpenRouter); tanpa backend, ia menjawab dari daftar kata kunci di `script.js`
- **Animasi** — fade in saat elemen masuk layar dan fade out saat keluar, smooth scrolling, highlight menu aktif
- **Responsif** — tampil rapi di HP, tablet, dan desktop

## Teknologi

Vanilla HTML, CSS, dan JavaScript murni — tanpa framework dan tanpa build step. Font Inter dari Google Fonts.

## Cara Menjalankan

Buka file `index.html` langsung di browser, atau serve folder ini:

```bash
python3 -m http.server 8000
```

lalu buka http://localhost:8000

## Chat AI Beneran (OpenRouter)

Widget chat memakai [OpenRouter](https://openrouter.ai) — satu API untuk ratusan model AI. API key **tidak pernah** ada di kode website; key hanya dipakai backend kecil di folder `server/` (TypeScript + SDK resmi `@openrouter/sdk`).

### Menjalankan di komputer sendiri

```bash
# 1. Masuk ke folder server dan install dependencies
cd server
npm install

# 2. Buat API key di https://openrouter.ai/keys, lalu:
cp .env.example .env
# buka .env dan isi OPENROUTER_API_KEY dengan key kamu

# 3. Jalanin server (menyajikan website + API chat di satu port)
npm run dev
```

Lalu buka http://localhost:3000 dan coba chat di widget pojok kanan bawah.

### Ganti model

Ubah `OPENROUTER_MODEL` di `.env` ke slug model apa pun dari https://openrouter.ai/models. Default-nya `inclusionai/ling-3.2-flash:free` — model gratis, jadi tidak perlu isi saldo untuk mencoba. Model gratis dibatasi OpenRouter (sekitar 50 request/hari untuk akun yang belum pernah isi saldo), dan kadang sibuk di sisi penyedianya — kalau satu model gratis sedang dibatasi, coba model gratis lain seperti `google/gemma-4-31b-it:free`. Kalau butuh lebih, isi saldo lalu ganti ke model berbayar, misalnya `anthropic/claude-opus-5.5` atau `deepseek/deepseek-chat`.

### Keamanan

- File `.env` sudah masuk `.gitignore` — jangan pernah di-commit atau dibagikan.
- Backend membatasi 10 pesan per menit per pengunjung supaya kredit tidak cepat habis.
- Cek status backend di http://localhost:3000/api/health.

### Deploy ke internet

GitHub Pages hanya bisa menyajikan file statis, jadi ia **tidak bisa** menjalankan backend ini. Kalau widget-nya dibuka dari GitHub Pages, ia otomatis kembali ke jawaban keyword (tetap berfungsi, hanya bukan AI beneran). Supaya chat AI-nya hidup di internet, deploy repo ini ke hosting Node.js — server ini sudah menyajikan websitenya juga, jadi satu deploy cukup. `package.json` di root repo mendelegasikan install/build/start ke `server/`, jadi hosting buildpack bisa deploy langsung dari root.
- **Vercel (tanpa kartu kredit, cara yang dipakai sekarang):** import repo ini di vercel.com (Framework Preset "Other", biarkan build command kosong — file statis dilayani dari root repo), isi `OPENROUTER_API_KEY` dan `OPENROUTER_MODEL` di Environment Variables, deploy. Endpoint chat-nya adalah `api/chat.js` (Vercel Serverless Function, padanan `POST /api/chat` dari `server/`). `vercel.json` meminta `maxDuration` 60 detik; paket gratis Vercel kadang tetap membatasi fungsi di 10 detik — kalau model gratis merespons lambat, widget otomatis kembali ke jawaban keyword.
- **Koyeb (tanpa kartu kredit):** daftar pakai GitHub, buat web service dari repo ini (buildpack Node.js), isi `OPENROUTER_API_KEY` di environment variables, deploy. Instance gratis tidur setelah 1 jam tanpa pengunjung. Catatan: pada 18–19 November 2026 panel kontrol Koyeb tidak menampilkan tombol buat service sama sekali (hanya banner "Koyeb is joining Mistral"), jadi deploy lewat Koyeb belum bisa.
- **Render:** file `render.yaml` di repo ini sudah berisi konfigurasinya (New → Blueprint, isi `OPENROUTER_API_KEY`, deploy). Catatan: sejak akhir 2026 Render meminta kartu kredit untuk verifikasi identitas sebelum bisa membuat layanan apa pun, termasuk paket gratis.

## GitHub Pages

Repo ini bisa langsung diaktifkan sebagai GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root). Website akan tampil di `https://lilyxdity.github.io/LilyWebdev/`.

## Cara Mengubah Isi Website

Tidak perlu paham coding! Semua teks yang sering diubah sudah ditandai dengan komentar:

```
✏️ BISA DIUBAH
```

Caranya:

1. Buka file yang ingin diubah (`index.html` untuk teks halaman, `script.js` untuk daftar role typing, detail proyek, dan jawaban asisten AI, `styles.css` untuk warna).
2. Cari tanda `✏️ BISA DIUBAH` (pakai Ctrl+F / Cmd+F di editor).
3. Ubah teks di sebelah atau di bawah tanda itu — misal nama, deskripsi proyek, daftar skill, atau warna di bagian `:root` pada `styles.css`.
4. Simpan, lalu refresh browser untuk melihat hasilnya.

Contoh yang bisa diubah: nama "Adit", daftar role efek typing, teks intro, link GitHub dan X, isi kartu experience, daftar skill, data proyek, sapaan dan jawaban widget AI, warna-warna utama, dan teks footer.

## Struktur File

| File | Isi |
| --- | --- |
| `index.html` | Struktur dan semua teks halaman |
| `styles.css` | Semua gaya, warna (tema terang & gelap), dan layout responsif |
| `script.js` | Loading screen, efek typing, dark mode, reveal saat scroll, modal proyek, form kontak, widget AI |
| `server/` | Backend TypeScript (Express + `@openrouter/sdk`): endpoint `POST /api/chat`, menyajikan website statis |
| `server/.env.example` | Contoh konfigurasi (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `PORT`) — salin ke `.env` |

## Lisensi

Proyek pribadi Adit — bebas dilihat dan dipelajari.
