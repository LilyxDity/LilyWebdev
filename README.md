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
- **Lucy Assistant** — widget chat AI demo di pojok kanan bawah, menjawab pertanyaan tentang Adit berdasarkan kata kunci
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

## Lisensi

Proyek pribadi Adit — bebas dilihat dan dipelajari.
