const USER = "Yu-0312";

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

const PROJECT_BLOCKLIST = new Set([
  "Yu-0312",
  "yu312",
  ...TEACH_NAMES,
]);

const FALLBACK_TEACH = [
  { name: "shell-lab", description: "Shell 互動實驗", stars: 0 },
  { name: "cg-interactive-tutorial", description: "電腦圖學互動教學", stars: 0 },
  { name: "rl-interactive-tutorial", description: "強化學習互動教學", stars: 0 },
  { name: "stat-lab", description: "互動式統計學課程 — Excel · JASP · SPSS", stars: 0 },
  { name: "web-mysql-tutorial", description: "Web 三劍客＋MySQL 互動教學", stars: 0 },
  { name: "devops-roadmap", description: "從 Linux 到 Production 的 12 階段 DevOps 路線圖", stars: 0 },
  { name: "english-learning-system", description: "英語學習系統", stars: 0 },
  { name: "fullstack-roadmap", description: "全端學習路線", stars: 0 },
  { name: "ai-engineer-roadmap", description: "AI 工程師路線圖", stars: 0 },
];

const FALLBACK_PROJECTS = [
  { name: "editorial-vision-studio", description: "Editorial vision studio", stars: 215 },
  { name: "apcs-judge", description: "APCS 多語言評分系統 — Python/C++/C/Java，58 題含提示", stars: 116 },
  { name: "ppt-creator-skills", description: "PPT creator skill for Claude Code", stars: 25 },
  { name: "aesthetic-object-recomposer", description: "物件照片重組成 editorial / kawaii 風格", stars: 7 },
  { name: "paper-echo-photo-cards", description: "把日常照片做成可重用的學習卡片", stars: 2 },
];

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rowHTML(repo) {
  const stars = Number(repo.stars ?? 0);
  const desc = repo.description
    ? `<p class="row__desc">${esc(repo.description)}</p>`
    : "";
  return `
    <li>
      <a class="row" href="https://github.com/${USER}/${esc(repo.name)}" target="_blank" rel="noopener">
        <span class="row__title">${esc(repo.name)}</span>
        <span class="row__meta"><span class="star">★</span> ${stars}</span>
        ${desc}
      </a>
    </li>`;
}

function renderList(el, items, emptyMsg) {
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<li class="state">${esc(emptyMsg)}</li>`;
    return;
  }
  el.innerHTML = items.map(rowHTML).join("");
}

async function fetchRepos() {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  return data
    .filter((r) => !r.fork && !r.private)
    .map((r) => ({
      name: r.name,
      description: (r.description || "").trim(),
      stars: r.stargazers_count ?? 0,
    }));
}

async function main() {
  const teachEl = document.getElementById("teachList");
  const projectEl = document.getElementById("projectList");

  try {
    const repos = await fetchRepos();
    const teach = repos
      .filter((r) => TEACH_NAMES.has(r.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    const projects = repos
      .filter((r) => !PROJECT_BLOCKLIST.has(r.name) && r.stars > 0)
      .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
      .slice(0, 8);

    renderList(teachEl, teach, "目前沒有辨識到教學 repo，可之後手動補。");
    renderList(projectEl, projects, "目前沒有高星專案可顯示。");
  } catch {
    renderList(teachEl, FALLBACK_TEACH, "無法讀取教學列表。");
    renderList(projectEl, FALLBACK_PROJECTS, "無法讀取專案列表。");
  }
}

main();
