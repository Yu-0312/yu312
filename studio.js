/* ==========================================================
   Yu Studio — 設定 / 佈局 / 配色 / 寫作 / 瀏覽統計
   對應 lvyovo-wiki 的功能面，介面走自己的暖色手帳風
   ========================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
    json(k, d) { try { return JSON.parse(store.get(k)) ?? d; } catch { return d; } },
    setJson(k, v) { store.set(k, JSON.stringify(v)); },
  };

  /* ---------- 預設設定 ---------- */
  const DEFAULTS = {
    siteTitle: "Yu · 王宇錡",
    username: "Yu",
    tagline: "好吧其實我是一名普通的學生，會更新日常 / 實用工具 / AI 新知。",
    clockSeconds: false,
    showCategories: true,
    accent: "#3cbfa8",
    palette: "mint",
    socials: [
      { id: "threads", label: "Threads", url: "https://www.threads.com/@yuqi._.0313" },
      { id: "github", label: "GitHub", url: "https://github.com/Yu-0312" },
      { id: "email", label: "Email", url: "mailto:wang.yuchi.312@gmail.com" },
    ],
    layoutOrder: [],
    likeBase: 3890,
  };

  const PALETTES = {
    mint: { name: "薄荷", accent: "#3cbfa8", accent2: "#2fa893", bg: "#e6e7e6", wash1: "rgba(232,232,236,0.95)", wash2: "rgba(242,242,238,0.9)", wash3: "rgba(214,216,140,0.95)", wash4: "rgba(186,212,186,0.95)", ink: "#3d4f48", ink2: "#6f8179", ink3: "#93a69c" },
    ember: { name: "暖爐", accent: "#c45c26", accent2: "#e07a5f", bg: "#f6efe3", wash1: "rgba(224,122,95,0.22)", wash2: "rgba(255,248,235,0.9)", wash3: "rgba(129,178,154,0.28)", wash4: "rgba(244,198,120,0.32)", ink: "#2c2418", ink2: "#6b5c4c", ink3: "#9a8b7a" },
    sage: { name: "苔綠", accent: "#3d7a5c", accent2: "#81b29a", bg: "#eef2ea", wash1: "rgba(129,178,154,0.3)", wash2: "rgba(255,255,250,0.85)", wash3: "rgba(196,92,38,0.18)", wash4: "rgba(168,196,140,0.32)", ink: "#243028", ink2: "#5c6b60", ink3: "#8a988c" },
    plum: { name: "李子", accent: "#7b3d5b", accent2: "#c47b9a", bg: "#f4eef1", wash1: "rgba(196,123,154,0.24)", wash2: "rgba(255,250,252,0.88)", wash3: "rgba(122,140,180,0.22)", wash4: "rgba(220,180,160,0.28)", ink: "#2e2230", ink2: "#6b5568", ink3: "#9a8498" },
    ocean: { name: "深海", accent: "#1f6f8b", accent2: "#3d9bb8", bg: "#eaf1f4", wash1: "rgba(61,155,184,0.22)", wash2: "rgba(250,253,255,0.88)", wash3: "rgba(232,168,96,0.22)", wash4: "rgba(120,180,190,0.3)", ink: "#1c2e36", ink2: "#546872", ink3: "#8aa0aa" },
    night: { name: "夜航", accent: "#e8a87c", accent2: "#c47b9a", bg: "#2a2622", wash1: "rgba(232,168,124,0.18)", wash2: "rgba(60,52,46,0.7)", wash3: "rgba(100,80,70,0.35)", wash4: "rgba(80,60,90,0.3)", ink: "#f2e8dc", ink2: "#c4b4a4", ink3: "#9a8a7a" },
  };

  function loadSettings() {
    const saved = store.json("yu-settings", {});
    // migrate old ember default (pre-mint) so the kawaii mint look stays the house default
    if (saved.palette === "ember" && (!saved.accent || saved.accent === "#c45c26")) {
      delete saved.palette;
      delete saved.accent;
    }
    return { ...DEFAULTS, ...saved, socials: saved.socials || DEFAULTS.socials };
  }
  function saveSettings(s) { store.setJson("yu-settings", s); }

  function applyPalette(key, accentOverride) {
    const p = PALETTES[key] || PALETTES.mint;
    const root = document.documentElement;
    const accent = accentOverride || p.accent;
    root.style.setProperty("--brand", accent);
    root.style.setProperty("--brand-2", p.accent2);
    root.style.setProperty("--brand-deep", accent);
    root.style.setProperty("--brand-soft", hexA(accent, 0.16));
    root.style.setProperty("--bg", p.bg);
    root.style.setProperty("--ink", p.ink);
    root.style.setProperty("--ink-2", p.ink2);
    root.style.setProperty("--ink-3", p.ink3);
    root.style.setProperty("--wash-1", p.wash1);
    root.style.setProperty("--wash-2", p.wash2);
    root.style.setProperty("--wash-3", p.wash3);
    root.style.setProperty("--wash-4", p.wash4);
    root.dataset.palette = key;
    root.dataset.theme = key === "night" ? "dark" : root.dataset.theme || "light";
    if (key === "night") root.dataset.theme = "dark";
  }

  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ---------- 瀏覽計數（localStorage 模擬 Views/Marks） ---------- */
  const views = {
    key: (id) => `yu-view:${id}`,
    bump(id) {
      const k = this.key(id);
      const n = Number(store.get(k, "0")) + 1;
      store.set(k, String(n));
      return n;
    },
    get(id) {
      return Number(store.get(this.key(id), "0")) + hashSeed(id) % 400 + 80;
    },
    mark(id) {
      const k = `yu-mark:${id}`;
      const on = store.get(k) === "1";
      if (on) { store.del(k); return false; }
      store.set(k, "1"); return true;
    },
    marked(id) { return store.get(`yu-mark:${id}`) === "1"; },
    markCount(id) { return hashSeed(id + "m") % 90 + (this.marked(id) ? 12 : 5); },
  };
  function hashSeed(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  // 立刻掛上，讓 site.js 畫卡片時就拿得到
  window.YU = window.YU || {};
  window.YU.views = views;
  window.YU.loadSettings = loadSettings;

  // 套用目前配色，避免閃一下預設色
  const _early = loadSettings();
  applyPalette(_early.palette, _early.accent);

  /* ---------- 網站按讚（♥）：獨立於 Threads，儲存在瀏覽器 ---------- */
  function setupLikeDaily() {
    const btn = $("#likeBtn");
    if (!btn) return;
    const base = Number(loadSettings().likeBase) || 3890;
    const state = store.json("yu-site-like", { on: false, total: base });
    if (!Number.isFinite(Number(state.total))) state.total = base;
    const paint = () => {
      btn.classList.toggle("is-on", state.on);
      btn.setAttribute("aria-pressed", String(state.on));
      const t = $("#likeText");
      if (t) t.textContent = state.on ? `已按讚 · ${Number(state.total).toLocaleString()}` : `讚 · ${Number(state.total).toLocaleString()}`;
    };
    btn.addEventListener("click", () => {
      state.on = !state.on;
      state.total = Math.max(0, Number(state.total) + (state.on ? 1 : -1));
      store.setJson("yu-site-like", state);
      btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 280 });
      paint();
    });
    window.addEventListener("storage", (event) => {
      if (event.key !== "yu-site-like" || !event.newValue) return;
      try {
        const next = JSON.parse(event.newValue);
        if (typeof next.on === "boolean" && Number.isFinite(Number(next.total))) {
          state.on = next.on;
          state.total = Number(next.total);
          paint();
        }
      } catch {}
    });
    paint();
  }

  /* ---------- 首頁卡片拖拽排序 ---------- */
  // 多頁首頁用 p-nav…p-extra；一屏 dashboard 用 p-left / p-center / p-right
  const CARD_IDS = ["p-left", "p-center", "p-right", "p-nav", "p-greet", "p-art", "p-tools", "p-latest", "p-social", "p-recommend", "p-extra"];

  function dragLabel(el) {
    const map = {
      "p-left": "左欄", "p-center": "中欄", "p-right": "右欄",
      "p-nav": "導覽", "p-greet": "問候", "p-art": "圖片牆",
      "p-tools": "時鐘月曆", "p-latest": "最新動態", "p-social": "社群",
      "p-recommend": "隨機推薦", "p-extra": "專注工具",
    };
    for (const id of CARD_IDS) if (el.classList.contains(id)) return map[id];
    return "卡片";
  }

  function setupDragLayout() {
    const board = $(".board");
    if (!board) return;
    const order = loadSettings().layoutOrder;
    if (order && order.length) {
      const kids = Array.from(board.children);
      order.forEach((cls) => {
        const el = kids.find((k) => k.classList.contains(cls));
        if (el) board.appendChild(el);
      });
    }

    let dragEl = null;
    board.classList.add("can-drag");
    $$(".board > *").forEach((el) => {
      el.draggable = true;
      el.dataset.dragLabel = dragLabel(el);
      el.addEventListener("dragstart", (e) => {
        dragEl = el;
        el.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", el.className); } catch { /* */ }
      });
      el.addEventListener("dragend", () => {
        el.classList.remove("is-dragging");
        dragEl = null;
        persistOrder();
      });
    });
    board.addEventListener("dragover", (e) => {
      e.preventDefault();
      const after = getAfter(board, e.clientY, e.clientX);
      if (!dragEl) return;
      if (after == null) board.appendChild(dragEl);
      else board.insertBefore(dragEl, after);
    });
    function getAfter(container, y, x) {
      const els = [...container.querySelectorAll(":scope > *:not(.is-dragging)")];
      let best = null, bestDist = Infinity;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        const cy = r.top + r.height / 2, cx = r.left + r.width / 2;
        const d = (cy - y) ** 2 + (cx - x) ** 2;
        if (d < bestDist && (cy > y || cx > x - r.width * 0.3)) { bestDist = d; best = el; }
      });
      return best;
    }
    function persistOrder() {
      const order = $$(".board > *").map((el) => CARD_IDS.find((id) => el.classList.contains(id))).filter(Boolean);
      const s = loadSettings();
      s.layoutOrder = order;
      saveSettings(s);
    }

    window.YU = window.YU || {};
    window.YU.setLayoutMode = (on) => {
      board.classList.toggle("layout-mode", on);
      $$(".board > *").forEach((el) => {
        el.draggable = on;
        if (on) {
          el.classList.add("drag-card");
          if (!$(".drag-tag", el)) {
            const tag = document.createElement("span");
            tag.className = "drag-tag";
            tag.textContent = el.dataset.dragLabel || "卡片";
            el.prepend(tag);
          }
        } else {
          el.classList.remove("drag-card");
          const t = $(".drag-tag", el);
          if (t) t.remove();
        }
      });
    };
  }

  /* ---------- 設定面板 ---------- */
  function setupSettings() {
    const s0 = loadSettings();
    applyPalette(s0.palette, s0.accent);

    const root = document.createElement("div");
    root.className = "studio-backdrop";
    root.hidden = true;
    root.innerHTML = `
      <div class="studio" role="dialog" aria-modal="true" aria-label="網站設定">
        <header class="studio-head">
          <div class="studio-tabs" role="tablist">
            <button type="button" class="is-active" data-tab="site" role="tab">網站設定</button>
            <button type="button" data-tab="color" role="tab">色彩配置</button>
            <button type="button" data-tab="layout" role="tab">首頁佈局</button>
          </div>
          <div class="studio-actions">
            <button type="button" class="btn btn--ghost" id="studioCancel">關閉</button>
            <button type="button" class="btn" id="studioSave">儲存</button>
          </div>
        </header>
        <div class="studio-body">
          <section class="studio-pane is-active" data-pane="site">
            <label class="field"><span>站點標題</span><input id="fTitle" type="text" maxlength="40"></label>
            <label class="field"><span>使用者名稱</span><input id="fUser" type="text" maxlength="24"></label>
            <label class="field field--full"><span>一句話介紹</span><textarea id="fTagline" rows="2" maxlength="120"></textarea></label>
            <div class="field field--full">
              <span>社群按鈕</span>
              <div id="socialList" class="social-edit"></div>
              <button type="button" class="btn btn--ghost btn-sm" id="addSocial">+ 新增連結</button>
            </div>
            <label class="check"><input type="checkbox" id="fClockSec"><span>時鐘顯示秒數</span></label>
            <label class="check"><input type="checkbox" id="fCats"><span>顯示文章分類</span></label>
          </section>
          <section class="studio-pane" data-pane="color">
            <p class="hint">選一套配色，或直接調主色。按「隨機配色」會抽一組驚喜。</p>
            <div class="palette-grid" id="paletteGrid"></div>
            <label class="field"><span>主色</span>
              <div class="color-row">
                <input type="color" id="fAccent" value="#c45c26">
                <code id="fAccentHex">#c45c26</code>
                <button type="button" class="btn btn--ghost btn-sm" id="randomColor">隨機配色</button>
              </div>
            </label>
          </section>
          <section class="studio-pane" data-pane="layout">
            <p class="hint">回到首頁後拖曳卡片即可排序；也可以在這裡重設成預設順序。</p>
            <ol class="layout-list" id="layoutList"></ol>
            <button type="button" class="btn btn--ghost btn-sm" id="resetLayout">重設佈局</button>
          </section>
        </div>
      </div>`;
    document.body.appendChild(root);

    const open = () => {
      root.hidden = false;
      document.body.classList.add("studio-open");
      fillForm();
    };
    const close = () => {
      root.hidden = true;
      document.body.classList.remove("studio-open");
    };

    function fillForm() {
      const s = loadSettings();
      $("#fTitle", root).value = s.siteTitle;
      $("#fUser", root).value = s.username;
      $("#fTagline", root).value = s.tagline;
      $("#fClockSec", root).checked = s.clockSeconds;
      $("#fCats", root).checked = s.showCategories;
      $("#fAccent", root).value = s.accent;
      $("#fAccentHex", root).textContent = s.accent;
      paintSocials(s.socials);
      paintPalettes(s.palette);
      paintLayoutList();
    }

    function paintSocials(list) {
      const box = $("#socialList", root);
      box.innerHTML = list.map((it, i) => `
        <div class="social-row-edit" data-i="${i}">
          <input type="text" class="s-label" value="${esc(it.label)}" placeholder="名稱" maxlength="16">
          <input type="url" class="s-url" value="${esc(it.url)}" placeholder="https://…">
          <button type="button" class="s-up" aria-label="上移">↑</button>
          <button type="button" class="s-down" aria-label="下移">↓</button>
          <button type="button" class="s-del" aria-label="刪除">✕</button>
        </div>`).join("");
    }
    function readSocials() {
      return $$(".social-row-edit", root).map((row) => ({
        id: "custom",
        label: $(".s-label", row).value.trim() || "連結",
        url: $(".s-url", row).value.trim(),
      })).filter((x) => x.url);
    }

    function paintPalettes(active) {
      const grid = $("#paletteGrid", root);
      grid.innerHTML = Object.entries(PALETTES).map(([k, p]) => `
        <button type="button" class="palette-card${k === active ? " is-active" : ""}" data-pal="${k}">
          <span class="pal-swatch" style="background:${p.accent};box-shadow:inset 0 0 0 8px ${p.bg}"></span>
          <span>${p.name}</span>
        </button>`).join("");
    }

    function paintLayoutList() {
      const order = loadSettings().layoutOrder.length ? loadSettings().layoutOrder : CARD_IDS;
      $("#layoutList", root).innerHTML = order.map((id, i) => `<li><span class="num">${i + 1}</span>${id.replace("p-", "")}</li>`).join("");
    }

    root.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]");
      if (tab) {
        $$(".studio-tabs [data-tab]", root).forEach((b) => b.classList.toggle("is-active", b === tab));
        $$(".studio-pane", root).forEach((p) => p.classList.toggle("is-active", p.dataset.pane === tab.dataset.tab));
        return;
      }
      if (e.target.closest("#studioCancel")) return close();
      if (e.target.closest("#studioSave")) {
        const s = loadSettings();
        s.siteTitle = $("#fTitle", root).value.trim() || DEFAULTS.siteTitle;
        s.username = $("#fUser", root).value.trim() || DEFAULTS.username;
        s.tagline = $("#fTagline", root).value.trim();
        s.clockSeconds = $("#fClockSec", root).checked;
        s.showCategories = $("#fCats", root).checked;
        s.accent = $("#fAccent", root).value;
        s.palette = root.dataset.palette || s.palette;
        s.socials = readSocials();
        saveSettings(s);
        applyPalette(s.palette, s.accent);
        toast("設定已儲存在這台裝置");
        close();
        setTimeout(() => location.reload(), 400);
        return;
      }
      if (e.target.closest("#addSocial")) {
        const list = readSocials();
        list.push({ id: "custom", label: "連結", url: "https://" });
        paintSocials(list);
        return;
      }
      const row = e.target.closest(".social-row-edit");
      if (row) {
        const i = Number(row.dataset.i);
        const list = readSocials();
        if (e.target.closest(".s-del")) { list.splice(i, 1); paintSocials(list); return; }
        if (e.target.closest(".s-up") && i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; paintSocials(list); return; }
        if (e.target.closest(".s-down") && i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; paintSocials(list); return; }
      }
      const pal = e.target.closest("[data-pal]");
      if (pal) {
        const k = pal.dataset.pal;
        $$(".palette-card", root).forEach((c) => c.classList.toggle("is-active", c === pal));
        root.dataset.palette = k;
        applyPalette(k);
        $("#fAccent", root).value = PALETTES[k].accent;
        $("#fAccentHex", root).textContent = PALETTES[k].accent;
        return;
      }
      if (e.target.closest("#randomColor")) {
        const keys = Object.keys(PALETTES);
        const k = keys[Math.floor(Math.random() * keys.length)];
        $$(".palette-card", root).forEach((c) => c.classList.toggle("is-active", c.dataset.pal === k));
        root.dataset.palette = k;
        applyPalette(k);
        $("#fAccent", root).value = PALETTES[k].accent;
        $("#fAccentHex", root).textContent = PALETTES[k].accent;
        return;
      }
      if (e.target.closest("#resetLayout")) {
        const s = loadSettings();
        s.layoutOrder = [];
        saveSettings(s);
        paintLayoutList();
        toast("佈局已重設，重新整理後生效");
      }
    });

    root.addEventListener("input", (e) => {
      if (e.target.id === "fAccent") {
        $("#fAccentHex", root).textContent = e.target.value;
        applyPalette(root.dataset.palette || "mint", e.target.value);
      }
    });

    // 快捷鍵 Ctrl/Cmd + ,
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        if (root.hidden) open(); else close();
      }
      if (e.key === "Escape" && !root.hidden) close();
    });

    // 浮動入口：設定 + 佈局
    const fab = document.createElement("button");
    fab.type = "button";
    fab.className = "studio-fab";
    fab.title = "網站設定（Ctrl/Cmd + ,）";
    fab.setAttribute("aria-label", "開啟網站設定");
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
    fab.addEventListener("click", open);
    document.body.appendChild(fab);

    if ($(".board")) {
      const dragBtn = document.createElement("button");
      dragBtn.type = "button";
      dragBtn.className = "studio-fab studio-fab--drag";
      dragBtn.title = "編輯首頁佈局（拖曳卡片）";
      dragBtn.setAttribute("aria-label", "編輯首頁佈局");
      dragBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2"/><circle cx="15" cy="16" r="2"/></svg>`;
      dragBtn.addEventListener("click", () => {
        const on = !$(".board")?.classList.contains("layout-mode");
        window.YU.setLayoutMode?.(on);
        dragBtn.classList.toggle("is-on", on);
        dragBtn.title = on ? "結束佈局編輯" : "編輯首頁佈局（拖曳卡片）";
        if (on) toast("拖曳卡片調整位置，結束後自動儲存");
      });
      document.body.appendChild(dragBtn);
    }

    window.YU = window.YU || {};
    window.YU.openSettings = open;
  }

  function toast(msg) {
    let el = $("#yu-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "yu-toast";
      el.className = "yu-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("is-show"), 2200);
  }

  /* ---------- Markdown 預覽（寫作台 / 筆記頁共用） ---------- */
  function mdToHtml(md) {
    const lines = esc(md).split(/\n/);
    let html = "", inCode = false, inList = false;
    for (const line of lines) {
      if (line.startsWith("```")) {
        if (inCode) { html += "</code></pre>"; inCode = false; }
        else { html += "<pre><code>"; inCode = true; }
        continue;
      }
      if (inCode) { html += line + "\n"; continue; }
      if (/^#{1,3}\s/.test(line)) {
        const level = line.match(/^#+/)[0].length;
        html += `<h${level}>${line.replace(/^#+\s/, "")}</h${level}>`;
        continue;
      }
      if (/^[-*]\s/.test(line)) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${line.replace(/^[-*]\s/, "")}</li>`;
        continue;
      }
      if (inList) { html += "</ul>"; inList = false; }
      if (/^&gt;\s?/.test(line)) { html += `<blockquote>${line.replace(/^&gt;\s?/, "")}</blockquote>`; continue; }
      if (!line.trim()) { html += ""; continue; }
      html += `<p>${line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>")}</p>`;
    }
    if (inList) html += "</ul>";
    if (inCode) html += "</code></pre>";
    return html;
  }
  window.YU = window.YU || {};
  window.YU.mdToHtml = mdToHtml;

  /* ---------- 寫作台 ---------- */
  const WRITE_SALT = new TextEncoder().encode("yu312-write-v1-salt");
  const WRITE_ITERS = 210000;
  const WRITE_REPO = { owner: "Yu-0312", name: "yu312", branch: "main" };

  function turndowner() {
    if (!window.TurndownService) return null;
    const td = new window.TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    if (window.turndownPluginGfm?.gfm) {
      td.use(window.turndownPluginGfm.gfm);
    } else {
      td.addRule("strikethrough", {
        filter: ["del", "s", "strike"],
        replacement: (c) => `~~${c}~~`,
      });
    }
    return td;
  }

  function htmlToMarkdown(html) {
    const td = turndowner();
    if (!td) return html;
    const cleaned = String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<(meta|link)[^>]*>/gi, "");
    return td.turndown(cleaned).trim();
  }

  function looksLikeHtml(s) {
    const t = String(s || "").trim();
    if (!t) return false;
    if (/^<!DOCTYPE html/i.test(t) || /^<html[\s>]/i.test(t)) return true;
    return /^<([a-z][\w:-]*)[\s>]/i.test(t) && /<\/[a-z][\w:-]*>/i.test(t) && (t.match(/</g) || []).length >= 3;
  }

  function clipboardLooksRich(html, text) {
    if (!html || !html.trim()) return false;
    const rich = /<(h[1-6]|ul|ol|li|table|blockquote|strong|b|em|i|p|br|span)\b/i.test(html);
    if (!rich) return false;
    const mdish = /^\s{0,3}(#{1,6}\s|[-*]\s|\d+\.\s)/m.test(text || "");
    if (mdish && /<(pre|code)\b/i.test(html) && !/<(table|h[1-6])\b/i.test(html)) return false;
    return true;
  }

  function toMarkdown(raw, mime = "") {
    const text = String(raw || "");
    if (/html/i.test(mime) || looksLikeHtml(text)) return htmlToMarkdown(text);
    return text.replace(/\r\n/g, "\n");
  }

  function insertBody(textarea, chunk, { replace = false } = {}) {
    const add = String(chunk || "").replace(/\s+$/, "");
    if (!add) return;
    if (replace || !textarea.value.trim()) {
      textarea.value = add;
      return;
    }
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const pad = before && !before.endsWith("\n") ? "\n\n" : before ? "\n" : "";
    textarea.value = before + pad + add + (after.startsWith("\n") ? after : "\n" + after);
  }

  function bytesToB64(bytes) {
    let s = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      s += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(s);
  }

  async function encryptNoteBlob(password, obj) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: WRITE_SALT, iterations: WRITE_ITERS, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj))));
    const out = new Uint8Array(iv.length + ct.length);
    out.set(iv, 0);
    out.set(ct, iv.length);
    return bytesToB64(out);
  }

  function setupWrite() {
    const form = $("#writeForm");
    if (!form) return;
    const title = $("#wTitle");
    const body = $("#wBody");
    const slug = $("#wSlug");
    const tags = $("#wTags");
    const cat = $("#wCat");
    const cover = $("#wCover");
    const preview = $("#wPreview");
    const status = $("#wStatus");
    const dlg = $("#wPublishDlg");

    const draft = store.json("yu-draft", null);
    if (draft) {
      title.value = draft.title || "";
      body.value = draft.body || "";
      slug.value = draft.slug || "";
      tags.value = draft.tags || "";
      cat.value = draft.cat || "未分類";
      cover.value = draft.cover || "";
      status.textContent = "已載入上次草稿";
    }

    const saveDraft = () => {
      store.setJson("yu-draft", {
        title: title.value, body: body.value, slug: slug.value,
        tags: tags.value, cat: cat.value, cover: cover.value,
      });
      status.textContent = `草稿已存 · ${new Date().toLocaleTimeString("zh-TW")}`;
    };

    function paintPreview() {
      const t = title.value.trim() || "（未命名）";
      const tagList = tags.value.split(/[,，\s]+/).filter(Boolean);
      preview.innerHTML = `
        <article class="draft-card">
          ${cover.value ? `<img class="draft-cover" src="${esc(cover.value)}" alt="">` : ""}
          <h1>${esc(t)}</h1>
          <div class="draft-meta"><span class="chip">${esc(cat.value || "未分類")}</span>${tagList.map((x) => `<span class="chip chip--plain">#${esc(x)}</span>`).join("")}</div>
          <div class="draft-body">${mdToHtml(body.value) || "<p class='muted'>（內容預覽）</p>"}</div>
        </article>`;
    }

    function paintPublished() {
      const box = $("#wPublished");
      if (!box) return;
      const list = window.NOTES || [];
      box.innerHTML = list.length
        ? list.slice(0, 8).map((n) => `<a class="notes-mini-item" href="./notes.html?slug=${encodeURIComponent(n.slug)}"><strong>${esc(n.title)}</strong><span>${esc(n.cat || "")} · ${esc((n.time || "").slice(0, 10))}</span></a>`).join("")
        : `<p class="muted">還沒有發布過的文章。寫完後按「發布到網站」。</p>`;
    }

    function maybeConvertHtmlField() {
      if (!looksLikeHtml(body.value)) return false;
      const md = htmlToMarkdown(body.value);
      if (md && md !== body.value) {
        body.value = md;
        return true;
      }
      return false;
    }

    form.addEventListener("input", () => { paintPreview(); saveDraft(); });
    form.addEventListener("submit", (e) => { e.preventDefault(); saveDraft(); toast("草稿已儲存"); });
    body.addEventListener("blur", () => {
      if (maybeConvertHtmlField()) {
        paintPreview();
        saveDraft();
        toast("已把 HTML 轉成 Markdown");
      }
    });

    body.addEventListener("paste", (e) => {
      const html = e.clipboardData?.getData("text/html") || "";
      const text = e.clipboardData?.getData("text/plain") || "";
      if (!clipboardLooksRich(html, text) && !looksLikeHtml(text)) return;
      e.preventDefault();
      const md = htmlToMarkdown(html || text);
      insertBody(body, md);
      paintPreview();
      saveDraft();
      toast("已轉成 Markdown");
    });

    $("#wImport")?.addEventListener("click", () => {
      const input = $("#wFile");
      input?.click();
    });
    $("#wFile")?.addEventListener("change", async (e) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      const name = f.name;
      if (!title.value) title.value = name.replace(/\.(md|markdown|txt|html|htm|docx)$/i, "");
      try {
        let md = "";
        if (/\.docx$/i.test(name)) {
          if (!window.mammoth) throw new Error("無法載入 Word 轉換器");
          const buf = await f.arrayBuffer();
          const res = await window.mammoth.convertToHtml({ arrayBuffer: buf });
          md = htmlToMarkdown(res.value || "");
        } else {
          const text = await f.text();
          md = toMarkdown(text, f.type || name);
        }
        insertBody(body, md);
        paintPreview();
        saveDraft();
        toast(`已匯入並轉成 Markdown：${name}`);
      } catch (err) {
        toast(err.message || "匯入失敗");
      }
    });

    $("#wExport")?.addEventListener("click", () => {
      maybeConvertHtmlField();
      const t = title.value.trim() || "draft";
      const front = `---\ntitle: ${t}\ntags: [${tags.value}]\ncategory: ${cat.value}\n---\n\n`;
      const blob = new Blob([front + body.value], { type: "text/markdown;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(slug.value || t).replace(/[^\w一-龥-]+/g, "-")}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("已匯出 Markdown");
    });

    $("#wClear")?.addEventListener("click", () => {
      if (!confirm("清除目前草稿？")) return;
      store.del("yu-draft");
      title.value = body.value = slug.value = tags.value = cover.value = "";
      cat.value = "未分類";
      paintPreview();
      status.textContent = "草稿已清除";
    });

    const tokenInput = $("#wGhToken");
    if (tokenInput) tokenInput.value = store.get("yu-write-gh-token", "");

    function openPublish() {
      if (dlg) dlg.hidden = false;
      $("#wPassword")?.focus();
    }
    function closePublish() {
      if (dlg) dlg.hidden = true;
      const pw = $("#wPassword");
      if (pw) pw.value = "";
    }

    $("#wPublish")?.addEventListener("click", () => {
      if (!title.value.trim() || !body.value.trim()) {
        toast("請先寫標題和內容");
        return;
      }
      maybeConvertHtmlField();
      paintPreview();
      saveDraft();
      openPublish();
    });
    $("#wPublishCancel")?.addEventListener("click", closePublish);
    dlg?.addEventListener("click", (e) => { if (e.target === dlg) closePublish(); });

    $("#wPublishGo")?.addEventListener("click", async () => {
      const password = $("#wPassword")?.value || "";
      const token = ($("#wGhToken")?.value || "").trim();
      if (!password) { toast("請輸入發布密碼"); return; }
      if (!token) { toast("請貼上 GitHub Token"); return; }
      maybeConvertHtmlField();
      const note = {
        title: title.value.trim(),
        slug: slug.value.trim(),
        tags: tags.value.split(/[,，\s]+/).filter(Boolean),
        cat: cat.value || "未分類",
        cover: cover.value.trim(),
        body: body.value,
        time: new Date().toISOString(),
      };
      const go = $("#wPublishGo");
      if (go) go.disabled = true;
      try {
        const blob = await encryptNoteBlob(password, note);
        const fname = `${(note.slug || note.title).replace(/[^\w一-龥-]+/g, "-").slice(0, 40) || "note"}-${Date.now()}.enc`;
        const api = `https://api.github.com/repos/${WRITE_REPO.owner}/${WRITE_REPO.name}/contents/notes/inbox/${fname}`;
        const res = await fetch(api, {
          method: "PUT",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            message: "writing desk: encrypted note inbox",
            content: btoa(blob),
            branch: WRITE_REPO.branch,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `GitHub ${res.status}`);
        }
        store.set("yu-write-gh-token", token);
        closePublish();
        toast("已送出。密碼對的話，約一分鐘後會出現在筆記頁");
        status.textContent = "已送出加密稿，等待 GitHub Actions 發布";
      } catch (err) {
        toast(err.message || "發布失敗");
      } finally {
        if (go) go.disabled = false;
      }
    });

    paintPreview();
    paintPublished();
  }

  /* ---------- 友鏈頁 ---------- */
  function setupFriends() {
    const grid = $("#friendsGrid");
    if (!grid) return;
    const list = window.FRIEND_LINKS || [];
    const q = $("#friendSearch");
    const cats = $("#friendFilters");
    const kinds = ["全部", ...new Set(list.map((f) => f.kind || "朋友"))];
    let kind = "全部", text = "";

    function paint() {
      const items = list.filter((f) => {
        if (kind !== "全部" && (f.kind || "朋友") !== kind) return false;
        if (text && !`${f.name} ${f.desc} ${f.url}`.toLowerCase().includes(text)) return false;
        return true;
      });
      grid.innerHTML = items.length
        ? items.map((f, i) => `
          <a class="card friend-card" href="${esc(f.url)}" target="_blank" rel="noopener" style="animation-delay:${Math.min(i, 10) * 0.04}s">
            <div class="friend-avatar" style="background:${f.color || "var(--brand-soft)"}">${esc((f.name || "?").slice(0, 1))}</div>
            <div>
              <h3>${esc(f.name)}</h3>
              <p>${esc(f.desc || "")}</p>
              <span class="friend-url">${esc(f.url.replace(/^https?:\/\//, ""))}</span>
            </div>
          </a>`).join("")
        : `<div class="empty">沒有符合的友鏈</div>`;
    }

    if (cats) {
      cats.innerHTML = kinds.map((k, i) => `<button type="button" class="chip-btn${i === 0 ? " is-active" : ""}" data-kind="${esc(k)}">${esc(k)}</button>`).join("");
      cats.addEventListener("click", (e) => {
        const b = e.target.closest("[data-kind]");
        if (!b) return;
        kind = b.dataset.kind;
        cats.querySelectorAll("[data-kind]").forEach((x) => x.classList.toggle("is-active", x === b));
        paint();
      });
    }
    q?.addEventListener("input", () => { text = q.value.trim().toLowerCase(); paint(); });
    paint();
  }

  /* ---------- 筆記頁：寫作台發布的文章 ---------- */
  function setupNotes() {
    const view = $("#notesView");
    if (!view) return;
    const notes = (window.NOTES || []).slice().sort((a, b) => String(b.time || "").localeCompare(String(a.time || "")));
    const search = $("#notesSearch");
    const count = $("#notesCount");
    const slug = new URLSearchParams(location.search).get("slug");

    const mdExcerpt = (md) =>
      String(md || "").replace(/```[\s\S]*?```/g, " ").replace(/[#>*`~\-[\]!]/g, " ").replace(/\s+/g, " ").trim();

    function openNote(n) {
      const tags = (n.tags || []).map((t) => `<span>#${esc(t)}</span>`).join("");
      document.title = `${n.title} · 筆記`;
      if (search) search.hidden = true;
      if (count) count.textContent = "";
      view.innerHTML = `
        <article class="card draft-card note-full">
          ${n.cover ? `<img class="draft-cover" src="${esc(n.cover)}" alt="">` : ""}
          <h1>${esc(n.title)}</h1>
          <div class="draft-meta"><span>${esc(n.cat || "未分類")}</span><span>${esc(String(n.time || "").slice(0, 10))}</span>${tags}</div>
          <div class="draft-body">${window.YU.mdToHtml(n.body || "")}</div>
          <p class="note-back"><a class="btn btn--ghost btn-sm" href="./notes.html">← 回筆記列表</a></p>
        </article>`;
    }

    function paintList() {
      const text = (search?.value || "").trim().toLowerCase();
      const items = notes.filter((n) =>
        !text || `${n.title} ${n.cat} ${(n.tags || []).join(" ")} ${n.body}`.toLowerCase().includes(text));
      if (count) count.textContent = notes.length ? `（共 ${notes.length} 篇）` : "";
      view.innerHTML = items.length
        ? `<div class="notes-mini">${items.map((n) => {
            const exc = mdExcerpt(n.body);
            return `
            <a class="notes-mini-item" href="./notes.html?slug=${encodeURIComponent(n.slug)}">
              <strong>${esc(n.title)}</strong>
              <span>${esc(n.cat || "未分類")} · ${esc(String(n.time || "").slice(0, 10))}</span>
              <p>${esc(exc.slice(0, 90))}${exc.length > 90 ? "…" : ""}</p>
            </a>`;
          }).join("")}</div>`
        : `<div class="empty">${notes.length ? "沒有符合的筆記" : "還沒有筆記。到寫作台寫一篇吧！"}</div>`;
    }

    const found = slug ? notes.find((n) => n.slug === slug) : null;
    if (slug && found) openNote(found);
    else paintList();
    search?.addEventListener("input", paintList);
  }

  /* ---------- 套用設定到頁面文字 / 社群 ---------- */
  function applySiteCopy() {
    const s = loadSettings();
    // 標題格式：「頁名 · 站名」；首頁只顯示站名
    const page = document.body.dataset.page || "home";
    const pageNames = {
      home: "", posts: "動態", projects: "我的專案", share: "教學資源",
      friends: "友鏈", notes: "筆記", write: "寫作台", about: "關於我",
    };
    const pageName = pageNames[page] ?? "";
    document.title = pageName ? `${pageName} · ${s.siteTitle || "Yu"}` : (s.siteTitle || "Yu · 王宇錡");

    const g = $("#greetUser");
    if (g) g.textContent = s.username;
    const tag = $("#siteTagline");
    if (tag && s.tagline) tag.textContent = s.tagline;

    const row = $(".p-social .social-row") || $("#socialRow");
    if (row && s.socials?.length) {
      row.innerHTML = s.socials
        .filter((x) => x.url)
        .map((it) => {
          const dark = /github/i.test(it.label);
          const brand = /email|mail/i.test(it.label);
          const cls = dark ? "soc soc--dark" : brand ? "soc soc--brand" : "soc";
          return `<a class="${cls}" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.label)}</a>`;
        })
        .join("");
    }
  }

  /* ---------- 啟動 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    applySiteCopy();
    setupSettings();
    setupDragLayout();
    setupLikeDaily();
    setupWrite();
    setupNotes();
    setupFriends();
  });
})();
