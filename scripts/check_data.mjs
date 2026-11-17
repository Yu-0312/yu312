#!/usr/bin/env node
/**
 * 資料形狀檢查：在任何東西被 commit / 部署前，把「網站會壞掉」的情況擋下來。
 *
 *   node scripts/check_data.mjs
 *
 * 會檢查：
 *   - data.js 該有的 global 都在（漏寫 global 曾讓友鏈整頁消失）
 *   - 貼文欄位、id 唯一、時間可解析、parts 非空、圖片檔真的存在
 *   - data.cats.js 的分類 id 有效、沒有指向不存在的貼文
 *   - data.en.js 的翻譯 id / 段數對得上
 *   - notes.js 的結構
 * 缺翻譯只算 warning（英文模式會退回中文），其他算 error（exit 1）。
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function load(file, globals) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(read(file), sandbox);
  } catch (err) {
    errors.push(`${file}: 無法解析（${err.message}）`);
    return null;
  }
  const out = {};
  for (const name of globals) out[name] = sandbox.window[name];
  return out;
}

const errors = [];
const warnings = [];

const data = load("data.js", ["PROFILE", "SHARE_ITEMS", "PROJECT_ITEMS", "THREADS_POSTS", "FRIEND_LINKS"]);
if (data) {
  const { PROFILE, SHARE_ITEMS, PROJECT_ITEMS, THREADS_POSTS, FRIEND_LINKS } = data;
  if (!PROFILE || !PROFILE.name || !PROFILE.handle) errors.push("data.js: PROFILE 缺少 name / handle");
  for (const [name, value] of Object.entries({ SHARE_ITEMS, PROJECT_ITEMS, THREADS_POSTS, FRIEND_LINKS })) {
    if (!Array.isArray(value)) errors.push(`data.js: window.${name} 不是陣列（同步腳本漏寫？）`);
  }

  const posts = Array.isArray(THREADS_POSTS) ? THREADS_POSTS : [];
  const ids = new Set();
  for (const p of posts) {
    const where = `data.js: 貼文 ${p?.id || "(沒有 id)"}`;
    if (!p || typeof p !== "object") { errors.push("data.js: THREADS_POSTS 有非物件項目"); continue; }
    if (!p.id) errors.push(`${where}: 缺少 id`);
    else if (ids.has(p.id)) errors.push(`${where}: id 重複`);
    else ids.add(p.id);
    if (!p.url || !/^https?:\/\//.test(p.url)) errors.push(`${where}: url 不合法`);
    if (!p.time || Number.isNaN(Date.parse(p.time))) errors.push(`${where}: time 無法解析`);
    if (!Array.isArray(p.parts) || !p.parts.length || p.parts.some((t) => typeof t !== "string" || !t.trim())) {
      errors.push(`${where}: parts 必須是非空的字串陣列`);
    }
    if (!Array.isArray(p.imgs)) errors.push(`${where}: imgs 必須是陣列`);
    if (!Array.isArray(p.links)) errors.push(`${where}: links 必須是陣列`);
    if (p.thread !== undefined && (!Array.isArray(p.thread) || p.thread.some((id) => typeof id !== "string"))) {
      errors.push(`${where}: thread 必須是字串陣列`);
    }
    for (const im of p.imgs || []) {
      if (!im || !im.src) { errors.push(`${where}: 圖片缺少 src`); continue; }
      if (im.src.startsWith("http")) continue;
      if (!fs.existsSync(path.join(ROOT, im.src))) errors.push(`${where}: 圖片檔不存在 ${im.src}`);
    }
  }

  if (Array.isArray(FRIEND_LINKS) && FRIEND_LINKS.length === 0) {
    warnings.push("data.js: FRIEND_LINKS 是空的（友鏈頁會沒有內容）");
  }
  for (const f of Array.isArray(FRIEND_LINKS) ? FRIEND_LINKS : []) {
    if (!f.name || !f.url || !/^https?:\/\//.test(f.url)) warnings.push(`data.js: 友鏈項目不完整 ${JSON.stringify(f).slice(0, 80)}`);
  }

  // 分類
  const cats = load("data.cats.js", ["POST_CATS"])?.POST_CATS;
  const defs = load("categories.js", ["CAT_DEFS"])?.CAT_DEFS || [];
  if (!cats || typeof cats !== "object") {
    errors.push("data.cats.js: window.POST_CATS 不是物件");
  } else {
    for (const [id, v] of Object.entries(cats)) {
      if (!ids.has(id)) errors.push(`data.cats.js: ${id} 不在 data.js 的貼文裡（id 改了或貼文被刪？）`);
      if (!v || !defs.some((d) => d.id === v.c)) errors.push(`data.cats.js: ${id} 的分類 ${v?.c} 不在 categories.js`);
      if (v && v.t !== undefined && !Array.isArray(v.t)) errors.push(`data.cats.js: ${id} 的 t 必須是陣列`);
    }
    const uncategorized = posts.filter((p) => !cats[p.id]).length;
    if (uncategorized) warnings.push(`data.cats.js: ${uncategorized} 則貼文尚未分類（會顯示「未分類」）`);
  }

  // 英文翻譯
  const en = load("data.en.js", ["EN"])?.EN;
  if (!en) {
    errors.push("data.en.js: window.EN 不存在（請跑 npm run build-i18n）");
  } else {
    const enPosts = en.posts || {};
    for (const p of posts) {
      const t = enPosts[p.id];
      if (!t) continue;
      if (!Array.isArray(t.parts) || t.parts.length !== p.parts.length) {
        errors.push(`data.en.js: ${p.id} 段數與 data.js 不符（${t?.parts?.length} vs ${p.parts.length}）`);
      }
    }
    for (const id of Object.keys(enPosts)) {
      if (!ids.has(id)) warnings.push(`data.en.js: ${id} 不在 data.js 裡（翻譯孤兒）`);
    }
    const untranslated = posts.filter((p) => !enPosts[p.id]).length;
    if (untranslated) warnings.push(`data.en.js: ${untranslated} 則貼文沒有英文版（英文模式會顯示原文）`);
  }
}

// 筆記
const notes = load("notes.js", ["NOTES"])?.NOTES;
if (!Array.isArray(notes)) {
  errors.push("notes.js: window.NOTES 不是陣列");
} else {
  const slugs = new Set();
  for (const n of notes) {
    if (!n || !n.slug || !n.title) { errors.push("notes.js: 筆記缺少 slug / title"); continue; }
    if (slugs.has(n.slug)) errors.push(`notes.js: slug 重複 ${n.slug}`);
    slugs.add(n.slug);
    if (typeof n.body !== "string") errors.push(`notes.js: ${n.slug} 的 body 必須是字串`);
    if (n.time && Number.isNaN(Date.parse(n.time))) errors.push(`notes.js: ${n.slug} 的 time 無法解析`);
  }
}

for (const w of warnings) console.warn(`  warning: ${w}`);
if (errors.length) {
  console.error(`\n資料檢查失敗（${errors.length} 個錯誤）：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`資料檢查通過${warnings.length ? `（${warnings.length} 個 warning）` : ""}。`);
