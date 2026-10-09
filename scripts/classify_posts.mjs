#!/usr/bin/env node
/**
 * 用 AI 依「貼文內容」幫還沒分類的 Threads 貼文分類，結果寫進 data.cats.js。
 *
 *   ANTHROPIC_API_KEY=... node scripts/classify_posts.mjs
 *   node scripts/classify_posts.mjs --dry-run      # 只列出會分類哪些
 *   node scripts/classify_posts.mjs --all          # 全部重分一次（會覆蓋既有結果）
 *
 * 分類只看內容，不看貼文發在哪個 Threads 社群；沒有明確理由時絕不歸到「日常」。
 * 分類定義在 categories.js（CAT_DEFS）。已經分好的貼文不會動，要手動改就直接編輯 data.cats.js。
 *
 * 環境變數：ANTHROPIC_API_KEY（沒有就略過，exit 0）、CLASSIFY_MODEL（預設 claude-sonnet-5-5）、
 *           CLASSIFY_MAX（單次上限，預設 30）
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data.cats.js");
const DRY = process.argv.includes("--dry-run");
const ALL = process.argv.includes("--all");
const seedIdx = process.argv.indexOf("--seed"); // 內部用：從 JSON 檔寫出初始 data.cats.js
const MODEL = process.env.CLASSIFY_MODEL || "claude-sonnet-5-5";
const MAX = Number(process.env.CLASSIFY_MAX || 30);
const KEY = process.env.ANTHROPIC_API_KEY;

function load(file, name) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), sandbox); } catch { /* 檔案不存在 = 空 */ }
  return sandbox.window[name];
}

function save(cats, posts) {
  // 依貼文由新到舊排列；已不在 data.js 的 id 也保留，避免意外丟資料
  const order = new Map(posts.map((p, i) => [p.id, i]));
  const ids = Object.keys(cats).sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9));
  const body = ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(cats[id])}`).join(",\n");
  fs.writeFileSync(
    OUT,
    "/* 貼文分類：c = 分類 id（見 categories.js），t = 主題標籤。由 scripts/classify_posts.mjs 以 AI 依內容判斷；\n" +
      "   可手動修改，已有的項目不會被覆蓋（除非用 --all）。獨立於 data.js，所以每日 Threads 同步不會洗掉。 */\n" +
      `window.POST_CATS = {\n${body}\n};\n`,
  );
}

const posts = load("data.js", "THREADS_POSTS") || [];
const defs = load("categories.js", "CAT_DEFS") || [];
const cats = ALL ? {} : { ...(load("data.cats.js", "POST_CATS") || {}) };

if (seedIdx > 0) {
  Object.assign(cats, JSON.parse(fs.readFileSync(process.argv[seedIdx + 1], "utf8")));
  save(cats, posts);
  console.log(`已寫入 ${Object.keys(cats).length} 筆。`);
  process.exit(0);
}

const SYSTEM = `你是幫 Threads 帳號整理貼文的分類助手。作者是台灣的學生，主要分享 AI 新知、工具、提示詞、活動資訊與自己的專案。
請「只依貼文內容」把每則貼文歸到下列其中一個分類：
${defs.map((d) => `- ${d.id}（${d.zh}）：${d.desc}`).join("\n")}

規則：
- 只看內容。貼文有沒有發到某個 Threads 社群、有沒有標籤，都不能當作判斷依據。
- 只有內容真的是與科技 / AI 無關的私人生活或閒聊，才能選 life。不確定時，選最貼近主題的分類，不要選 life。
- 同一則貼文只選一個最主要的分類。
- 另外給 1～3 個主題標籤 t：英文或專有名詞（例如 Claude Code、Codex、Hackathon、Prompt），每個不超過 24 字元，不要用中文句子，不要加 #。
只回 JSON：{"c":"<分類 id>","t":["標籤1","標籤2"]}`;

async function classify(post) {
  const text = post.parts.join("\n\n").slice(0, 3500);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 300, system: SYSTEM, messages: [{ role: "user", content: text }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const raw = (data.content || []).map((c) => c.text || "").join("");
  const m = /\{[\s\S]*\}/.exec(raw);
  if (!m) throw new Error("回應不是 JSON");
  const j = JSON.parse(m[0]);
  if (!defs.some((d) => d.id === j.c)) throw new Error(`未知分類：${j.c}`);
  const t = (Array.isArray(j.t) ? j.t : []).map((x) => String(x).replace(/^#/, "").trim()).filter((x) => x && x.length <= 24).slice(0, 3);
  return { c: j.c, t };
}

const todo = posts.filter((p) => !cats[p.id]);
if (!todo.length) { console.log("所有貼文都已分類。"); process.exit(0); }
console.log(`有 ${todo.length} 則貼文還沒分類${todo.length > MAX ? `，本次先處理 ${MAX} 則` : ""}。`);
if (DRY) { for (const p of todo.slice(0, MAX)) console.log("  ", p.id, (p.parts[0] || "").slice(0, 30).replace(/\n/g, " ")); process.exit(0); }
if (!KEY) { console.log("沒有設定 ANTHROPIC_API_KEY，略過自動分類（這些貼文會先顯示在「未分類」）。"); process.exit(0); }

let ok = 0;
for (const p of todo.slice(0, MAX)) {
  try {
    cats[p.id] = await classify(p);
    ok++;
    console.log("  ✓", p.id, cats[p.id].c, cats[p.id].t.join(","));
  } catch (e) {
    console.error("  ✗", p.id, e.message);
  }
}
if (ok) save(cats, posts);
console.log(`自動分類完成 ${ok}/${Math.min(todo.length, MAX)} 則。`);
