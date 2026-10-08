/* ==========================================================
   i18n.js — 中文 / English 切換
   - 預設中文；右上角按鈕（或網址加 ?lang=en）切到英文，選擇會記在 localStorage
   - 介面文字：i18n/ui.en.js 的「中文原文 → 英文」字典。英文模式下，畫面上整段等於字典 key 的
     文字節點、placeholder、aria-label、title、alt 會被換掉；後來動態產生的內容由 MutationObserver 接手
   - 貼文 / 專案 / 簡介等內容：data.en.js（由 npm run build-i18n 產生）。沒翻譯到的會退回中文原文
   載入順序：data.js → data.en.js → i18n.js → 其他腳本（index.html 為同步載入）
   ========================================================== */
(() => {
  "use strict";

  const KEY = "yu-lang";
  const EN = window.EN || {};
  const UI = EN.ui || {};

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 無痕模式等情況忽略 */ } },
  };

  /* ---------- 目前語言 ---------- */
  function detect() {
    let q = null;
    try { q = new URLSearchParams(location.search).get("lang"); } catch { /* ignore */ }
    if (q === "en" || q === "zh") { store.set(KEY, q); return q; }
    return store.get(KEY) === "en" ? "en" : "zh";
  }
  const lang = detect();
  const isEn = lang === "en";

  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DOW = { 日: "Sun", 一: "Mon", 二: "Tue", 三: "Wed", 四: "Thu", 五: "Fri", 六: "Sat" };

  /* ---------- 含數字 / 變數的句子 ---------- */
  // [regex, (match…) => 英文]；子字串（如「雨聲」）會再丟回 tr() 翻譯一次
  const RULES = [
    [/^共 (\d+) 則$/, (m, n) => ` ${n} posts in total`],
    [/^本月發文 (\d+) 則$/, (m, n) => `${n} post${n === "1" ? "" : "s"} this month`],
    [/^(\d+) 則貼文$/, (m, n) => `${n} post${n === "1" ? "" : "s"}`],
    [/^(\d+) 分鐘前$/, (m, n) => `${n} min ago`],
    [/^(\d+) 小時前$/, (m, n) => `${n} hr ago`],
    [/^(\d+) 天前$/, (m, n) => `${n} day${n === "1" ? "" : "s"} ago`],
    [/^(\d{4}\/\d{2}\/\d{2}) · (.+)$/, (m, d, rest) => `${d} · ${tr(rest)}`],
    [/^(\d{4}) 年 (\d{1,2}) 月$/, (m, y, mo) => `${MON[Number(mo) - 1] || mo} ${y}`],
    [/^(\d{1,2}) 月 (\d{1,2}) 日 · 週(.)$/, (m, mo, d, w) => `${DOW[w] || w}, ${MON[Number(mo) - 1] || mo} ${d}`],
    [/^(\d{4})\/(\d{1,2})\/(\d{1,2}) 週(.)$/, (m, y, mo, d, w) => `${DOW[w] || w}, ${MON[Number(mo) - 1] || mo} ${d}, ${y}`],
    [/^已按讚 · (.+)$/, (m, n) => `Liked · ${n}`],
    [/^讚 · (.+)$/, (m, n) => `Like · ${n}`],
    [/^正在播放 · (.+)$/, (m, s) => `Playing · ${tr(s)}`],
    [/^放大圖片 (\d+)$/, (m, n) => `Enlarge image ${n}`],
    [/^（共 (\d+) 篇）$/, (m, n) => `(${n} note${n === "1" ? "" : "s"})`],
    [/^草稿已存 · (.+)$/, (m, t) => `Draft saved · ${t}`],
    [/^已匯入並轉成 Markdown：(.+)$/, (m, s) => `Imported and converted to Markdown: ${s}`],
    [/^(.+) · 筆記$/, (m, s) => `${s} · Notes`],
    [/^(.+) · Yu · 王宇錡$/, (m, s) => `${tr(s)} · Yu · Yuchi Wang`],
  ];

  /* ---------- 翻譯一段字串（只在英文模式有效；找不到就原樣回傳） ---------- */
  function tr(s) {
    if (!isEn || typeof s !== "string") return s;
    const trimmed = s.trim();
    if (!trimmed) return s;
    let out = UI[trimmed];
    if (out === undefined) {
      const flat = trimmed.replace(/\s+/g, " ");
      if (flat !== trimmed) out = UI[flat];
    }
    if (out === undefined) {
      for (const [re, fn] of RULES) {
        const m = re.exec(trimmed);
        if (m) { out = fn(...m); break; }
      }
    }
    if (out === undefined) return s;
    return s.replace(trimmed, () => out);
  }

  /* ---------- 把 DOM 裡的文字換成英文 ---------- */
  const ATTRS = ["placeholder", "aria-label", "title", "alt", "content"];
  const SKIP_TAG = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "CODE"]);
  // 使用者內容（貼文 / 筆記 / 草稿預覽）不走字典，內容翻譯由 I18N.post() 等處理
  const SKIP_SEL = ".post-text, .latest-text, .draft-body, .note-body, [data-no-i18n]";

  function setAttr(el, name) {
    const v = el.getAttribute(name);
    if (!v) return;
    if (name === "content" && !(el.tagName === "META")) return;
    const out = tr(v);
    if (out !== v) el.setAttribute(name, out);
  }

  function walk(node) {
    if (node.nodeType === 3) {
      const p = node.parentElement;
      if (p && (SKIP_TAG.has(p.tagName) || p.closest(SKIP_SEL))) return;
      const out = tr(node.nodeValue);
      if (out !== node.nodeValue) node.nodeValue = out;
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.matches && node.matches(SKIP_SEL)) return;
    for (const a of ATTRS) if (node.hasAttribute && node.hasAttribute(a)) setAttr(node, a);
    // textarea / script 等只換屬性（例如 placeholder），不碰內容
    if (SKIP_TAG.has(node.tagName)) return;
    for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  function apply(root) {
    if (!isEn) return;
    walk(root || document.documentElement);
  }

  function start() {
    document.documentElement.lang = isEn ? "en" : "zh-Hant-TW";
    document.documentElement.dataset.lang = lang;
    if (!isEn) return;
    apply(document.documentElement);
    let queued = false;
    const pending = new Set();
    const flush = () => {
      queued = false;
      for (const n of pending) if (n.isConnected || n.nodeType === 3) walk(n);
      pending.clear();
    };
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "childList") m.addedNodes.forEach((n) => pending.add(n));
        else if (m.type === "attributes") setAttr(m.target, m.attributeName);
        else if (m.type === "characterData") pending.add(m.target);
      }
      if (pending.size && !queued) { queued = true; queueMicrotask(flush); }
    }).observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS,
    });
  }

  /* ---------- 內容資料（貼文 / 專案 / 簡介 …）的英文版 ---------- */
  function post(p) {
    const base = { parts: p.parts, tag: p.tag || "", alts: (p.imgs || []).map((i) => i.alt || ""), translated: !isEn };
    if (!isEn) return base;
    const t = (EN.posts || {})[p.id];
    // 段數對不上（例如之後同步時續文被併進來）就退回原文，免得段落錯位
    if (!t || !Array.isArray(t.parts) || t.parts.length !== p.parts.length) return base;
    return {
      parts: t.parts,
      tag: tagLabel(p.tag),
      alts: (p.imgs || []).map((im, i) => (t.alts && t.alts[i]) || im.alt || ""),
      translated: true,
    };
  }
  function tagLabel(tag) {
    if (!isEn) return tag;
    const m = EN.tags || {};
    return m[tag || ""] !== undefined ? m[tag || ""] : tr(tag);
  }
  function share(it) {
    const t = isEn && (EN.share || {})[it.name];
    return t ? { ...it, title: t.title || it.title, desc: t.desc || it.desc } : it;
  }
  function project(it) {
    const t = isEn && (EN.projects || {})[it.name];
    return t ? { ...it, desc: t.desc || it.desc } : it;
  }
  function profile(P) {
    const t = isEn && EN.profile;
    return t ? { ...P, bio: t.bio || P.bio, intro: t.intro || P.intro, notes: t.notes || P.notes } : P;
  }
  function note(n) {
    const t = isEn && (EN.notes || {})[n.slug];
    return t ? { ...n, title: t.title || n.title, cat: t.cat || n.cat, tags: t.tags || n.tags, body: t.body || n.body } : n;
  }

  /* ---------- 切換 ---------- */
  function setLang(next) {
    store.set(KEY, next);
    try {
      const u = new URL(location.href);
      u.searchParams.delete("lang");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch { /* ignore */ }
    location.reload();
  }

  const GLOBE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9S14.6 18.3 12 21c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/></svg>';

  function button() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lang-toggle";
    b.setAttribute("data-no-i18n", "");
    b.title = isEn ? "切換為中文 · Switch to Chinese" : "Switch to English · 切換為英文";
    b.setAttribute("aria-label", isEn ? "切換為中文 (Switch to Chinese)" : "Switch to English (切換為英文)");
    b.innerHTML = `${GLOBE}<span>${isEn ? "中文" : "EN"}</span>`;
    b.addEventListener("click", () => setLang(isEn ? "zh" : "en"));
    return b;
  }

  window.I18N = {
    lang,
    isEn,
    locale: isEn ? "en-US" : "zh-TW",
    t: tr,
    apply,
    post,
    tag: tagLabel,
    share,
    project,
    profile,
    note,
    setLang,
    button,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
