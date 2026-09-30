/**
 * 同步 Threads (@yuqi._.0313) 貼文到 data.js
 *
 * 資料來源：
 *   - 預設：Playwright 抓公開頁（不需 API key）。
 *     未登入時 Threads 只顯示最前面幾則；新貼文會併入 data.js，
 *     較舊貼文保留既有內容。
 *   - 可選：設定 THREADS_ACCESS_TOKEN 走官方 API，可一次補齊完整歷史。
 *
 * 然後：
 *   - 清理成 data.js 的 THREADS_POSTS 結構
 *   - 下載圖片到 assets/threads/
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
   Threads 同步於 ${syncedAt}（scripts/sync_threads.mjs，GitHub Actions 每三天自動更新） */`;
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
  // 多段貼文（thread）常見：「…（留言續）」或 「(continued)」後接下一則
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
  try {
    await page.goto(PROFILE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('a[href*="/post/"]', { timeout: 30000 });

    // 捲動載入更多貼文
    for (let i = 0; i < MAX_SCROLL; i++) {
      const before = await page.evaluate(() => document.querySelectorAll('a[href*="/post/"]').length);
      await page.mouse.wheel(0, 2200);
      await page.waitForTimeout(900);
      const after = await page.evaluate(() => document.querySelectorAll('a[href*="/post/"]').length);
      if (after >= MAX_POSTS || after === before) break;
    }

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

    return rawPosts;
  } finally {
    await browser.close();
  }
}

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
  // 若既有圖片比較完整（例如瀏覽器只抓到部分），保留舊的
  if (existingImgs.length > remote.length && remote.length > 0) {
    const stillValid = existingImgs.filter((im) => {
      const src = im.src || "";
      if (!src) return false;
      if (src.startsWith("http")) return true;
      return fs.existsSync(path.join(ROOT, src));
    });
    if (stillValid.length >= remote.length) return stillValid;
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

/* ---------- 主流程 ---------- */
function normalizePost(raw, existingById) {
  const old = existingById.get(raw.id) || {};
  const cleaned = cleanPostText(raw.text ?? raw.rawText ?? "");
  const scrapedParts = splitParts(cleaned);
  const links = raw.links?.length ? raw.links : extractLinks(cleaned);
  // 既有貼文若已有人工整理過的正文，保留；只補新欄位
  const parts = Array.isArray(old.parts) && old.parts.some((p) => p && p.trim()) ? old.parts : scrapedParts;
  return {
    id: raw.id,
    url: raw.url || old.url || `https://www.threads.com/@${HANDLE}/post/${raw.id}`,
    time: new Date(raw.time).toISOString(),
    tag: old.tag ?? "",
    parts,
    imgs: [], // 後填
    links: Array.from(new Set([...(old.links || []), ...links])),
    video: Boolean(raw.video ?? old.video),
  };
}

async function main() {
  console.log(`同步 Threads @${HANDLE} …`);
  const existing = loadExisting();
  const existingById = new Map(existing.posts.map((p) => [p.id, p]));
  console.log(`  現有貼文 ${existing.posts.length} 則`);

  let rawPosts = [];
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
      rawPosts = await scrapeViaBrowser();
      method = "browser";
      console.log(`  瀏覽器擷取 ${rawPosts.length} 則`);
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

  const nextPosts = [];
  for (const raw of rawPosts) {
    if (!raw.id || !raw.time) continue;
    const post = normalizePost(raw, existingById);
    const oldImgs = existingById.get(raw.id)?.imgs || [];
    post.imgs = await syncImages(raw, oldImgs);
    nextPosts.push(post);
  }

  // 合併：新抓的優先；若 API 只拿到部分，保留較舊既有貼文
  const merged = new Map();
  for (const p of nextPosts) merged.set(p.id, p);
  for (const p of existing.posts) {
    if (!merged.has(p.id)) merged.set(p.id, p);
  }
  const posts = Array.from(merged.values()).sort((a, b) => b.time.localeCompare(a.time));

  const syncedAt = new Date().toISOString();
  writeDataJs({
    profile: existing.profile,
    share: existing.share,
    projects: existing.projects,
    posts,
    syncedAt,
  });

  const added = nextPosts.filter((p) => !existingById.has(p.id)).length;
  const updated = nextPosts.filter((p) => existingById.has(p.id)).length;
  console.log(`完成（${method}）：新增 ${added}、更新 ${updated}、總計 ${posts.length}`);
  if (DRY_RUN) console.log("（dry-run，未寫入檔案）");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
