/**
 * 同步 Threads (@yuqi._.0313) 貼文到 data.js
 *
 * 資料來源：
 *   - 預設：Playwright 抓公開頁（不需 API key）。
 *     未登入時 Threads 只顯示最前面幾則；新貼文會併入 data.js，
 *     較舊貼文保留既有內容。
 *   - 可選：設定 THREADS_ACCESS_TOKEN 走官方 API，可一次補齊完整歷史。
 *
 * 多段貼文（thread / 續文）：
 *   Threads 上同一則貼文的續文各自有獨立的 post id，但在頁面內嵌 JSON
 *   （data-sjs script 與 GraphQL 回應）中會放在同一個 thread_items 陣列。
 *   同步時以此為依據，把整個 thread 合併成一張卡片：
 *   root 貼文為主體，每段續文變成 parts 的一個元素，並在資料中記錄
 *   thread 成員 id（之後同步不會把續文再加回來變成獨立卡片）。
 *
 * 然後：
 *   - 清理成 data.js 的 THREADS_POSTS 結構
 *   - 下載圖片到 assets/threads/
 *   - 逐則開公開 embed 頁抓按讚數，存進每則貼文的 likes
 *   - 合併時保留既有 tag（人工標籤）
 *
 * 用法：
 *   node scripts/sync_threads.mjs
 *   node scripts/sync_threads.mjs --dry-run
 *   THREADS_ACCESS_TOKEN=... node scripts/sync_threads.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

function findChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH && fs.existsSync(process.env.PLAYWRIGHT_CHROMIUM_PATH)) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }
  const roots = [
    path.join(os.homedir(), "Library/Caches/ms-playwright"),
    path.join(os.homedir(), ".cache/ms-playwright"),
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop();
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) stack.push(p);
        else if (ent.name === "chrome-headless-shell" || ent.name === "Chromium" || ent.name === "chrome") {
          return p;
        }
      }
    }
  }
  return undefined;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_JS = path.join(ROOT, "data.js");
const IMG_DIR = path.join(ROOT, "assets", "threads");
const HANDLE = "yuqi._.0313";
const PROFILE_URL = `https://www.threads.com/@${HANDLE}`;
const DRY_RUN = process.argv.includes("--dry-run");
const MAX_POSTS = 80;
const MAX_SCROLL = 8;

/* ---------- data.js 讀寫 ---------- */
function loadExisting() {
  const src = fs.readFileSync(DATA_JS, "utf8");
  const sandbox = { window: {} };
  // data.js 只有 window.X = ... 指派，可安全地用 Function 取值
  const fn = new Function("window", `${src}\nreturn window;`);
  const win = fn(sandbox.window);
  return {
    profile: win.PROFILE || {},
    share: win.SHARE_ITEMS || [],
    projects: win.PROJECT_ITEMS || [],
    posts: win.THREADS_POSTS || [],
  };
}

function writeDataJs({ profile, share, projects, posts, syncedAt }) {
  const header = `/* 網站資料 — 由 Threads (@${HANDLE}) 與 GitHub (Yu-0312) 實際內容整理而來
   Threads 同步於 ${syncedAt}（scripts/sync_threads.mjs，GitHub Actions 每天自動更新） */`;
  const dump = (name, value) => `window.${name} = ${JSON.stringify(value, null, 1)};`;
  const body = [
    header,
    dump("PROFILE", profile),
    dump("SHARE_ITEMS", share),
    dump("PROJECT_ITEMS", projects),
    dump("THREADS_POSTS", posts),
    "",
  ].join("\n");
  if (!DRY_RUN) fs.writeFileSync(DATA_JS, body);
}

/* ---------- 文字清理（對齊上次人工匯出的結果） ---------- */
const NOISE_LINES = [
  /^Translate$/i,
  /^翻譯$/,
  /^See more$/i,
  /^Show more$/i,
  /^查看更多$/,
  /^View \d+ more$/i,
  /^\d+(\.\d+)?[kKmM]?$/,
  /^Follow$/i,
  /^Following$/i,
  /^Follow back$/i,
  /^追蹤$/,
  /^已追蹤$/,
  /^Mention$/i,
  /^Send$/i,
  /^Copy link$/i,
  /^Report$/i,
  /^Not interested$/i,
  /^Who can reply\?$/i,
  /^(Threads|Replies|Reposts|Media|Quotes)$/i,
  /^[\d.,]+[kKmM]? ?(likes?|replies|reposts|views|shares|quotes)$/i,
  /^(like|reply|repost|share|quote|bookmark|heart)s?$/i,
  /^讀取更多$/i,
  /^收合$/i,
];

function isNoiseLine(line) {
  const t = line.trim();
  if (!t) return false; // 空行保留，用來分段
  return NOISE_LINES.some((re) => re.test(t));
}

function cleanPostText(raw) {
  const lines = String(raw || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .filter((l) => !isNoiseLine(l));

  // 移除開頭的 username / 相對時間（1h、3d、2w…）
  while (lines.length) {
    const l = lines[0].trim();
    if (l === HANDLE || /^@?yuqi\._\.0313$/i.test(l)) {
      lines.shift();
      continue;
    }
    if (
      /^\d+[mhdwMy]$/.test(l) ||
      /^\d+\s*(minute|hour|day|week|month|year)s?$/i.test(l) ||
      /^\d+\s*(分鐘|小時|天|週|個月|年)前?$/.test(l) ||
      /^(剛剛|昨天|前天)$/.test(l)
    ) {
      lines.shift();
      continue;
    }
    break;
  }

  // 結尾的互動列（數字或純英文短詞）
  while (lines.length) {
    const l = lines[lines.length - 1].trim();
    if (!l) {
      lines.pop();
      continue;
    }
    if (
      /^\d+(\.\d+)?[kKmM]?$/.test(l) ||
      /^(Reply|Like|Repost|Share|Quote|Send|View all \d+ comments)$/i.test(l) ||
      /^(全部|查看全部)留言$/.test(l)
    ) {
      lines.pop();
      continue;
    }
    break;
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function splitParts(text) {
  if (!text) return [""];
  // 單則貼文內的續文標記：「…（留言續）」或 「(continued)」
  const byMarker = text.split(/\n(?=[^\n]*(?:留言續|continued|以下接續|↓\s*$))/i);
  if (byMarker.length > 1) {
    return byMarker.map((s) => s.replace(/\n?(?:留言續|continued|以下接續)\s*$/i, "").trim()).filter(Boolean);
  }
  return [text];
}

function extractLinks(text) {
  const re = /https?:\/\/[^\s，。、）)」』]+/g;
  const found = text.match(re) || [];
  return [...new Set(found.map((u) => u.replace(/[.,;:]+$/, "")))];
}

/* ---------- 內嵌 JSON：解析 thread（續文）分組 ---------- */

// 從頁面內嵌 JSON 找出所有 thread_items 陣列（同一 thread 的各段在同一陣列）
function collectThreadPayload(jsonText, acc) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return;
  }
  const seen = new Set();
  const walk = (node) => {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (Array.isArray(node.thread_items) && node.thread_items.length) {
      const codes = [];
      for (const it of node.thread_items) {
        const post = it?.post;
        if (!post?.code) continue;
        codes.push(post.code);
        if (!acc.items.has(post.code)) {
          acc.items.set(post.code, {
            takenAt: Number(post.taken_at) || 0,
            text: post.caption?.text || "",
            imgs: imgsFromApiPost(post),
            video: post.media_type === 2 || Array.isArray(post.video_versions) && post.video_versions.length > 0,
          });
        }
      }
      if (codes.length > 1) acc.groups.push(codes);
    }
    for (const v of Object.values(node)) walk(v);
  };
  walk(data);
}

// 從 API/內嵌 JSON 的 post 物件取圖片（候選網址中挑最大解析度）
function imgsFromApiPost(post) {
  const out = [];
  const pick = (media) => {
    if (!media || Array.isArray(media.video_versions) && media.video_versions.length) return;
    const cands = media.image_versions2?.candidates || [];
    const best = cands.reduce(
      (a, b) => ((Number(b.width) || 0) * (Number(b.height) || 0) > (Number(a?.width) || 0) * (Number(a?.height) || 0) ? b : a),
      null,
    );
    if (best?.url) out.push({ src: best.url, alt: "", w: Number(best.width) || 0, h: Number(best.height) || 0 });
  };
  if (Array.isArray(post.carousel_media)) {
    for (const child of post.carousel_media) pick(child);
  } else {
    pick(post);
  }
  return out;
}

/* ---------- 官方 API 備援 ---------- */
async function fetchViaApi() {
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) throw new Error("未設定 THREADS_ACCESS_TOKEN，無法使用 API 備援");
  const fields = "id,text,timestamp,permalink,media_type,media_url,thumbnail_url,children{id,media_type,media_url,thumbnail_url}";
  let url = `https://graph.threads.net/me/threads?fields=${encodeURIComponent(fields)}&limit=50&access_token=${token}`;
  const items = [];
  for (let page = 0; page < 6 && url; page++) {
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) throw new Error(`Threads API ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
    items.push(...(json.data || []));
    url = json.paging?.next || null;
  }
  return items.map((it) => {
    const children = it.children?.data || [];
    const imgs = [];
    if (it.media_type === "IMAGE" && it.media_url) imgs.push({ url: it.media_url, alt: "" });
    for (const c of children) {
      if (c.media_type === "IMAGE" && (c.media_url || c.thumbnail_url)) {
        imgs.push({ url: c.media_url || c.thumbnail_url, alt: "" });
      }
    }
    return {
      id: it.id,
      time: new Date(it.timestamp).toISOString(),
      text: it.text || "",
      links: [],
      imgs,
      video: it.media_type === "VIDEO" || children.some((c) => c.media_type === "VIDEO"),
      url: it.permalink || `https://www.threads.com/@${HANDLE}/post/${it.id}`,
    };
  });
}

/* ---------- 瀏覽器擷取（與上次人工匯出相同路徑） ---------- */
async function scrapeViaBrowser() {
  const executablePath = findChromium();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 1600 },
    locale: "zh-TW",
  });
  const page = await context.newPage();

  // 蒐集頁面內嵌 JSON：thread 分組 + 每則貼文的乾淨文字與圖片
  const payload = { groups: [], items: new Map() };
  const absorbJson = (text) => {
    if (text && text.includes("thread_items")) collectThreadPayload(text, payload);
  };
  const absorbPageScripts = async () => {
    const texts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/json"]')).map((s) => s.textContent || ""),
    );
    for (const t of texts) absorbJson(t);
  };

  // 捲動載入的貼文來自 GraphQL（POST）回應，一併攔截解析
  page.on("response", async (res) => {
    try {
      const url = res.url() || "";
      const ct = res.headers()["content-type"] || "";
      if (!/threads\.com/.test(url) || !/json/i.test(ct)) return;
      absorbJson(await res.text());
    } catch {
      /* 回應可能已釋放，忽略 */
    }
  });

  try {
    await page.goto(PROFILE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('a[href*="/post/"]', { timeout: 30000 });
    await page.waitForTimeout(2000); // 等水合完成，feed 才會長完整
    await absorbPageScripts();

    // 捲動載入更多貼文（連兩輪沒有新增才停止）
    let stale = 0;
    for (let i = 0; i < MAX_SCROLL; i++) {
      const before = await page.evaluate(() => document.querySelectorAll('a[href*="/post/"]').length);
      await page.mouse.wheel(0, 2200);
      await page.waitForTimeout(900);
      const after = await page.evaluate(() => document.querySelectorAll('a[href*="/post/"]').length);
      stale = after > before ? 0 : stale + 1;
      if (after >= MAX_POSTS || stale >= 2) break;
    }
    await absorbPageScripts();

    const rawPosts = await page.evaluate((handle) => {
      const byId = new Map();

      function findPostRoot(el) {
        let cur = el;
        for (let i = 0; i < 12 && cur; i++) {
          const hasTime = cur.querySelector && cur.querySelector("time");
          const text = cur.innerText || "";
          if (hasTime && text.length > 20) return cur;
          cur = cur.parentElement;
        }
        return el.parentElement || el;
      }

      function collect(id, root, fallbackTime) {
        if (!id || byId.has(id)) return;
        const timeEl = root.querySelector("time");
        const imgs = Array.from(root.querySelectorAll("img")).map((img) => ({
          src: img.currentSrc || img.src || "",
          alt: img.alt || "",
          w: img.naturalWidth || Number(img.getAttribute("width")) || 0,
          h: img.naturalHeight || Number(img.getAttribute("height")) || 0,
        }));
        const postImgs = imgs
          .filter((im) => {
            const s = im.src || "";
            const last = s.split("?")[0].split("/").pop() || "";
            const alt = (im.alt || "").toLowerCase();
            const isAvatar =
              /profile|avatar|favicon|emoji/i.test(last) ||
              /大頭貼/.test(im.alt || "") ||
              /profile picture|user avatar/.test(alt);
            const isTiny = im.w && im.h && (im.w < 80 || im.h < 80);
            const isSquareIcon = im.w === im.h && im.w <= 200;
            return s && !isAvatar && !isTiny && !isSquareIcon;
          });
        byId.set(id, {
          id,
          url: `https://www.threads.com/@${handle}/post/${id}`,
          time: timeEl?.getAttribute("datetime") || fallbackTime || timeEl?.getAttribute("title") || null,
          rawText: root.innerText || "",
          imgs: postImgs,
          video: !!root.querySelector("video"),
        });
      }

      for (const a of document.querySelectorAll('a[href*="/post/"]')) {
        const href = a.getAttribute("href") || "";
        if (/\/media\/?$/.test(href)) continue;
        const m = href.match(/\/post\/([A-Za-z0-9_-]+)/);
        if (!m) continue;
        collect(m[1], findPostRoot(a), null);
      }

      // 兜底：以 time 為中心找貼文（公開頁有時連結較少）
      for (const timeEl of document.querySelectorAll("time[datetime]")) {
        const root = findPostRoot(timeEl);
        const html = root.innerHTML || "";
        const hrefs = Array.from(root.querySelectorAll('a[href*="/post/"]')).map((x) => x.getAttribute("href") || "");
        let id = null;
        for (const href of hrefs) {
          const m = href.match(/\/post\/([A-Za-z0-9_-]+)/);
          if (m) {
            id = m[1];
            break;
          }
        }
        if (!id) {
          // 用時間 + 文字摘要當合成 id（僅限無法取得真實 id 時）
          const digest = (root.innerText || "").slice(0, 40).replace(/\s+/g, "");
          id = `local-${(timeEl.getAttribute("datetime") || "").replace(/\W/g, "")}-${digest.length}`;
        }
        collect(id, root, timeEl.getAttribute("datetime"));
      }

      return Array.from(byId.values());
    }, HANDLE);

    // 用內嵌 JSON 的資料補強：完整文字（含完整連結）、精確時間、高解析圖片
    for (const rp of rawPosts) {
      const item = payload.items.get(rp.id);
      if (!item) continue;
      if (item.text) rp.rawText = item.text;
      if (item.takenAt) rp.time = new Date(item.takenAt * 1000).toISOString();
      if (item.imgs.length) rp.imgs = item.imgs.map((im) => ({ ...im, src: im.src }));
      if (item.video) rp.video = true;
    }
    // 內嵌 JSON 有、但 DOM 沒收到的貼文（例如被過濾器漏掉）直接補上
    for (const [code, item] of payload.items) {
      if (rawPosts.some((p) => p.id === code)) continue;
      if (!item.text || !item.takenAt) continue;
      rawPosts.push({
        id: code,
        url: `https://www.threads.com/@${HANDLE}/post/${code}`,
        time: new Date(item.takenAt * 1000).toISOString(),
        rawText: item.text,
        imgs: item.imgs,
        video: item.video,
      });
    }

    // thread 分組：只保留成員都抓到的組（去重複）
    const ids = new Set(rawPosts.map((p) => p.id));
    const seenGroups = new Set();
    const groups = [];
    for (const g of payload.groups) {
      const key = g.join("+");
      if (seenGroups.has(key)) continue;
      seenGroups.add(key);
      if (g.length < 2) continue;
      if (!g.every((c) => ids.has(c))) continue;
      // 同一則貼文只能屬於一組
      if (g.slice(1).some((c) => groups.some((x) => x.includes(c)))) continue;
      groups.push(g);
    }

    return { posts: rawPosts, groups, stats: { jsonItems: payload.items.size, jsonGroups: payload.groups.length } };
  } finally {
    await browser.close();
  }
}

const DEBUG = process.env.SYNC_DEBUG === "1";

/* ---------- 圖片下載 ---------- */
function extFromUrl(url, contentType = "") {
  if (/\.png(\?|$)/i.test(url) || /image\/png/i.test(contentType)) return "png";
  if (/\.webp(\?|$)/i.test(url) || /image\/webp/i.test(contentType)) return "webp";
  return "jpg";
}

async function downloadImage(url, destNoExt) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Referer: "https://www.threads.com/",
    },
  });
  if (!res.ok) throw new Error(`download ${res.status} ${url.slice(0, 80)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  const ext = extFromUrl(url, ct);
  const file = `${destNoExt}.${ext}`;
  fs.writeFileSync(file, buf);
  return { file, ext, bytes: buf.length };
}

async function syncImages(post, existingImgs) {
  // 若本地已有同名圖片就重用，避免每次重抓
  const out = [];
  const remote = post.imgs || [];
  // 若既有圖片比較完整（例如瀏覽器只抓到部分、或這次沒抓到），保留舊的
  if (existingImgs.length > remote.length) {
    const stillValid = existingImgs.filter((im) => {
      const src = im.src || "";
      if (!src) return false;
      if (src.startsWith("http")) return true;
      return fs.existsSync(path.join(ROOT, src));
    });
    if (stillValid.length >= Math.max(remote.length, 1)) return stillValid;
  }
  for (let i = 0; i < remote.length; i++) {
    const base = `${post.id}-${i}`;
    const existing = existingImgs.find((im) => (im.src || "").includes(base));
    const already = fs.existsSync(path.join(IMG_DIR, `${base}.jpg`)) ||
      fs.existsSync(path.join(IMG_DIR, `${base}.png`)) ||
      fs.existsSync(path.join(IMG_DIR, `${base}.webp`));
    if (existing && already) {
      out.push(existing);
      continue;
    }
    if (DRY_RUN) {
      out.push({ src: `assets/threads/${base}.jpg`, w: remote[i].w || 0, h: remote[i].h || 0, alt: remote[i].alt || "" });
      continue;
    }
    try {
      const url = remote[i].src || remote[i].url;
      if (!url || url.startsWith("data:")) {
        // base64（相容 threads-export.json 形狀）
        if (remote[i].data) {
          const ext = "jpg";
          const file = path.join(IMG_DIR, `${base}.${ext}`);
          fs.writeFileSync(file, Buffer.from(remote[i].data, "base64"));
          out.push({ src: `assets/threads/${base}.${ext}`, w: remote[i].w || 0, h: remote[i].h || 0, alt: remote[i].alt || "" });
        }
        continue;
      }
      const { ext } = await downloadImage(url, path.join(IMG_DIR, base));
      out.push({ src: `assets/threads/${base}.${ext}`, w: remote[i].w || 0, h: remote[i].h || 0, alt: remote[i].alt || "" });
    } catch (err) {
      console.warn(`  ! 圖片下載失敗 ${post.id}-${i}: ${err.message}`);
    }
  }
  return out;
}

/* ---------- 按讚數（公開 embed 頁，每則貼文動作列第一個圖示是愛心） ---------- */
const HEART_PATH_PREFIX = "M12.375";
const normText = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
const parseCount = (t) => {
  const m = String(t || "").replace(/,/g, "").trim().match(/^([\d.]+)\s*([km])?$/i);
  if (!m) return 0;
  const unit = m[2] ? { k: 1e3, m: 1e6 }[m[2].toLowerCase()] : 1;
  return Math.round(parseFloat(m[1]) * unit);
};

async function refreshLikes(posts) {
  const pending = posts.filter((p) => p.id && !p.id.startsWith("local-"));
  // embed 頁會截斷長文，比對用完整正規化正文，越長越準
  const fullById = new Map(pending.map((p) => [p.id, normText((p.parts || []).join(""))]));
  const likes = new Map();
  if (!pending.length) return likes;

  const executablePath = findChromium();
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 480, height: 1600 },
    locale: "zh-TW",
  });
  const page = await context.newPage();
  try {
    for (const p of pending) {
      if (likes.has(p.id)) continue; // 逛別則的 thread 頁時已經順手抓到
      try {
        await page.goto(`https://www.threads.com/@${HANDLE}/post/${p.id}/embed`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });
        await page.waitForSelector(".ActionBarIcon", { timeout: 20000 });
        await page.waitForTimeout(700);
        const blocks = await page.evaluate((heartPrefix) => {
          const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
          const parseCountInPage = (t) => {
            const m = String(t || "").replace(/,/g, "").trim().match(/^([\d.]+)\s*([km])?$/i);
            if (!m) return 0;
            const unit = m[2] ? { k: 1e3, m: 1e6 }[m[2].toLowerCase()] : 1;
            return Math.round(parseFloat(m[1]) * unit);
          };
          return [...document.querySelectorAll(".OuterContainer")].map((el) => {
            const first = el.querySelector(".ActionBarIcon");
            let like = null;
            if (first) {
              const d = first.querySelector("svg path")?.getAttribute("d") || "";
              if (d.startsWith(heartPrefix)) {
                like = parseCountInPage(first.querySelector(".ActionBarCount")?.textContent);
              }
            }
            return { like, text: norm(el.innerText || "") };
          });
        }, HEART_PATH_PREFIX);

        for (const b of blocks) {
          if (!b.text || b.like == null) continue;
          // 前綴由長到短嘗試，取比對到最長前綴的貼文（embed 可能截斷長文）
          let best = null, bestLen = 0;
          for (const q of pending) {
            if (likes.has(q.id)) continue;
            const full = fullById.get(q.id) || "";
            if (full.length < 8 || !b.text.includes(full.slice(0, 8))) continue;
            let k = Math.min(40, full.length);
            while (k > 8 && !b.text.includes(full.slice(0, k))) k = Math.floor(k / 2);
            if (k > bestLen) { best = q; bestLen = k; }
          }
          if (best) likes.set(best.id, b.like);
        }
        console.log(`  讚數 ${p.id}：本頁解析 ${blocks.length} 則，累積 ${likes.size}/${pending.length}`);
      } catch (err) {
        console.warn(`  ! 讚數抓取失敗 ${p.id}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }
  return likes;
}

/* ---------- 主流程 ---------- */
async function main() {
  console.log(`同步 Threads @${HANDLE} …`);
  const existing = loadExisting();
  const existingById = new Map(existing.posts.map((p) => [p.id, p]));
  console.log(`  現有貼文 ${existing.posts.length} 則`);

  let rawPosts = [];
  let threadGroups = [];
  let method = "none";
  const hasToken = Boolean(process.env.THREADS_ACCESS_TOKEN);

  // 優先 API（完整歷史）；沒有 token 才用瀏覽器（公開頁會被登入牆擋住）
  if (hasToken) {
    try {
      rawPosts = await fetchViaApi();
      method = "api";
      console.log(`  API 擷取 ${rawPosts.length} 則`);
    } catch (err) {
      console.warn(`  API 擷取失敗：${err.message}`);
    }
  }

  if (!rawPosts.length) {
    try {
      const scraped = await scrapeViaBrowser();
      rawPosts = scraped.posts;
      threadGroups = scraped.groups;
      method = "browser";
      console.log(
        `  瀏覽器擷取 ${rawPosts.length} 則（內建 JSON：${scraped.stats.jsonItems} 則資料、` +
          `${scraped.stats.jsonGroups} 個原始分組，採用 ${threadGroups.length} 組）`,
      );
      if (rawPosts.length && rawPosts.length < existing.posts.length) {
        console.warn(
          `  提醒：公開頁未登入通常只顯示最前面幾則（登入牆）。` +
            `要完整同步請設定 THREADS_ACCESS_TOKEN。`
        );
      }
      if (!rawPosts.length) throw new Error("瀏覽器沒有抓到貼文");
    } catch (err) {
      console.warn(`  瀏覽器擷取失敗：${err.message}`);
      if (!hasToken) {
        throw new Error(
          "瀏覽器擷取失敗，且未設定 THREADS_ACCESS_TOKEN。\n" +
            "請在 GitHub Secrets 設定 THREADS_ACCESS_TOKEN（見 README），或改用可登入的瀏覽器環境。"
        );
      }
    }
  }

  if (!DRY_RUN) fs.mkdirSync(IMG_DIR, { recursive: true });

  const rawById = new Map(rawPosts.filter((p) => p.id && p.time).map((p) => [p.id, p]));

  // --- thread 分類 ---
  // freshGroups：今天抓到的完整 thread（root = 第一個元素）
  const freshRoots = new Map(); // rootId -> memberIds（不含 root）
  const memberRoot = new Map(); // memberId -> rootId
  for (const g of threadGroups) {
    const [rootId, ...members] = g;
    if (freshRoots.has(rootId)) continue;
    freshRoots.set(rootId, members);
    for (const m of members) memberRoot.set(m, rootId);
  }
  // 沒有出現在 fresh 分組的貼文，若屬於既有合併貼文（thread 欄位），也歸到那個 root
  const existingThreadRoot = new Map();
  for (const ep of existing.posts) {
    if (!Array.isArray(ep.thread)) continue;
    for (const id of ep.thread) if (id !== ep.id) existingThreadRoot.set(id, ep.id);
  }
  const absorbed = new Set(); // 併入 root、不再單獨出現的貼文
  for (const [id, rootId] of memberRoot) {
    if (rawById.has(rootId) || existingById.has(rootId)) continue;
    // root 完全不可得：放棄合併，維持原本行為
    memberRoot.delete(id);
  }
  for (const rp of rawById.values()) {
    if (memberRoot.has(rp.id)) continue;
    const er = existingThreadRoot.get(rp.id);
    if (er) memberRoot.set(rp.id, er);
  }
  // root 不在今天抓取範圍、但既有資料已有合併內容 → 子貼文直接捨棄
  for (const [id, rootId] of memberRoot) {
    if (id !== rootId && !rawById.has(rootId) && existingById.has(rootId)) {
      absorbed.add(id);
    }
  }

  // --- 清理文字 ---
  const cleanedById = new Map();
  for (const rp of rawById.values()) {
    cleanedById.set(rp.id, cleanPostText(rp.text ?? rp.rawText ?? ""));
  }

  // --- 圖片（成員若已併入既有 root，就不再重抓） ---
  const imgsById = new Map();
  for (const rp of rawById.values()) {
    if (absorbed.has(rp.id)) continue;
    const rid = memberRoot.get(rp.id);
    if (rid && rid !== rp.id) {
      const rootOld = existingById.get(rid);
      if (rootOld && Array.isArray(rootOld.thread) && rootOld.thread.includes(rp.id)) continue;
    }
    imgsById.set(rp.id, await syncImages(rp, existingById.get(rp.id)?.imgs || []));
  }

  // --- 組成貼文物件 ---
  const nextPosts = [];
  for (const rp of rawById.values()) {
    if (absorbed.has(rp.id)) continue;
    const rootId = memberRoot.get(rp.id);
    if (rootId && rootId !== rp.id) continue; // 成員併入 root，底下一起處理
    const old = existingById.get(rp.id) || {};
    const cleaned = cleanedById.get(rp.id) || "";
    const post = {
      id: rp.id,
      url: rp.url || old.url || `https://www.threads.com/@${HANDLE}/post/${rp.id}`,
      time: new Date(rp.time).toISOString(),
      tag: old.tag ?? "",
      parts: [],
      imgs: imgsById.get(rp.id) || [],
      links: Array.from(new Set([...(old.links || []), ...(rp.links?.length ? rp.links : extractLinks(cleaned))])),
      video: Boolean(rp.video ?? old.video),
    };
    if (old.likes != null) post.likes = old.likes; // 保留已抓過的按讚數

    const members = freshRoots.get(rp.id);
    if (!members) {
      // 單則貼文：保留既有整理過的正文
      post.parts = Array.isArray(old.parts) && old.parts.some((p) => p && p.trim()) ? old.parts : splitParts(cleaned);
      const oldThread = Array.isArray(old.thread) && old.thread.length > 1 ? old.thread : null;
      if (oldThread) post.thread = oldThread;
      nextPosts.push(post);
      continue;
    }

    // thread：root 為主體，每段續文一個 part
    const oldThread = Array.isArray(old.thread) && old.thread.length ? old.thread : [rp.id];
    const newMembers = members.filter((id) => !oldThread.includes(id));
    post.thread = [...new Set([rp.id, ...oldThread, ...members])];
    if (newMembers.length) {
      if (oldThread.length > 1 && Array.isArray(old.parts) && old.parts.some((p) => p && p.trim())) {
        // 之前已合併過：既有 parts 已含舊續文，只接上新成員
        post.parts = [...old.parts, ...newMembers.map((id) => cleanedById.get(id) || "").filter((t) => t.trim())];
      } else {
        // 首次合併：以抓到的乾淨文字重組（root 一段、續文各一段）
        const partTexts = [cleaned, ...members.map((id) => cleanedById.get(id) || "")].filter((t) => t.trim());
        post.parts = partTexts.length ? partTexts : [cleaned];
      }
      for (const id of newMembers) {
        post.imgs = [...(post.imgs || []), ...(imgsById.get(id) || [])];
        post.links = Array.from(new Set([...post.links, ...extractLinks(cleanedById.get(id) || "")]));
        if (rawById.get(id)?.video) post.video = true;
      }
    } else {
      // 成員都已併入既有內容：沿用既有正文，避免重複
      post.parts = Array.isArray(old.parts) && old.parts.some((p) => p && p.trim())
        ? old.parts
        : splitParts(cleaned);
    }
    nextPosts.push(post);
  }

  // --- 合併：新抓的優先；若 API 只拿到部分，保留較舊既有貼文 ---
  const merged = new Map();
  for (const p of nextPosts) merged.set(p.id, p);
  for (const p of existing.posts) {
    // 已併入 root 的子貼文（今天抓到或之前已合併）不再單獨出現
    if (merged.has(p.id) || absorbed.has(p.id) || memberRoot.has(p.id)) continue;
    merged.set(p.id, p);
  }
  const posts = Array.from(merged.values()).sort((a, b) => b.time.localeCompare(a.time));

  if (DRY_RUN) {
    console.log("（dry-run：略過讚數更新）");
  } else {
    console.log(`更新 Threads 按讚數（${posts.length} 則）…`);
    try {
      const likes = await refreshLikes(posts);
      let got = 0;
      for (const p of posts) {
        if (likes.has(p.id)) { p.likes = likes.get(p.id); got++; }
        else if (p.likes == null) delete p.likes; // 抓不到就不留假資料
      }
      const total = posts.reduce((s, p) => s + (Number(p.likes) || 0), 0);
      console.log(`  讚數：取得 ${got}/${posts.length}，全部加總 ${total}`);
    } catch (err) {
      console.warn(`  ! 讚數更新失敗（不影響貼文同步）：${err.message}`);
    }
  }

  const syncedAt = new Date().toISOString();
  writeDataJs({
    profile: existing.profile,
    share: existing.share,
    projects: existing.projects,
    posts,
    syncedAt,
  });

  const added = nextPosts.filter((p) => !existingById.has(p.id)).length;
  const mergedThreads = nextPosts.filter((p) => p.thread && p.thread.length > 1).length;
  console.log(`完成（${method}）：新增 ${added}、合併 thread ${mergedThreads} 組、總計 ${posts.length}`);
  if (DRY_RUN) console.log("（dry-run，未寫入檔案）");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
