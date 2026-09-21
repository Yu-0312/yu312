/* ==========================================================
   Yuqi 個人入口站 — 互動腳本
   資料為個人真實 GitHub 專案（資料來源：github.com/Yu-0312）
   要增刪卡片，改 SHARE_ITEMS / PROJECT_ITEMS 兩個陣列即可。
   ========================================================== */

/* ---------- 推薦分享：教學 / 工具資源 ---------- */
const SHARE_ITEMS = [
  {
    name: "apcs-judge",
    title: "APCS 多語言評分系統",
    desc: "單頁支援 Python / C++ / C / Java，58 題分初/中/高三級，含解題提示",
    url: "https://github.com/Yu-0312/apcs-judge",
    cats: ["教學", "Tools"],
    stars: 116,
    views: "GitHub ★ 116",
    marks: "JS",
    badge: "apcs",
  },
  {
    name: "devops-roadmap",
    title: "devops-roadmap",
    desc: "從 Linux 到 Production 的 12 階段 DevOps 互動式學習路線圖",
    url: "https://github.com/Yu-0312/devops-roadmap",
    cats: ["教學", "Backend"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "devops",
  },
  {
    name: "web-mysql-tutorial",
    title: "web-mysql-tutorial",
    desc: "Web 三劍客（HTML/CSS/JS）＋ MySQL 連貫教學網站：11 章互動課程、瀏覽器內建 SQL 模擬器",
    url: "https://github.com/Yu-0312/web-mysql-tutorial",
    cats: ["教學", "Frontend", "DB"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "web+sql",
  },
  {
    name: "stat-lab",
    title: "stat-lab",
    desc: "互動式統計學課程：Excel · JASP · SPSS 三軟體並行",
    url: "https://github.com/Yu-0312/stat-lab",
    cats: ["教學", "Learning"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "stat",
  },
  {
    name: "shell-lab",
    title: "shell-lab",
    desc: "Shell 指令互動實驗室",
    url: "https://github.com/Yu-0312/shell-lab",
    cats: ["教學", "OS"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "shell",
  },
  {
    name: "cg-interactive-tutorial",
    title: "cg-interactive-tutorial",
    desc: "電腦圖學互動式教學",
    url: "https://github.com/Yu-0312/cg-interactive-tutorial",
    cats: ["教學", "Domain"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "cg",
  },
  {
    name: "rl-interactive-tutorial",
    title: "rl-interactive-tutorial",
    desc: "強化學習互動式教學",
    url: "https://github.com/Yu-0312/rl-interactive-tutorial",
    cats: ["教學", "Domain"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "rl",
  },
  {
    name: "fullstack-roadmap",
    title: "fullstack-roadmap",
    desc: "全端開發學習路線圖",
    url: "https://github.com/Yu-0312/fullstack-roadmap",
    cats: ["教學", "Frontend"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "fullstack",
  },
  {
    name: "ai-engineer-roadmap",
    title: "ai-engineer-roadmap",
    desc: "AI 工程師學習路線圖",
    url: "https://github.com/Yu-0312/ai-engineer-roadmap",
    cats: ["教學", "Domain"],
    stars: 0,
    views: "GitHub",
    marks: "JS",
    badge: "ai",
  },
  {
    name: "english-learning-system",
    title: "english-learning-system",
    desc: "英語學習系統",
    url: "https://github.com/Yu-0312/english-learning-system",
    cats: ["教學", "Learning"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "eng",
  },
  {
    name: "senior-science",
    title: "senior-science",
    desc: "自然科學學習資源",
    url: "https://github.com/Yu-0312/senior-science",
    cats: ["教學", "Domain"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "sci",
  },
];

/* ---------- 我的專案 ---------- */
const PROJECT_ITEMS = [
  {
    name: "editorial-vision-studio",
    year: "2026",
    tags: ["Design", "Studio"],
    desc: "Editorial 視覺工作室",
    url: "https://github.com/Yu-0312/editorial-vision-studio",
    badge: "editorial",
  },
  {
    name: "apcs-judge",
    year: "2026",
    tags: ["JavaScript", "APCS"],
    desc: "APCS 多語言評分系統 · 58 題",
    url: "https://github.com/Yu-0312/apcs-judge",
    badge: "apcs",
  },
  {
    name: "ppt-creator-skills",
    year: "2026",
    tags: ["Claude", "Skill"],
    desc: "Claude Code 的 PPT 製作 skill",
    url: "https://github.com/Yu-0312/ppt-creator-skills",
    badge: "ppt",
  },
  {
    name: "aesthetic-object-recomposer",
    year: "2026",
    tags: ["Image", "Codex"],
    desc: "把物件照片重組成 editorial / kawaii 風格影像",
    url: "https://github.com/Yu-0312/aesthetic-object-recomposer",
    badge: "photo",
  },
  {
    name: "paper-echo-photo-cards",
    year: "2026",
    tags: ["Cards", "Codex"],
    desc: "把日常照片做成可重用的學習卡片",
    url: "https://github.com/Yu-0312/paper-echo-photo-cards",
    badge: "cards",
  },
  {
    name: "hypecut",
    year: "2026",
    tags: ["Video", "Python"],
    desc: "遊戲 / 電競 / 運動精彩片段自動剪輯",
    url: "https://github.com/Yu-0312/hypecut",
    badge: "clip",
  },
  {
    name: "cv-app",
    year: "2026",
    tags: ["App", "PLpgSQL"],
    desc: "履歷應用程式",
    url: "https://github.com/Yu-0312/cv-app",
    badge: "cv",
  },
  {
    name: "guan-she-tongue-app",
    year: "2026",
    tags: ["App", "TypeScript"],
    desc: "互動式應用程式",
    url: "https://github.com/Yu-0312/guan-she-tongue-app",
    badge: "app",
  },
];

/* ---------- 小工具 ---------- */
function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function starsHTML(n) {
  const full = Math.max(0, Math.min(5, Math.round(Number(n) / 20)));
  const safe = n > 0 ? Math.max(1, full) : 0;
  return "★".repeat(safe) + "☆".repeat(5 - safe);
}

/* ---------- 首頁小工具 ---------- */
function greetWord(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  if (h < 22) return "Good Evening";
  return "Good Night";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function tickClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const d = new Date();
  el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderCalendar() {
  const title = document.getElementById("calTitle");
  const grid = document.getElementById("calendar");
  if (!title || !grid) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dowNames = ["一", "二", "三", "四", "五", "六", "日"];
  const weekNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  title.textContent = `${y}/${m + 1} ${weekNames[now.getDay()]}`;

  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();

  let html = dowNames
    .map((d, i) => `<div class="dow${i === 6 ? " sun" : ""}">${d}</div>`)
    .join("");
  for (let i = 0; i < start; i++) html += `<div class="day is-empty">·</div>`;
  for (let d = 1; d <= days; d++) {
    const today = d === now.getDate() ? " is-today" : "";
    html += `<div class="day${today}">${d}</div>`;
  }
  grid.innerHTML = html;

  const latestDate = document.getElementById("latestDate");
  if (latestDate) {
    latestDate.textContent = `${y}/${m + 1}/${now.getDate()}`;
  }
}

function setupHomeExtras(items) {
  const g = document.getElementById("greetPart");
  if (g) g.textContent = greetWord();

  const recTitle = document.getElementById("recTitle");
  const recDesc = document.getElementById("recDesc");
  const recThumb = document.getElementById("recThumb");
  const recCard = document.getElementById("recCard");
  const pool = items && items.length ? items : SHARE_ITEMS;
  const pick = pool[Math.floor(Math.random() * pool.length)] || pool[0];
  if (recTitle) recTitle.textContent = pick.title || pick.name;
  if (recDesc) recDesc.textContent = pick.desc || "";
  if (recThumb) recThumb.textContent = (pick.badge || pick.name || "★").slice(0, 8);
  if (recCard && pick.url) recCard.href = pick.url;

  const likeBtn = document.getElementById("likeBtn");
  const likeCount = document.getElementById("likeCount");
  if (likeBtn && likeCount) {
    const KEY = "yuqi-site-likes";
    const ONCE = "yuqi-site-liked";
    let n = Number(localStorage.getItem(KEY) || "12");
    let on = sessionStorage.getItem(ONCE) === "1";
    likeCount.textContent = String(n);
    if (on) {
      likeBtn.classList.add("is-on");
      likeBtn.setAttribute("aria-pressed", "true");
    }
    likeBtn.addEventListener("click", () => {
      if (sessionStorage.getItem(ONCE) === "1") return;
      n += 1;
      localStorage.setItem(KEY, String(n));
      sessionStorage.setItem(ONCE, "1");
      likeCount.textContent = String(n);
      likeBtn.classList.add("is-on");
      likeBtn.setAttribute("aria-pressed", "true");
    });
  }
}

/* ---------- 卡片樣板 ---------- */
function shareCardHTML(item) {
  return `
    <article class="item-card" data-cats="${esc((item.cats || []).join("|"))}" data-name="${esc(item.name)}">
      <div class="item-head">
        <div class="thumb">${esc(item.badge || item.name)}</div>
        <div>
          <h3>${esc(item.title || item.name)}</h3>
          <a class="url" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.url)}</a>
        </div>
      </div>
      <div class="stars" aria-label="評分">${starsHTML(item.stars || 0)}</div>
      <div class="item-tags">${(item.cats || []).map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
      <p class="item-desc">${esc(item.desc)}</p>
      <div class="item-meta">${esc(item.views || "")}${item.marks ? ` · ${esc(item.marks)}` : ""}</div>
    </article>`;
}

function projectCardHTML(p) {
  return `
    <article class="proj-card">
      <div class="proj-head">
        <div class="proj-logo">${esc(p.badge || p.name)}</div>
        <div>
          <div class="proj-title-row">
            <h3>${esc(p.name)}</h3>
            <span class="proj-year">${esc(p.year || "")}</span>
          </div>
          <div class="proj-tags">${(p.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        </div>
      </div>
      <p class="proj-desc">${esc(p.desc)}</p>
      <a class="ghost-btn" href="${esc(p.url)}" target="_blank" rel="noopener">Website</a>
    </article>`;
}

/* ---------- 推薦分享頁：篩選 + 搜尋 ---------- */
function setupShare(items) {
  const grid = document.getElementById("grid");
  const filters = document.getElementById("filters");
  const search = document.getElementById("search");
  if (!grid || !filters) return;

  const cats = ["全部", ...Array.from(new Set(items.flatMap((i) => i.cats || [])))];
  filters.innerHTML = cats
    .map((c, i) => `<button type="button" class="chip-btn${i === 0 ? " is-active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join("");

  let active = "全部";
  let q = "";

  function paint() {
    const list = items.filter((it) => {
      const okCat = active === "全部" || (it.cats || []).includes(active);
      const text = `${it.title || ""} ${it.name || ""} ${it.desc || ""}`.toLowerCase();
      const okQ = !q || text.includes(q);
      return okCat && okQ;
    });
    grid.innerHTML = list.length
      ? list.map(shareCardHTML).join("")
      : `<div class="empty">沒有符合的項目</div>`;
  }

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    active = btn.getAttribute("data-cat") || "全部";
    filters.querySelectorAll(".chip-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    paint();
  });

  if (search) {
    search.addEventListener("input", () => {
      q = search.value.trim().toLowerCase();
      paint();
    });
  }

  paint();
}

/* ---------- 專案頁：依星數排序 ---------- */
function setupProjects(items) {
  const grid = document.getElementById("projGrid");
  if (!grid) return;
  const sorted = [...items].sort((a, b) => (b.stars || 0) - (a.stars || 0));
  grid.innerHTML = sorted.length
    ? sorted.slice(0, 12).map(projectCardHTML).join("")
    : `<div class="empty">目前沒有可顯示的專案</div>`;
}

/* ---------- 啟動 ---------- */
function main() {
  tickClock();
  setInterval(tickClock, 30_000);
  renderCalendar();

  setupHomeExtras(SHARE_ITEMS);
  setupShare(SHARE_ITEMS);
  setupProjects(PROJECT_ITEMS);
}

main();
