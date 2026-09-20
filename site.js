const USER = "Yu-0312";

/** @type {{name:string, title:string, desc:string, url:string, cats:string[], stars?:number, views?:string, marks?:string, badge:string}[]} */
const FALLBACK_SHARE = [
  {
    name: "apcs-judge",
    title: "APCS 多語言評分系統",
    desc: "單一頁面支援 Python/C++/C/Java，58 題涵蓋初級/中級/高級，含解題思路提示。",
    url: "https://github.com/Yu-0312/apcs-judge",
    cats: ["教學", "Tools"],
    stars: 116,
    views: "GitHub ★ 116",
    marks: "JS",
    badge: "APCS",
  },
  {
    name: "shell-lab",
    title: "shell-lab",
    desc: "Shell 互動實驗。",
    url: "https://github.com/Yu-0312/shell-lab",
    cats: ["教學", "OS"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "shell",
  },
  {
    name: "stat-lab",
    title: "stat-lab",
    desc: "互動式統計學課程 — Excel · JASP · SPSS 三軟體並行。",
    url: "https://github.com/Yu-0312/stat-lab",
    cats: ["教學", "Learning"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "stat",
  },
  {
    name: "devops-roadmap",
    title: "devops-roadmap",
    desc: "從 Linux 到 Production 的 12 階段 DevOps 互動式學習路線圖。",
    url: "https://github.com/Yu-0312/devops-roadmap",
    cats: ["教學", "Backend"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "DevOps",
  },
  {
    name: "web-mysql-tutorial",
    title: "web-mysql-tutorial",
    desc: "Web 三劍客（HTML/CSS/JS）＋ MySQL 連貫教學網站：11 章互動課程。",
    url: "https://github.com/Yu-0312/web-mysql-tutorial",
    cats: ["教學", "Frontend", "DB"],
    stars: 0,
    views: "GitHub",
    marks: "HTML",
    badge: "Web+SQL",
  },
  {
    name: "ppt-creator-skills",
    title: "ppt-creator-skills",
    desc: "PPT creator skill for Claude Code。",
    url: "https://github.com/Yu-0312/ppt-creator-skills",
    cats: ["工具", "Tools"],
    stars: 25,
    views: "GitHub ★ 25",
    marks: "JS",
    badge: "PPT",
  },
];

const FALLBACK_PROJECTS = [
  {
    name: "editorial-vision-studio",
    year: "2026",
    tags: ["Design", "Studio"],
    desc: "Editorial vision studio · GitHub ★215",
    url: "https://github.com/Yu-0312/editorial-vision-studio",
    badge: "editorial",
  },
  {
    name: "apcs-judge",
    year: "2026",
    tags: ["JavaScript", "APCS"],
    desc: "APCS 多語言評分系統 · 58 題 · 含解題提示",
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
    desc: "物件照片重組成 editorial / kawaii 風格",
    url: "https://github.com/Yu-0312/aesthetic-object-recomposer",
    badge: "photo",
  },
  {
    name: "english-learning-system",
    year: "2026",
    tags: ["Learning", "HTML"],
    desc: "英語學習系統",
    url: "https://github.com/Yu-0312/english-learning-system",
    badge: "eng",
  },
  {
    name: "paper-echo-photo-cards",
    year: "2026",
    tags: ["Cards", "Codex"],
    desc: "把日常照片做成可重用的學習卡片",
    url: "https://github.com/Yu-0312/paper-echo-photo-cards",
    badge: "cards",
  },
];

const TEACH_NAMES = new Set([
  "shell-lab",
  "cg-interactive-tutorial",
  "rl-interactive-tutorial",
  "stat-lab",
  "web-mysql-tutorial",
  "devops-roadmap",
  "english-learning-system",
  "fullstack-roadmap",
  "ai-engineer-roadmap",
  "senior-science",
]);

const CAT_MAP = [
  ["apcs-judge", ["教學", "Tools"]],
  ["shell-lab", ["教學", "OS"]],
  ["stat-lab", ["教學", "Learning"]],
  ["devops-roadmap", ["教學", "Backend"]],
  ["web-mysql-tutorial", ["教學", "Frontend", "DB"]],
  ["english-learning-system", ["教學", "Learning"]],
  ["cg-interactive-tutorial", ["教學", "Domain"]],
  ["rl-interactive-tutorial", ["教學", "Domain"]],
  ["fullstack-roadmap", ["教學", "Frontend"]],
  ["ai-engineer-roadmap", ["教學", "Domain"]],
  ["ppt-creator-skills", ["工具", "Tools"]],
  ["editorial-vision-studio", ["專案", "Domain"]],
  ["hypecut", ["專案", "Domain"]],
  ["skillhub", ["專案", "Tools"]],
];

function catsFor(name) {
  const hit = CAT_MAP.find(([n]) => n === name);
  return hit ? hit[1] : ["專案"];
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function starsHTML(n) {
  const full = Math.max(0, Math.min(5, Math.round(Number(n) / 25)));
  const safe = n > 0 ? Math.max(1, full) : 0;
  return "★".repeat(safe) + "☆".repeat(5 - safe);
}

/* ---------- home widgets ---------- */
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
  title.textContent = `${y}/${m + 1} ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][now.getDay()]}`;

  const first = new Date(y, m, 1);
  // JS: 0=Sun ... convert to Mon-first
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

function setupHomeExtras(repos) {
  const g = document.getElementById("greetPart");
  if (g) g.textContent = greetWord();

  const recTitle = document.getElementById("recTitle");
  const recDesc = document.getElementById("recDesc");
  const recThumb = document.getElementById("recThumb");
  const recCard = document.getElementById("recCard");
  const pool = (repos && repos.length ? repos : FALLBACK_SHARE).filter((r) => (r.stars ?? 0) > 0 || r.badge);
  const pick = pool[Math.floor(Math.random() * pool.length)] || FALLBACK_SHARE[0];
  if (recTitle) recTitle.textContent = pick.title || pick.name;
  if (recDesc) recDesc.textContent = pick.desc || "";
  if (recThumb) recThumb.textContent = (pick.badge || pick.name || "★").slice(0, 8);
  if (recCard && pick.url) recCard.href = pick.url;

  const likeBtn = document.getElementById("likeBtn");
  const likeCount = document.getElementById("likeCount");
  if (likeBtn && likeCount) {
    const KEY = "yu-site-likes";
    let n = Number(localStorage.getItem(KEY) || "1");
    let on = sessionStorage.getItem("yu-site-liked") === "1";
    likeCount.textContent = String(n);
    if (on) {
      likeBtn.classList.add("is-on");
      likeBtn.setAttribute("aria-pressed", "true");
    }
    likeBtn.addEventListener("click", () => {
      if (sessionStorage.getItem("yu-site-liked") === "1") return;
      n += 1;
      localStorage.setItem(KEY, String(n));
      sessionStorage.setItem("yu-site-liked", "1");
      likeCount.textContent = String(n);
      likeBtn.classList.add("is-on");
      likeBtn.setAttribute("aria-pressed", "true");
    });
  }
}

/* ---------- data ---------- */
async function fetchRepos() {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  return data
    .filter((r) => !r.fork && !r.private && r.name !== USER && r.name !== "yu312")
    .map((r) => ({
      name: r.name,
      title: r.name,
      desc: (r.description || "").trim() || "（之後可補描述）",
      url: r.html_url,
      cats: catsFor(r.name),
      stars: r.stargazers_count ?? 0,
      views: r.stargazers_count ? `GitHub ★ ${r.stargazers_count}` : "GitHub",
      marks: (r.language || "—").slice(0, 12),
      badge: r.name.slice(0, 8),
      year: String((r.updated_at || "").slice(0, 4) || "—"),
      tags: catsFor(r.name).slice(0, 3),
    }));
}

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

function setupProjects(items) {
  const grid = document.getElementById("projGrid");
  if (!grid) return;
  const sorted = [...items].sort((a, b) => (b.stars || 0) - (a.stars || 0));
  grid.innerHTML = sorted.length
    ? sorted.slice(0, 12).map(projectCardHTML).join("")
    : `<div class="empty">目前沒有可顯示的專案</div>`;
}

async function main() {
  tickClock();
  setInterval(tickClock, 30_000);
  renderCalendar();

  let repos = [];
  try {
    repos = await fetchRepos();
  } catch {
    repos = [];
  }

  const shareItems = repos.length
    ? repos.filter((r) => TEACH_NAMES.has(r.name) || (r.stars || 0) > 0 || catsFor(r.name)[0] !== "專案").map((r) => ({ ...r, title: r.name }))
    : FALLBACK_SHARE;

  // ensure teach items always present even if 0 stars
  if (repos.length) {
    const have = new Set(shareItems.map((x) => x.name));
    for (const r of repos) {
      if (TEACH_NAMES.has(r.name) && !have.has(r.name)) shareItems.push(r);
    }
  }

  const projectItems = repos.length ? repos : FALLBACK_PROJECTS;

  setupHomeExtras(shareItems.length ? shareItems : FALLBACK_SHARE);
  setupShare(shareItems.length ? shareItems : FALLBACK_SHARE);
  setupProjects(projectItems);
}

main();
