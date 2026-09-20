const USER = "Yu-0312";

const TEACH = {
  "shell-lab": { title: "Shell Lab", cats: ["系統", "終端"], desc: "Shell 互動實驗。" },
  "cg-interactive-tutorial": { title: "電腦圖學互動教學", cats: ["圖學"], desc: "電腦圖學互動教學。" },
  "rl-interactive-tutorial": { title: "強化學習互動教學", cats: ["AI"], desc: "強化學習互動教學。" },
  "stat-lab": { title: "互動式統計學", cats: ["統計", "Learning"], desc: "Excel · JASP · SPSS 三軟體並行。" },
  "web-mysql-tutorial": { title: "Web + MySQL 教學", cats: ["Web", "資料庫"], desc: "HTML/CSS/JS 與 MySQL 連貫教學，含瀏覽器內 SQL 模擬器。" },
  "devops-roadmap": { title: "DevOps 路線圖", cats: ["DevOps"], desc: "從 Linux 到 Production 的 12 階段互動路線。" },
  "english-learning-system": { title: "英語學習系統", cats: ["語言", "Learning"], desc: "英語學習系統。" },
  "fullstack-roadmap": { title: "全端路線圖", cats: ["Web"], desc: "全端學習路線。" },
  "ai-engineer-roadmap": { title: "AI 工程師路線圖", cats: ["AI"], desc: "AI 工程師學習路線。" },
  "senior-science": { title: "高中科學整理", cats: ["Learning"], desc: "高中科學相關整理。" },
};

const PROJECT_META = {
  "editorial-vision-studio": { cats: ["設計", "工具"] },
  "apcs-judge": { cats: ["APCS", "工具"] },
  "ppt-creator-skills": { cats: ["Claude", "工具"] },
  "aesthetic-object-recomposer": { cats: ["影像", "Codex"] },
  "paper-echo-photo-cards": { cats: ["影像", "Codex"] },
  "hypecut": { cats: ["影音"] },
  "skillhub": { cats: ["工具"] },
  "cv-app": { cats: ["其他"] },
  "guan-she-tongue-app": { cats: ["其他"] },
};

const FALLBACK_TEACH = Object.entries(TEACH).map(([name, meta]) => ({
  name,
  title: meta.title,
  desc: meta.desc,
  url: `https://github.com/${USER}/${name}`,
  cats: meta.cats,
  stars: 0,
  marks: "HTML",
}));

const FALLBACK_PROJECTS = [
  { name: "editorial-vision-studio", desc: "Editorial vision studio", stars: 215, url: `https://github.com/${USER}/editorial-vision-studio`, cats: ["設計", "工具"], year: "2026" },
  { name: "apcs-judge", desc: "APCS 多語言評分系統 — Python/C++/C/Java，58 題含提示", stars: 116, url: `https://github.com/${USER}/apcs-judge`, cats: ["APCS", "工具"], year: "2026" },
  { name: "ppt-creator-skills", desc: "PPT creator skill for Claude Code", stars: 25, url: `https://github.com/${USER}/ppt-creator-skills`, cats: ["Claude", "工具"], year: "2026" },
  { name: "aesthetic-object-recomposer", desc: "物件照片重組成 editorial / kawaii 風格", stars: 7, url: `https://github.com/${USER}/aesthetic-object-recomposer`, cats: ["影像", "Codex"], year: "2026" },
];

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stars(n) {
  const v = Number(n) || 0;
  if (!v) return "—";
  const filled = Math.min(5, Math.max(1, Math.round(v / 25) || 1));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

function badgeText(name) {
  return esc(String(name).slice(0, 8));
}

function itemHTML(it) {
  const tags = (it.cats || []).map((c) => `<span class="tag">${esc(c)}</span>`).join("");
  const starMeta = it.stars
    ? `<span class="star">${stars(it.stars)}</span> ${esc(it.stars)} · ${esc(it.marks || "")}`
    : esc(it.marks || "GitHub");
  return `
    <a class="card item" href="${esc(it.url)}" target="_blank" rel="noopener">
      <div class="item-top">
        <div class="badge">${badgeText(it.name)}</div>
        <div>
          <h3>${esc(it.title || it.name)}</h3>
          <p class="sub">${esc(it.url)}</p>
        </div>
      </div>
      <div class="tags">${tags}</div>
      <p class="desc">${esc(it.desc || "")}</p>
      <div class="meta-line">${starMeta}</div>
    </a>`;
}

function projHTML(p) {
  const tags = (p.cats || []).map((c) => `<span class="tag">${esc(c)}</span>`).join("");
  return `
    <article class="card proj">
      <div class="item-top">
        <div class="badge">${badgeText(p.name)}</div>
        <div>
          <h3>${esc(p.name)}<span class="year">${esc(p.year || "")}</span></h3>
          <div class="tags" style="margin-top:0.35rem">${tags}</div>
        </div>
      </div>
      <p>${esc(p.desc || "（之後可補描述）")}</p>
      <div class="meta-line" style="margin-bottom:0.75rem">
        ${p.stars ? `<span class="star">${stars(p.stars)}</span> ${esc(p.stars)}` : "GitHub"}
      </div>
      <a class="btn btn--ghost" href="${esc(p.url)}" target="_blank" rel="noopener" style="align-self:flex-start">開啟專案</a>
    </article>`;
}

async function fetchRepos() {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  return data
    .filter((r) => !r.fork && !r.private && r.name !== USER && r.name !== "yu312")
    .map((r) => {
      const teachMeta = TEACH[r.name];
      const projMeta = PROJECT_META[r.name];
      return {
        name: r.name,
        title: teachMeta?.title || r.name,
        desc: (r.description || "").trim() || teachMeta?.desc || "",
        url: r.html_url,
        cats: teachMeta?.cats || projMeta?.cats || ["專案"],
        stars: r.stargazers_count ?? 0,
        marks: r.language || "—",
        year: String((r.updated_at || "").slice(0, 4) || ""),
        isTeach: Boolean(teachMeta),
      };
    });
}

function setupTutorialFilters(items) {
  const grid = document.getElementById("grid");
  const filters = document.getElementById("filters");
  const search = document.getElementById("search");
  if (!grid) return;

  const cats = ["全部", ...Array.from(new Set(items.flatMap((i) => i.cats || [])))];
  if (filters) {
    filters.innerHTML = cats
      .map((c, i) => `<button type="button" class="chip${i === 0 ? " is-active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`)
      .join("");
  }

  let active = "全部";
  let q = "";

  function paint() {
    const list = items.filter((it) => {
      const okCat = active === "全部" || (it.cats || []).includes(active);
      const text = `${it.title || ""} ${it.name || ""} ${it.desc || ""}`.toLowerCase();
      return okCat && (!q || text.includes(q));
    });
    grid.innerHTML = list.length ? list.map(itemHTML).join("") : `<div class="empty">沒有符合的項目</div>`;
  }

  filters?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    active = btn.getAttribute("data-cat") || "全部";
    filters.querySelectorAll(".chip").forEach((b) => b.classList.toggle("is-active", b === btn));
    paint();
  });

  search?.addEventListener("input", () => {
    q = search.value.trim().toLowerCase();
    paint();
  });

  paint();
}

function setupHome(teach, projects) {
  const teachGrid = document.getElementById("teachGrid");
  const featGrid = document.getElementById("featGrid");
  if (teachGrid) {
    const top = teach.slice(0, 3);
    teachGrid.innerHTML = top.length ? top.map(itemHTML).join("") : `<div class="empty">之後再補教學連結</div>`;
  }
  if (featGrid) {
    const top = [...projects].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 4);
    featGrid.innerHTML = top.length ? top.map(itemHTML).join("") : `<div class="empty">之後再補專案</div>`;
  }
  const y = document.getElementById("y");
  if (y) y.textContent = String(new Date().getFullYear());
}

function setupProjects(items) {
  const grid = document.getElementById("projGrid");
  if (!grid) return;
  const sorted = [...items]
    .filter((p) => !TEACH[p.name])
    .sort((a, b) => (b.stars || 0) - (a.stars || 0));
  grid.innerHTML = sorted.length
    ? sorted.slice(0, 16).map(projHTML).join("")
    : `<div class="empty">目前沒有可顯示的專案</div>`;
}

async function main() {
  let repos = [];
  try {
    repos = await fetchRepos();
  } catch {
    repos = [];
  }

  const teach = (repos.length ? repos.filter((r) => r.isTeach) : FALLBACK_TEACH).map((r) => ({
    ...r,
    desc: r.desc || TEACH[r.name]?.desc || "（之後可補描述）",
  }));
  // ensure known teach names appear even without descriptions from API
  if (repos.length) {
    const have = new Set(teach.map((t) => t.name));
    for (const [name, meta] of Object.entries(TEACH)) {
      if (!have.has(name)) {
        const api = repos.find((r) => r.name === name);
        teach.push({
          name,
          title: meta.title,
          desc: meta.desc,
          url: `https://github.com/${USER}/${name}`,
          cats: meta.cats,
          stars: api?.stars || 0,
          marks: api?.marks || "—",
        });
      }
    }
  }

  const projects = (repos.length ? repos : FALLBACK_PROJECTS).filter((r) => !TEACH[r.name]);

  setupHome(teach, projects);
  setupTutorialFilters(teach);
  setupProjects(projects);
}

main();
