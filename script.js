/* ============================================================
   LilyWebdev — logika website
   Cari tanda "✏️ BISA DIUBAH" untuk mengubah teks, daftar role,
   data proyek, dan jawaban asisten AI tanpa perlu paham coding.
   ============================================================ */

"use strict";

/* ---------- Loading screen ---------- */
(function initLoader() {
  const loader = document.getElementById("loader");
  const progress = document.getElementById("loader-progress");
  if (!loader || !progress) return;

  // ✏️ BISA DIUBAH: durasi layar loading (dalam milidetik). 1400 = 1,4 detik.
  const LOADER_DURATION_MS = 1400;

  let width = 0;
  const step = 100 / (LOADER_DURATION_MS / 50);
  const timer = setInterval(() => {
    width = Math.min(100, width + step);
    progress.style.width = width + "%";
    if (width >= 100) {
      clearInterval(timer);
      setTimeout(() => loader.classList.add("done"), 250);
    }
  }, 50);

  // Pengaman: loading tidak boleh terjebak selamanya.
  setTimeout(() => loader.classList.add("done"), LOADER_DURATION_MS + 1500);
})();

/* ---------- Efek typing di hero ---------- */
// ✏️ BISA DIUBAH: daftar role yang diketik bergantian di hero.
// Tambah/hapus baris di dalam [ ... ] — tiap role ditulis di antara tanda kutip.
const ROLES = ["Web Developer", "Crypto Enthusiast", "AI Agent Builder"];

(function initTyping() {
  const el = document.getElementById("typing-text");
  if (!el || ROLES.length === 0) return;

  // ✏️ BISA DIUBAH: kecepatan ketik (ms per huruf), kecepatan hapus, dan jeda antar role.
  const TYPE_SPEED_MS = 85;
  const DELETE_SPEED_MS = 45;
  const PAUSE_AFTER_TYPE_MS = 1600;
  const PAUSE_AFTER_DELETE_MS = 350;

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const role = ROLES[roleIndex];
    if (deleting) {
      charIndex -= 1;
      el.textContent = role.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % ROLES.length;
        setTimeout(tick, PAUSE_AFTER_DELETE_MS);
      } else {
        setTimeout(tick, DELETE_SPEED_MS);
      }
    } else {
      charIndex += 1;
      el.textContent = role.slice(0, charIndex);
      if (charIndex === role.length) {
        deleting = true;
        setTimeout(tick, PAUSE_AFTER_TYPE_MS);
      } else {
        setTimeout(tick, TYPE_SPEED_MS);
      }
    }
  }

  tick();
})();

/* ---------- Toggle dark mode ---------- */
(function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  if (!toggle) return;

  // Pakai tema tersimpan; kalau belum ada, ikuti setting perangkat.
  const saved = localStorage.getItem("lilywebdev-theme");
  if (saved) {
    root.setAttribute("data-theme", saved);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }

  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("lilywebdev-theme", next);
  });
})();

/* ---------- Menu hamburger (mobile) ---------- */
(function initMobileMenu() {
  const menuBtn = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  // Tutup menu setelah salah satu link diklik.
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuBtn.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
})();

/* ---------- Reveal saat scroll (fade in & fade out) ---------- */
(function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Masuk layar = muncul (fade in), keluar layar = menghilang (fade out).
        entry.target.classList.toggle("visible", entry.isIntersecting);
      });
    },
    // ✏️ BISA DIUBAH: threshold 0.15 = elemen dianggap terlihat saat 15%-nya masuk layar.
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
})();

/* ---------- Highlight link navbar sesuai section yang sedang dilihat ---------- */
(function initActiveNav() {
  const links = document.querySelectorAll(".nav-link[data-section]");
  const sections = [...links]
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);
  if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) =>
          link.classList.toggle("active", link.dataset.section === entry.target.id)
        );
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
})();

/* ---------- Modal detail proyek ---------- */
// ✏️ BISA DIUBAH: isi detail popup tiap proyek (judul, deskripsi, poin-poin, tags).
// Kunci di kiri (dustfall, flint, bugbounty) harus sama dengan data-project di index.html.
const PROJECT_DATA = {
  dustfall: {
    title: "DUSTFALL — Tactical FPS",
    desc: "Game FPS taktis 3v3 yang berjalan langsung di browser, dibuat untuk bounty make.fun 'Make the best three.js tactical FPS'.",
    points: [
      "Mode plant/defuse: pasang charge di site A atau B, atau habisi tim lawan.",
      "Bot AI dengan navigasi waypoint, reaksi, dan perilaku bertarung yang hidup.",
      "Ekonomi in-game: 5 senjata, granat, dan Kevlar yang bisa dibeli tiap ronde.",
      "Peta Freight Yard 7 berukuran 44×40 meter dengan tiga jalur.",
      "Dibangun dengan Three.js, tanpa framework game engine.",
    ],
    tags: ["THREE.JS", "JAVASCRIPT", "GAME", "MAKE.FUN"],
  },
  flint: {
    title: "Flint Trading",
    desc: "Paper trading berbantuan AI di Flint Devnet Trading Competition — belajar trading tanpa mempertaruhkan uang asli.",
    points: [
      "Modal awal 10.000 test USDC + 1 SOL di akun paper 'ZanyTrencher'.",
      "Maksimal 10 trade per hari, ukuran posisi kecil, pace santai.",
      "Strategi: menunggu breakout terkonfirmasi, menghindari market choppy.",
      "Bersaing untuk hadiah 10.000 USDC dan Flint Points.",
    ],
    tags: ["TRADING", "AI AGENT", "SOLANA", "PAPER TRADING"],
  },
  bugbounty: {
    title: "DeFi Bug Bounty",
    desc: "Riset keamanan smart contract di protokol DeFi besar — mencari celah sebelum dieksploitasi orang jahat.",
    points: [
      "Mereview kode protokol seperti Across, Relay, Cow Protocol, dan Beanstalk.",
      "Kombinasi review manual dan pemindaian otomatis (Slither).",
      "Menemukan celah Medium di Beanstalk: perhitungan kapasitas convert yang double-counting.",
      "Laporan ditulis lengkap dengan proof-of-concept dan saran perbaikan.",
    ],
    tags: ["SECURITY", "SOLIDITY", "DEFI", "AUDIT"],
  },
};

(function initProjectModal() {
  const modal = document.getElementById("project-modal");
  const titleEl = document.getElementById("modal-title");
  const descEl = document.getElementById("modal-desc");
  const pointsEl = document.getElementById("modal-points");
  const tagsEl = document.getElementById("modal-tags");
  if (!modal || !titleEl) return;

  function openModal(key) {
    const data = PROJECT_DATA[key];
    if (!data) return;
    titleEl.textContent = data.title;
    descEl.textContent = data.desc;
    pointsEl.innerHTML = "";
    data.points.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      pointsEl.appendChild(li);
    });
    tagsEl.innerHTML = "";
    data.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-project]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.project));
  });
  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
})();

/* ---------- Form kontak (demo statis, tanpa backend) ---------- */
(function initContactForm() {
  const form = document.getElementById("contact-form");
  const success = document.getElementById("form-success");
  if (!form || !success) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    form.reset();
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();

/* ---------- Widget AI Assistant (OpenRouter, dengan fallback keyword) ----------
   Widget ini memanggil backend di /api/chat (server/ memakai OpenRouter).
   Kalau backend tidak tersedia — misalnya di GitHub Pages yang hanya statis —
   widget otomatis kembali ke jawaban keyword di bawah ini, jadi tetap berguna. */
// ✏️ BISA DIUBAH: jawaban cadangan saat backend AI tidak tersedia.
// Tiap baris berisi kata kunci dan jawabannya. Kata kunci ditulis huruf kecil.
const AI_ANSWERS = [
  {
    keywords: ["dustfall", "game", "fps", "three.js", "threejs"],
    answer:
      "DUSTFALL adalah game FPS taktis 3v3 buatan Adit untuk bounty make.fun — mode plant/defuse, bot AI, dan ekonomi in-game, semuanya dibuat dengan Three.js. Klik VIEW DETAILS di kartu proyeknya untuk info lengkap!",
  },
  {
    keywords: ["flint", "trading", "trade"],
    answer:
      "Flint Trading adalah paper trading berbantuan AI di Flint Devnet Trading Competition. Adit trading dengan 10.000 test USDC (dana demo, bukan uang asli), maksimal 10 trade per hari.",
  },
  {
    keywords: ["bug bounty", "bug", "defi", "keamanan", "security", "audit"],
    answer:
      "Adit melakukan riset keamanan smart contract di protokol DeFi besar seperti Across, Relay, Cow Protocol, dan Beanstalk — bahkan pernah menemukan celah Medium di Beanstalk!",
  },
  {
    keywords: ["skill", "tech", "stack", "kemampuan", "bisa apa"],
    answer:
      "Tech stack Adit: Frontend (HTML, CSS, JavaScript, Three.js) dan Web3 & Tools (Node.js, Git & GitHub, Binance Wallet, AI Agents). Lihat bagian 'My Tech Stack' di halaman ini!",
  },
  {
    keywords: ["kontak", "contact", "hubungi", "email", "wa", "whatsapp"],
    answer:
      "Kamu bisa menghubungi Adit lewat form di bagian Contact di bawah, atau lewat GitHub (LilyxDity) dan X (@AdityaVll). Link-nya ada di bagian CONNECT pada hero.",
  },
  {
    keywords: ["github", "repo", "repository"],
    answer:
      "GitHub Adit ada di https://github.com/LilyxDity — di sana ada proyek-proyeknya, termasuk website portofolio ini (repo LilyWebdev).",
  },
  {
    keywords: ["siapa", "adit", "tentang", "about", "diri"],
    answer:
      "Adit adalah pelajar web development dari Indonesia yang sedang menjelajahi crypto/Web3 dan AI agent. Ia belajar dengan cara membangun proyek nyata — game, trading, sampai riset keamanan.",
  },
  {
    keywords: ["halo", "hai", "hello", "hi", "selamat"],
    answer:
      "Halo! Senang bertemu denganmu. Silakan tanya apa saja tentang Adit, proyeknya, atau skill-nya.",
  },
];

// ✏️ BISA DIUBAH: jawaban default saat pertanyaan tidak cocok dengan kata kunci mana pun.
const AI_DEFAULT_ANSWER =
  "Hmm, saya belum tahu jawabannya untuk itu. Coba tanya tentang DUSTFALL, Flint Trading, bug bounty, skill Adit, atau cara menghubunginya!";

(function initAiWidget() {
  const toggle = document.getElementById("ai-toggle");
  const panel = document.getElementById("ai-panel");
  const form = document.getElementById("ai-form");
  const input = document.getElementById("ai-input");
  const messages = document.getElementById("ai-messages");
  if (!toggle || !panel || !form || !input || !messages) return;

  toggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  });

  function addBubble(text, outgoing) {
    const bubble = document.createElement("div");
    bubble.className = "ai-bubble " + (outgoing ? "ai-bubble-out" : "ai-bubble-in");
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function findAnswer(question) {
    const q = question.toLowerCase();
    const match = AI_ANSWERS.find((entry) =>
      entry.keywords.some((keyword) => q.includes(keyword))
    );
    return match ? match.answer : AI_DEFAULT_ANSWER;
  }

  // Riwayat singkat untuk konteks (maksimal 3 pertukaran terakhir).
  const history = [];

  function setBusy(busy) {
    input.disabled = busy;
    form.querySelector("button[type='submit']").disabled = busy;
  }

  async function askAi(question) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, history }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Server menjawab ${response.status}`);
    }
    return data.reply;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    addBubble(question, true);
    input.value = "";
    setBusy(true);

    // Indikator typing "…" selama menunggu jawaban.
    const typing = addBubble("…", false);
    typing.classList.add("ai-bubble-typing");

    try {
      const reply = await askAi(question);
      history.push({ role: "user", content: question });
      history.push({ role: "assistant", content: reply });
      while (history.length > 6) history.shift();
      typing.remove();
      addBubble(reply, false);
    } catch (error) {
      // Backend tidak tersedia / belum dikonfigurasi: pakai jawaban keyword
      // supaya widget tetap berguna (misalnya di GitHub Pages).
      console.warn("AI backend tidak tersedia, pakai jawaban keyword:", error);
      typing.remove();
      addBubble(findAnswer(question), false);
    } finally {
      setBusy(false);
      input.focus();
    }
  });
})();
