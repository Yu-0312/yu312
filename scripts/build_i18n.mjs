#!/usr/bin/env node
/**
 * 把 i18n/ 底下的英文翻譯組成 data.en.js（網站在英文模式讀它）。
 *
 *   npm run build-i18n        # 產生 data.en.js
 *   npm run i18n:missing      # 列出還沒翻譯的貼文（不寫檔）
 *   --lenient                 # 段數對不上等問題只警告、略過該則（GitHub Actions 用）
 *
 * 來源：
 *   i18n/posts.en.*.txt   貼文翻譯。格式：
 *       ## <貼文 id>
 *       第一段文字（可多行）
 *       ---                 ← 單獨一行的 --- 代表下一段（對應 data.js 的 parts）
 *       第二段文字
 *       @alt <圖片序號> <圖片說明的英文>   ← 可選；圖片序號從 0 開始
 *   i18n/ui.en.js         介面字典：中文原文 → 英文（手寫）
 *   i18n/content.en.js    個人簡介、專案 / 教學資源簡介、寫作台文章（手寫）
 *
 * 為什麼獨立成檔：data.js 每天會被 Threads 同步覆蓋，翻譯放在裡面會被洗掉。
 * 新貼文還沒翻譯時，英文模式會顯示原文並標示「尚未翻譯」，不會壞掉。
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "i18n");
const MISSING_ONLY = process.argv.includes("--missing");
const LENIENT = process.argv.includes("--lenient"); // 自動流程用：有問題的貼文略過，其餘照常輸出

function loadPosts() {
  const code = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.THREADS_POSTS || [];
}

function parseTxt(file) {
  const out = {};
  let cur = null;
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const m = /^## (\S+)\s*$/.exec(raw);
    if (m) {
      cur = { parts: [[]], alts: {} };
      out[m[1]] = cur;
      continue;
    }
    if (!cur) continue;
    if (raw === "---") { cur.parts.push([]); continue; }
    const a = /^@alt (\d+) (.*)$/.exec(raw);
    if (a) { cur.alts[a[1]] = a[2].trim(); continue; }
    cur.parts[cur.parts.length - 1].push(raw);
  }
  for (const v of Object.values(out)) {
    v.parts = v.parts.map((lines) => lines.join("\n").replace(/^\n+|\s+$/g, ""));
  }
  return out;
}

const posts = loadPosts();
const files = fs.readdirSync(DIR).filter((f) => /^posts\.en\..*\.txt$/.test(f)).sort();
const tr = {};
for (const f of files) Object.assign(tr, parseTxt(path.join(DIR, f)));

const problems = [];
const missing = [];
const outPosts = {};
for (const p of posts) {
  const t = tr[p.id];
  if (!t) { missing.push(p.id); continue; }
  if (t.parts.length !== p.parts.length) {
    problems.push(`${p.id}: 段數不符（原文 ${p.parts.length} 段，翻譯 ${t.parts.length} 段）`);
    continue;
  }
  if (t.parts.some((s) => !s)) problems.push(`${p.id}: 有空白的段落`);
  const entry = { parts: t.parts };
  if (Object.keys(t.alts).length) entry.alts = t.alts;
  outPosts[p.id] = entry;
}
for (const id of Object.keys(tr)) {
  if (!posts.some((p) => p.id === id)) problems.push(`${id}: data.js 裡沒有這則貼文（可能已被刪除或 id 寫錯）`);
}

if (missing.length) {
  console.log(`尚未翻譯 ${missing.length} 則：`);
  for (const id of missing) {
    const p = posts.find((x) => x.id === id);
    console.log(`  ${id}  ${p.time.slice(0, 10)}  ${(p.parts[0] || "").split("\n")[0].slice(0, 40)}`);
  }
}
if (problems.length) {
  console.error("\n發現問題：\n" + problems.map((s) => "  - " + s).join("\n"));
  if (!MISSING_ONLY && !LENIENT) process.exit(1);
}
if (MISSING_ONLY) process.exit(0);

const staticSrc = fs
  .readdirSync(DIR)
  .filter((f) => /\.en\.js$/.test(f))
  .sort()
  .map((f) => fs.readFileSync(path.join(DIR, f), "utf8"))
  .join("\n");
const header =
  "/* 英文翻譯資料 — 由 scripts/build_i18n.mjs 產生，請改 i18n/ 底下的來源檔再重新 build，不要直接改這支。\n" +
  "   獨立於 data.js，所以每日的 Threads 同步不會把翻譯洗掉。 */\n";
const body =
  "window.EN = window.EN || {};\n" +
  "window.EN.posts = " + JSON.stringify(outPosts, null, 1) + ";\n\n" +
  staticSrc;
fs.writeFileSync(path.join(ROOT, "data.en.js"), header + body);
console.log(`\ndata.en.js 已更新：${Object.keys(outPosts).length}/${posts.length} 則貼文有英文版。`);
