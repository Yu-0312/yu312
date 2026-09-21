/* ==========================================================
   Max 個人入口站 — 互動腳本
   資料全部是本地示範佔位：換內容只要改 SHARE_ITEMS / PROJECT_ITEMS
   （沒有任何對外請求，離線也能跑）
   ========================================================== */

/* ---------- 示範資料：推薦分享 ---------- */
const SHARE_ITEMS = [
  {
    name: "notes-garden",
    title: "筆記花園",
    desc: "把零散筆記種成一片園地：卡片式整理、標籤與全文檢索。",
    url: "https://github.com/",
    cats: ["教學", "Learning"],
    stars: 96,
    views: "示範條目",
    marks: "HTML",
    badge: "notes",
  },
  {
    name: "algo-drills",
    title: "演算法練習場",
    desc: "分級題庫加上解題提示，適合考前衝刺的互動練習。",
    url: "https://github.com/",
    cats: ["教學", "Tools"],
    stars: 120,
    views: "示範條目",
    marks: "JS",
    badge: "algo",
  },
  {
    name: "shell-classroom",
    title: "Shell 互動教室",
    desc: "在瀏覽器裡練常用指令：管線、權限、程序管理。",
    url: "https://github.com/",
    cats: ["教學", "OS"],
    stars: 40,
    views: "示範條目",
    marks: "HTML",
    badge: "shell",
  },
  {
    name: "stat-playground",
    title: "統計遊樂場",
    desc: "把抽象統計概念做成可拖拉的互動圖表。",
    url: "https://github.com/",
    cats: ["教學", "Learning"],
    stars: 64,
    views: "示範條目",
    marks: "JS",
    badge: "stat",
  },
  {
    name: "web-basics",
    title: "網頁開發入門",
    desc: "HTML / CSS / JS 三週連貫教材，附隨堂小練習。",
    url: "https://github.com/",
    cats: ["教學", "Frontend"],
    stars: 88,
    views: "示範條目",
    marks: "HTML",
    badge: "web",
  },
  {
    name: "db-cookbook",
    title: "資料庫食譜",
    desc: "用食譜步驟比喻 SQL：從 SELECT 到 JOIN 的實作練習。",
    url: "https://github.com/",
    cats: ["教學", "DB"],
    stars: 30,
    views: "示範條目",
    marks: "SQL",
    badge: "db",
  },
  {
    name: "focus-timer",
    title: "專注番茄鐘",
    desc: "極簡番茄鐘，附每日專注時數統計。",
    url: "https://github.com/",
    cats: ["工具", "Tools"],
    stars: 75,
    views: "示範條目",
    marks: "JS",
    badge: "timer",
  },
  {
    name: "slide-kit",
    title: "簡報素材包",
    desc: "可重用的簡報模板與圖示庫，一鍵套色。",
    url: "https://github.com/",
    cats: ["工具", "Tools"],
    stars: 52,
    views: "示範條目",
    marks: "JS",
    badge: "slide",
  },
];

/* ---------- 示範資料：我的專案 ---------- */
const PROJECT_ITEMS = [
  {
    name: "portfolio-v2",
    year: "2026",
    tags: ["HTML", "CSS"],
    desc: "個人網站改版：毛玻璃卡片加上 Bento 版面。",
    url: "https://github.com/",
    badge: "site",
  },
  {
    name: "quiz-engine",
    year: "2026",
    tags: ["JavaScript", "Tools"],
    desc: "出題與自動評分的小引擎。",
    url: "https://github.com/",
    badge: "quiz",
  },
  {
    name: "photo-cards",
    year: "2025",
    tags: ["Learning", "Cards"],
    desc: "把日常照片變成可重用的記憶卡片。",
    url: "https://github.com/",
    badge: "cards",
  },
  {
    name: "habit-tracker",
    year: "2025",
    tags: ["App", "PWA"],
    desc: "習慣追蹤小工具，離線也能記錄。",
    url: "https://github.com/",
    badge: "habit",
  },
  {
    name: "data-viz-lab",
    year: "2025",
    tags: ["D3", "Data"],
    desc: "資料視覺化實驗場：圖表與動態資料。",
    url: "https://github.com/",
    badge: "viz",
  },
  {
    name: "mini-blog",
    year: "2024",
    tags: ["Static", "Writing"],
    desc: "極簡靜態部落格，專注在文字本身。",
    url: "https://github.com/",
    badge: "blog",
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
  // JS 的 0=週日，換算成週一起始
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
    const KEY = "***";
    const ONCE = "portal-liked";
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
