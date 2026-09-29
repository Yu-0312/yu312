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
    accent: "#c45c26",
    palette: "ember",
    socials: [
      { id: "threads", label: "Threads", url: "https://www.threads.com/@yuqi._.0313" },
      { id: "github", label: "GitHub", url: "https://github.com/Yu-0312" },
      { id: "email", label: "Email", url: "mailto:wang.yuchi.312@gmail.com" },
    ],
    layoutOrder: [],
    likeBase: 1286,
  };

  const PALETTES = {
    ember: { name: "暖爐", accent: "#c45c26", accent2: "#e07a5f", bg: "#f6efe3", wash1: "rgba(224,122,95,0.22)", wash2: "rgba(255,248,235,0.9)", wash3: "rgba(129,178,154,0.28)", wash4: "rgba(244,198,120,0.32)", ink: "#2c2418", ink2: "#6b5c4c", ink3: "#9a8b7a" },
    sage: { name: "苔綠", accent: "#3d7a5c", accent2: "#81b29a", bg: "#eef2ea", wash1: "rgba(129,178,154,0.3)", wash2: "rgba(255,255,250,0.85)", wash3: "rgba(196,92,38,0.18)", wash4: "rgba(168,196,140,0.32)", ink: "#243028", ink2: "#5c6b60", ink3: "#8a988c" },
    plum: { name: "李子", accent: "#7b3d5b", accent2: "#c47b9a", bg: "#f4eef1", wash1: "rgba(196,123,154,0.24)", wash2: "rgba(255,250,252,0.88)", wash3: "rgba(122,140,180,0.22)", wash4: "rgba(220,180,160,0.28)", ink: "#2e2230", ink2: "#6b5568", ink3: "#9a8498" },
    ocean: { name: "深海", accent: "#1f6f8b", accent2: "#3d9bb8", bg: "#eaf1f4", wash1: "rgba(61,155,184,0.22)", wash2: "rgba(250,253,255,0.88)", wash3: "rgba(232,168,96,0.22)", wash4: "rgba(120,180,190,0.3)", ink: "#1c2e36", ink2: "#546872", ink3: "#8aa0aa" },
    night: { name: "夜航", accent: "#e8a87c", accent2: "#c47b9a", bg: "#2a2622", wash1: "rgba(232,168,124,0.18)", wash2: "rgba(60,52,46,0.7)", wash3: "rgba(100,80,70,0.35)", wash4: "rgba(80,60,90,0.3)", ink: "#f2e8dc", ink2: "#c4b4a4", ink3: "#9a8a7a" },
  };

  function loadSettings() {
    const saved = store.json("yu-settings", {});
    return { ...DEFAULTS, ...saved, socials: saved.socials || DEFAULTS.socials };
  }
  function saveSettings(s) { store.setJson("yu-settings", s); }

  function applyPalette(key, accentOverride) {
    const p = PALETTES[key] || PALETTES.ember;
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

  /* ---------- 讚（每日上限） ---------- */
  function setupLikeDaily() {
    const btn = $("#likeBtn");
    if (!btn) return;
    const base = loadSettings().likeBase;
    const today = new Date().toISOString().slice(0, 10);
    const state = store.json("yu-like", { date: today, count: 0, on: false });
    if (state.date !== today) {
      state.date = today; state.count = 0; state.on = false;
      store.setJson("yu-like", state);
    }
    const paint = () => {
      btn.classList.toggle("is-on", state.on);
      btn.setAttribute("aria-pressed", String(state.on));
      const t = $("#likeText");
      const total = base + state.count + (store.get("yu-like-bonus") ? Number(store.get("yu-like-bonus")) : 0);
      if (t) t.textContent = state.on ? `已收藏 · ${total}` : `收藏 · ${total}`;
    };
    btn.addEventListener("click", () => {
      if (state.count >= 20) {
        btn.title = "今天已經按滿 20 次啦，明天再來～";
        btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 280 });
        return;
      }
      state.on = !state.on;
      state.count += 1;
      store.setJson("yu-like", state);
      paint();
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
        applyPalette(root.dataset.palette || "ember", e.target.value);
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

  /* ---------- 寫作台 ---------- */
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

    form.addEventListener("input", () => { paintPreview(); saveDraft(); });
    form.addEventListener("submit", (e) => { e.preventDefault(); saveDraft(); toast("草稿已儲存"); });

    $("#wImport")?.addEventListener("click", () => {
      const input = $("#wFile");
      input?.click();
    });
    $("#wFile")?.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        if (!title.value) title.value = f.name.replace(/\.md$/i, "");
        body.value = body.value ? body.value + "\n\n" + text : text;
        paintPreview();
        saveDraft();
        toast(`已匯入 ${f.name}`);
      };
      reader.readAsText(f);
    });

    $("#wExport")?.addEventListener("click", () => {
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

    paintPreview();
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

  /* ---------- 套用設定到頁面文字 / 社群 ---------- */
  function applySiteCopy() {
    const s = loadSettings();
    // 標題格式：「頁名 · 站名」；首頁只顯示站名
    const page = document.body.dataset.page || "home";
    const pageNames = {
      home: "", posts: "動態", projects: "我的專案", share: "教學資源",
      friends: "友鏈", write: "寫作台", about: "關於我",
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
    setupFriends();
  });
})();
