/* ==========================================================
   Yu 個人站 — 互動腳本
   資料都在 data.js：PROFILE / THREADS_POSTS / SHARE_ITEMS / PROJECT_ITEMS
   ========================================================== */
(() => {
  "use strict";

  const P = window.PROFILE || {};
  const POSTS = (window.THREADS_POSTS || []).slice().sort((a, b) => b.time.localeCompare(a.time));
  const SHARE = window.SHARE_ITEMS || [];
  const PROJECTS = window.PROJECT_ITEMS || [];
  const page = document.body.dataset.page || "home";

  /* ---------- 小工具 ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 無痕模式等情況忽略 */ } },
  };
  const WEEK = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const fmtDate = (iso) => { const d = new Date(iso); return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`; };
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function ago(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 3600) return `${Math.max(1, Math.round(s / 60))} 分鐘前`;
    if (s < 86400) return `${Math.round(s / 3600)} 小時前`;
    if (s < 86400 * 7) return `${Math.round(s / 86400)} 天前`;
    return fmtDate(iso);
  }
  const firstLine = (p) => (p.parts[0] || "").split("\n").find((l) => l.trim()) || "";
  const postImgs = (p) => p.imgs || [];
  const LANG_COLORS = { JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", Python: "#3572A5", Kotlin: "#A97BFF", PLpgSQL: "#336790", CSS: "#563d7c" };

  const ICON = {
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    threads: '<path d="M16.5 11.2c-.1-2.6-1.6-4.1-4.2-4.1-1.6 0-2.9.7-3.6 1.9l1.4.9c.5-.8 1.2-1.1 2.2-1.1 1.2 0 2 .6 2.3 1.7-.7-.1-1.4-.2-2.2-.1-2.2.1-3.6 1.4-3.5 3.2.1 1.8 1.7 2.9 3.6 2.8 2.4-.1 3.6-1.9 3.8-4.1.8.5 1.3 1.2 1.4 2.1.3 1.9-1.4 3.9-5.6 3.9-4 0-6-2.3-6-6.3S8 5.6 12 5.6c3.3 0 5.4 1.5 6 4.3"/>',
    star: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/>',
    smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 13.5c1.8 2 5.2 2 7 0M9.5 9.5h.01M14.5 9.5h.01"/>',
    gh: '<path fill="currentColor" stroke="none" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .26.18.58.69.48A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    play: '<path fill="currentColor" stroke="none" d="M8 5v14l11-7z"/>',
    pause: '<path fill="currentColor" stroke="none" d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
    shuffle: '<path d="M16 4h4v4M20 4l-6 6M4 20l6-6M16 20h4v-4M20 20l-5.5-5.5M4 4l5 5"/>',
  };
  const svg = (name, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON[name]}</svg>`;

  const NAV = [
    { href: "./index.html", key: "home", label: "首頁", icon: "home" },
    { href: "./posts.html", key: "posts", label: "動態", icon: "threads", count: POSTS.length },
    { href: "./projects.html", key: "projects", label: "我的專案", icon: "grid", count: PROJECTS.length },
    { href: "./share.html", key: "share", label: "教學資源", icon: "star", count: SHARE.length },
    { href: "./about.html", key: "about", label: "關於我", icon: "smile" },
  ];

  /* ---------- 主題 ---------- */
  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  applyTheme(store.get("yu-theme"));
  function isDark() {
    const t = document.documentElement.dataset.theme;
    if (t) return t === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function themeButton() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "theme-toggle";
    const paint = () => {
      b.innerHTML = svg(isDark() ? "sun" : "moon");
      b.setAttribute("aria-label", isDark() ? "切換為淺色" : "切換為深色");
    };
    paint();
    b.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      applyTheme(next);
      store.set("yu-theme", next);
      document.querySelectorAll(".theme-toggle").forEach((x) => x.dispatchEvent(new Event("repaint")));
    });
    b.addEventListener("repaint", paint);
    return b;
  }

  /* ---------- 共同外框 ---------- */
  function mountChrome() {
    const blobs = document.createElement("div");
    blobs.className = "bg-blobs";
    blobs.setAttribute("aria-hidden", "true");
    blobs.innerHTML = "<span></span><span></span><span></span><span></span>";
    document.body.prepend(blobs);

    const top = $("#topNav");
    if (top) {
      top.innerHTML =
        `<a class="home" href="./index.html" title="首頁"><img src="./assets/profile.jpg" alt="Yu 的頭像"></a>` +
        NAV.filter((n) => n.key !== "home")
          .map((n) => `<a href="${n.href}"${n.key === page ? ' class="is-active" aria-current="page"' : ""}>${esc(n.label)}</a>`)
          .join("");
      top.appendChild(themeButton());
    }
    const side = $("#sideNav");
    if (side) {
      side.innerHTML = NAV.map(
        (n) =>
          `<a href="${n.href}"${n.key === page ? ' class="is-active" aria-current="page"' : ""}><span class="nav-ico">${svg(n.icon)}</span>${esc(n.label)}${n.count ? `<span class="count">${n.count}</span>` : ""}</a>`
      ).join("");
    }
    const slot = $("#themeSlot");
    if (slot) slot.appendChild(themeButton());
  }

  /* ---------- 貼文文字：保留換行、把網址變連結 ---------- */
  const TLD = "com|net|org|io|cc|ai|tech|gle|be|app|dev|tw|me|co|so|xyz|info|edu";
  const URL_RE = new RegExp(`(https?:\\/\\/[^\\s，。、）)」]+|(?:[a-zA-Z0-9-]+\\.)+(?:${TLD})(?:\\/[^\\s，。、）)」]*)?)`, "g");
  function strip(u) { return u.replace(/^https?:\/\//, "").replace(/^www\./, ""); }
  function linkify(text, links) {
    return esc(text).replace(URL_RE, (m) => {
      const raw = m.replace(/&amp;/g, "&");
      const trunc = raw.endsWith("…");
      const base = strip(raw.replace(/…$/, ""));
      let href = (links || []).find((l) => strip(l).startsWith(base));
      if (!href) {
        if (trunc) return m;
        href = /^https?:/.test(raw) ? raw : `https://${raw}`;
      }
      return `<a href="${esc(href)}" target="_blank" rel="noopener">${m}</a>`;
    });
  }

  /* ==========================================================
     首頁
     ========================================================== */
  function greetWord(h = new Date().getHours()) {
    if (h < 5) return "Good Night";
    if (h < 11) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    if (h < 22) return "Good Evening";
    return "Good Night";
  }

  function tickClock() {
    const el = $("#clock");
    if (!el) return;
    const d = new Date();
    el.innerHTML = `${pad(d.getHours())}<span class="colon">:</span>${pad(d.getMinutes())}`;
    const sub = $("#clockSub");
    if (sub) sub.textContent = `${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${WEEK[d.getDay()]}`;
  }

  function renderCalendar() {
    const title = $("#calTitle");
    const grid = $("#calendar");
    if (!title || !grid) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    title.textContent = `${y} / ${m + 1}`;
    const byDay = {};
    POSTS.forEach((p) => { const k = dayKey(new Date(p.time)); (byDay[k] = byDay[k] || []).push(p); });
    const monthCount = POSTS.filter((p) => { const d = new Date(p.time); return d.getFullYear() === y && d.getMonth() === m; }).length;
    const note = $("#calNote");
    if (note) note.textContent = monthCount ? `本月發文 ${monthCount} 則` : "本月還沒發文";
    const start = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    let html = ["一", "二", "三", "四", "五", "六", "日"].map((d) => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < start; i++) html += `<div class="day is-empty"></div>`;
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${pad(m + 1)}-${pad(d)}`;
      const cls = `day${d === now.getDate() ? " is-today" : ""}${byDay[k] ? " has-post" : ""}`;
      html += byDay[k]
        ? `<a class="${cls}" href="./posts.html#${byDay[k][0].id}" title="${byDay[k].length} 則貼文">${d}</a>`
        : `<div class="${cls}">${d}</div>`;
    }
    grid.innerHTML = html;
  }

  function renderLatest() {
    const box = $("#latest");
    if (!box || !POSTS.length) return;
    const p = POSTS[0];
    const imgs = postImgs(p).slice(0, 2);
    box.innerHTML = `
      <div class="latest-body">
        <div>
          <div class="latest-meta">${p.tag ? `<span class="chip">${esc(p.tag)}</span>` : ""}<time datetime="${p.time}">${ago(p.time)}</time></div>
          <p class="latest-text">${esc(p.parts.join("\n\n"))}</p>
        </div>
        ${imgs.length ? `<div class="latest-imgs">${imgs.map((i) => `<img src="${i.src}" alt="${esc(i.alt)}" loading="lazy">`).join("")}</div>` : ""}
      </div>
      <div class="latest-foot">
        <a class="btn" href="./posts.html#${p.id}">閱讀全文</a>
        <a class="btn btn--ghost" href="${p.url}" target="_blank" rel="noopener">在 Threads 查看 ${svg("ext")}</a>
      </div>
      <ul class="latest-list">
        ${POSTS.slice(1, 5).map((q) => `<li><a href="./posts.html#${q.id}"><time>${fmtDate(q.time).slice(5)}</time><span>${esc(firstLine(q))}</span></a></li>`).join("")}
      </ul>`;
  }

  function renderPolaroids() {
    const box = $("#polaroids");
    if (!box) return;
    const picks = [];
    for (const p of POSTS) {
      const img = postImgs(p).find((i) => i.h >= i.w * 0.9);
      if (img) picks.push({ p, img });
      if (picks.length === 3) break;
    }
    box.innerHTML = picks
      .map(({ p, img }) => `<a class="polaroid" href="./posts.html#${p.id}" title="${esc(firstLine(p))}"><img src="${img.src}" alt="${esc(img.alt || firstLine(p))}" loading="lazy"></a>`)
      .join("");
  }

  function setupRecommend() {
    const card = $("#recCard");
    if (!card) return;
    const pool = [
      ...SHARE.map((s) => ({ title: s.title, desc: s.desc, url: s.site || s.url, badge: s.cats[0] })),
      ...PROJECTS.map((s) => ({ title: s.name, desc: s.desc, url: s.site || s.url, badge: s.tags[0] })),
    ];
    let last = -1;
    const pick = () => {
      let i;
      do { i = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && i === last);
      last = i;
      const it = pool[i];
      card.href = it.url;
      $("#recThumb").textContent = it.badge;
      $("#recTitle").textContent = it.title;
      $("#recDesc").textContent = it.desc;
    };
    pick();
    const btn = $("#recShuffle");
    if (btn) btn.addEventListener("click", pick);
  }

  /* 專注白噪音（Web Audio 即時合成，不需任何音檔） */
  function setupNoise() {
    const box = $("#noise");
    if (!box) return;
    const btn = $("#noiseBtn");
    const label = $("#noiseLabel");
    const TYPES = { rain: "雨聲", brown: "棕噪音", white: "白噪音" };
    let type = "rain";
    let ctx, src, gain, playing = false;

    function buffer(kind) {
      const len = ctx.sampleRate * 4;
      const b = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === "white") d[i] = w * 0.35;
        else { last = (last + 0.02 * w) / 1.02; d[i] = last * (kind === "brown" ? 3.2 : 2.2); }
        if (kind === "rain" && Math.random() < 0.0009) d[i] += (Math.random() - 0.5) * 0.9;
      }
      return b;
    }
    function start() {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      src = ctx.createBufferSource();
      src.buffer = buffer(type);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = type === "rain" ? "highpass" : "lowpass";
      filter.frequency.value = type === "rain" ? 400 : type === "brown" ? 900 : 9000;
      gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.8);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
    }
    function stop() {
      if (!src) return;
      const s = src;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => s.stop(), 350);
      src = null;
    }
    function paint() {
      box.classList.toggle("is-playing", playing);
      btn.innerHTML = svg(playing ? "pause" : "play");
      btn.setAttribute("aria-label", playing ? "暫停" : "播放");
      label.textContent = playing ? `正在播放 · ${TYPES[type]}` : "點擊播放，陪你專注";
    }
    btn.addEventListener("click", () => {
      playing = !playing;
      if (playing) start(); else stop();
      paint();
    });
    box.querySelectorAll("[data-noise]").forEach((b) =>
      b.addEventListener("click", () => {
        type = b.dataset.noise;
        box.querySelectorAll("[data-noise]").forEach((x) => x.classList.toggle("is-active", x === b));
        if (playing) { stop(); start(); }
        paint();
      })
    );
    paint();
  }

  /* 番茄鐘 */
  function setupPomodoro() {
    const t = $("#pomoTime");
    const btn = $("#pomoBtn");
    if (!t || !btn) return;
    const FULL = 25 * 60;
    let left = FULL, timer = null;
    const paint = () => {
      t.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
      btn.textContent = timer ? "暫停" : left === FULL ? "開始" : "繼續";
    };
    btn.addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = null; }
      else {
        timer = setInterval(() => {
          left -= 1;
          if (left <= 0) { clearInterval(timer); timer = null; left = FULL; document.title = "⏰ 休息一下！"; }
          paint();
        }, 1000);
      }
      paint();
    });
    t.addEventListener("dblclick", () => { clearInterval(timer); timer = null; left = FULL; paint(); });
    paint();
  }

  function setupLike() {
    const btn = $("#likeBtn");
    const txt = $("#likeText");
    if (!btn) return;
    let on = store.get("yu-liked") === "1";
    const paint = () => {
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
      txt.textContent = on ? "謝謝你的喜歡 ♡" : "喜歡這個網站嗎？";
    };
    btn.addEventListener("click", () => { on = !on; store.set("yu-liked", on ? "1" : "0"); paint(); });
    paint();
  }

  function initHome() {
    const g = $("#greetPart");
    if (g) g.textContent = greetWord();
    const st = $("#stats");
    if (st) {
      const stars = PROJECTS.reduce((s, p) => s + (p.stars || 0), 0);
      st.innerHTML = `<div class="stat"><b>${POSTS.length}</b><span>篇動態</span></div><div class="stat"><b>${PROJECTS.length + SHARE.filter((s) => !PROJECTS.some((p) => p.name === s.name)).length}</b><span>個專案</span></div><div class="stat"><b>${stars}</b><span>GitHub ★</span></div>`;
    }
    tickClock();
    setInterval(tickClock, 10000);
    renderCalendar();
    renderLatest();
    renderPolaroids();
    setupRecommend();
    setupNoise();
    setupPomodoro();
    setupLike();
  }

  /* ==========================================================
     動態頁
     ========================================================== */
  const lightbox = (() => {
    let el, list = [], idx = 0;
    function build() {
      el = document.createElement("div");
      el.className = "lightbox";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.innerHTML = `<img alt=""><button class="lb-close" aria-label="關閉">✕</button><button class="lb-prev" aria-label="上一張">‹</button><button class="lb-next" aria-label="下一張">›</button><div class="lb-count"></div>`;
      document.body.appendChild(el);
      el.addEventListener("click", (e) => { if (e.target === el) close(); });
      $(".lb-close", el).addEventListener("click", close);
      $(".lb-prev", el).addEventListener("click", () => show(idx - 1));
      $(".lb-next", el).addEventListener("click", () => show(idx + 1));
      document.addEventListener("keydown", (e) => {
        if (!el.classList.contains("is-open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(idx - 1);
        if (e.key === "ArrowRight") show(idx + 1);
      });
    }
    function show(i) {
      idx = (i + list.length) % list.length;
      const img = $("img", el);
      img.src = list[idx].src;
      img.alt = list[idx].alt || "";
      $(".lb-count", el).textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : "";
      $(".lb-prev", el).hidden = $(".lb-next", el).hidden = list.length < 2;
    }
    function open(imgs, i) { if (!el) build(); list = imgs; el.classList.add("is-open"); show(i); $(".lb-close", el).focus(); }
    function close() { el.classList.remove("is-open"); }
    return { open };
  })();

  function postHTML(p) {
    const imgs = postImgs(p);
    const n = imgs.length;
    const cls = n === 0 ? "" : n <= 4 ? `n${n}` : "many";
    const total = p.parts.length;
    const body = p.parts
      .map((t, i) => `<div class="post-part">${total > 1 ? `<span class="post-part-label">${i + 1} / ${total}</span>` : ""}<div class="post-text">${linkify(t, p.links)}</div></div>`)
      .join("");
    const shownLinks = p.links.filter((l) => !/threads\.com|l\.threads/.test(l)).slice(0, 4);
    return `
      <article class="card post rise" id="${p.id}" data-id="${p.id}">
        <header class="post-head">
          <img src="./assets/profile.jpg" alt="">
          <div><div class="who">${esc(P.name)} <span class="muted" style="font-weight:500">@${esc(P.handle)}</span></div>
          <time class="when" datetime="${p.time}" title="${new Date(p.time).toLocaleString("zh-TW")}">${ago(p.time) === fmtDate(p.time) ? fmtDate(p.time) : `${fmtDate(p.time)} · ${ago(p.time)}`}</time></div>
          ${p.tag ? `<span class="chip">${esc(p.tag)}</span>` : ""}
        </header>
        <div class="post-body">${body}</div>
        <button class="post-more" type="button" hidden>展開全文</button>
        ${n ? `<div class="post-media ${cls}">${imgs.map((im, i) => `<button type="button" data-i="${i}" aria-label="放大圖片 ${i + 1}"><img src="${im.src}" alt="${esc(im.alt)}" loading="lazy" width="${im.w}" height="${im.h}"></button>`).join("")}</div>` : ""}
        ${shownLinks.length ? `<div class="post-links">${shownLinks.map((l) => `<a href="${esc(l)}" target="_blank" rel="noopener">${svg("link", 'width="13" height="13"')}${esc(strip(l).split("?")[0].slice(0, 48))}</a>`).join("")}</div>` : ""}
        <footer class="post-foot"><a href="${p.url}" target="_blank" rel="noopener">在 Threads 查看 ${svg("ext")}</a></footer>
      </article>`;
  }

  function initPosts() {
    const feed = $("#feed");
    if (!feed) return;
    const filters = $("#filters");
    const search = $("#search");
    const months = $("#months");
    const more = $("#loadMore");
    const count = $("#feedCount");
    const PAGE = 10;

    const tagCount = {};
    POSTS.forEach((p) => { const t = p.tag || "日常雜談"; tagCount[t] = (tagCount[t] || 0) + 1; });
    const tags = ["全部", ...Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]), "有圖片"];
    filters.innerHTML = tags
      .map((t, i) => `<button type="button" class="chip-btn${i === 0 ? " is-active" : ""}" data-tag="${esc(t)}">${esc(t)}<small>${t === "全部" ? POSTS.length : t === "有圖片" ? POSTS.filter((p) => postImgs(p).length).length : tagCount[t]}</small></button>`)
      .join("");

    const monthCount = {};
    POSTS.forEach((p) => { const d = new Date(p.time); const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; monthCount[k] = (monthCount[k] || 0) + 1; });
    months.innerHTML =
      `<button type="button" class="is-active" data-month="">全部月份<span>${POSTS.length}</span></button>` +
      Object.keys(monthCount).sort().reverse()
        .map((k) => `<button type="button" data-month="${k}">${k.replace("-", " 年 ").replace(/^(\d+ 年 )0?/, "$1")} 月<span>${monthCount[k]}</span></button>`)
        .join("");

    let tag = "全部", month = "", q = "", shown = PAGE, list = POSTS;

    function apply() {
      list = POSTS.filter((p) => {
        if (tag === "有圖片" && !postImgs(p).length) return false;
        if (tag !== "全部" && tag !== "有圖片" && (p.tag || "日常雜談") !== tag) return false;
        if (month && !fmtDate(p.time).replace("/", "-").startsWith(month)) return false;
        if (q && !p.parts.join(" ").toLowerCase().includes(q)) return false;
        return true;
      });
      paint();
    }
    function paint() {
      const slice = list.slice(0, shown);
      feed.innerHTML = slice.length ? slice.map(postHTML).join("") : `<div class="card empty">沒有符合的貼文</div>`;
      more.hidden = list.length <= shown;
      count.textContent = `共 ${list.length} 則`;
      feed.querySelectorAll(".post").forEach((el) => {
        const body = $(".post-body", el);
        if (body.scrollHeight > 400) {
          el.classList.add("is-clamped");
          const b = $(".post-more", el);
          b.hidden = false;
          b.addEventListener("click", () => {
            const open = el.classList.toggle("is-clamped");
            b.textContent = open ? "展開全文" : "收合";
            if (open) el.scrollIntoView({ block: "nearest" });
          });
        }
      });
    }
    feed.addEventListener("click", (e) => {
      const b = e.target.closest(".post-media button");
      if (!b) return;
      const p = POSTS.find((x) => x.id === b.closest(".post").dataset.id);
      lightbox.open(postImgs(p), Number(b.dataset.i));
    });
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tag]");
      if (!b) return;
      tag = b.dataset.tag;
      filters.querySelectorAll("[data-tag]").forEach((x) => x.classList.toggle("is-active", x === b));
      shown = PAGE; apply();
    });
    months.addEventListener("click", (e) => {
      const b = e.target.closest("[data-month]");
      if (!b) return;
      month = b.dataset.month;
      months.querySelectorAll("[data-month]").forEach((x) => x.classList.toggle("is-active", x === b));
      shown = PAGE; apply();
    });
    let timer;
    search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => { q = search.value.trim().toLowerCase(); shown = PAGE; apply(); }, 150);
    });
    more.addEventListener("click", () => { shown += PAGE; paint(); });

    apply();

    function goHash() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const i = list.findIndex((p) => p.id === id);
      if (i < 0) return;
      if (i >= shown) { shown = i + 1; paint(); }
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove("is-clamped");
      const b = $(".post-more", el); if (b && !b.hidden) b.textContent = "收合";
      el.classList.add("is-target");
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      setTimeout(() => el.classList.remove("is-target"), 2600);
    }
    window.addEventListener("hashchange", goHash);
    goHash();
  }

  /* ==========================================================
     教學資源 / 專案
     ========================================================== */
  function footHTML(it) {
    const lang = it.lang ? `<span><i class="lang-dot" style="background:${LANG_COLORS[it.lang] || "#999"}"></i>${esc(it.lang)}</span>` : "";
    const star = it.stars ? `<span><span class="star">★</span> ${it.stars}</span>` : "";
    return `<div class="item-foot"><span class="meta">${lang}${star}</span><span class="item-links">${it.site ? `<a class="primary" href="${esc(it.site)}" target="_blank" rel="noopener">開啟</a>` : ""}<a href="${esc(it.url)}" target="_blank" rel="noopener">GitHub</a></span></div>`;
  }
  function shareCard(it, i) {
    return `<article class="card item-card" style="animation-delay:${Math.min(i, 10) * 0.04}s">
      <div class="item-head"><div class="thumb">${esc(it.cats[0])}</div><div><h3>${esc(it.title)}</h3><span class="repo">${esc(it.name)}</span></div></div>
      <div class="item-tags">${it.cats.map((c) => `<span class="chip chip--plain">${esc(c)}</span>`).join("")}</div>
      <p class="item-desc">${esc(it.desc)}</p>
      ${footHTML(it)}
    </article>`;
  }
  function projCard(it, i, featured) {
    return `<article class="card item-card" style="animation-delay:${Math.min(i, 10) * 0.04}s">
      <div class="item-head"><div class="thumb">${esc(it.tags[0])}</div><div><h3>${esc(it.name)}</h3><span class="repo">github.com/Yu-0312</span></div></div>
      ${featured ? `<div class="big-star">★ ${it.stars}<small>stars</small></div>` : ""}
      <div class="item-tags">${it.tags.map((c) => `<span class="chip chip--plain">${esc(c)}</span>`).join("")}</div>
      <p class="item-desc">${esc(it.desc)}</p>
      ${footHTML(it)}
    </article>`;
  }

  function initShare() {
    const grid = $("#grid");
    if (!grid) return;
    const filters = $("#filters");
    const search = $("#search");
    const cats = ["全部", ...new Set(SHARE.flatMap((i) => i.cats))];
    filters.innerHTML = cats.map((c, i) => `<button type="button" class="chip-btn${i === 0 ? " is-active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    let cat = "全部", q = "";
    const paint = () => {
      const list = SHARE.filter((it) => (cat === "全部" || it.cats.includes(cat)) && (!q || `${it.title} ${it.name} ${it.desc}`.toLowerCase().includes(q)));
      grid.innerHTML = list.length ? list.map(shareCard).join("") : `<div class="empty">沒有符合的項目</div>`;
    };
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      cat = b.dataset.cat;
      filters.querySelectorAll("[data-cat]").forEach((x) => x.classList.toggle("is-active", x === b));
      paint();
    });
    search.addEventListener("input", () => { q = search.value.trim().toLowerCase(); paint(); });
    paint();
  }

  function initProjects() {
    const grid = $("#projGrid");
    if (!grid) return;
    const sorted = [...PROJECTS].sort((a, b) => (b.stars || 0) - (a.stars || 0));
    $("#projFeature").innerHTML = sorted.slice(0, 3).map((p, i) => projCard(p, i, true)).join("");
    grid.innerHTML = sorted.slice(3).map((p, i) => projCard(p, i + 3, false)).join("");
  }

  /* ==========================================================
     關於
     ========================================================== */
  function initAbout() {
    const f = $("#facts");
    if (!f) return;
    const first = POSTS[POSTS.length - 1];
    const stars = PROJECTS.reduce((s, p) => s + (p.stars || 0), 0);
    f.innerHTML = [
      [POSTS.length, "則 Threads 動態"],
      [PROJECTS.length, "個個人專案"],
      [SHARE.length, "個互動教學網站"],
      [stars, "GitHub 累積星星"],
      [first ? fmtDate(first.time) : "—", "網站收錄的第一則動態"],
    ].map(([b, s]) => `<div class="fact"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("");
    const topics = $("#topics");
    if (topics) {
      const c = {};
      POSTS.forEach((p) => { if (p.tag) c[p.tag] = (c[p.tag] || 0) + 1; });
      topics.innerHTML = Object.keys(c).sort((a, b) => c[b] - c[a]).map((t) => `<a class="chip" href="./posts.html">${esc(t)} · ${c[t]}</a>`).join("");
    }
  }

  mountChrome();
  if (page === "home") initHome();
  if (page === "posts") initPosts();
  if (page === "share") initShare();
  if (page === "projects") initProjects();
  if (page === "about") initAbout();
})();
