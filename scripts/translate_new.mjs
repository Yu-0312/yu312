#!/usr/bin/env node
/**
 * 自動把「還沒有英文版」的 Threads 貼文翻成英文，寫進 i18n/posts.en.auto.txt，
 * 之後再跑 build_i18n.mjs 就會進 data.en.js。
 *
 *   ANTHROPIC_API_KEY=... node scripts/translate_new.mjs
 *   node scripts/translate_new.mjs --dry-run     # 只列出會翻哪些，不呼叫 API
 *
 * 環境變數：
 *   ANTHROPIC_API_KEY   必填；沒有就直接略過（exit 0），不會讓每日同步失敗
 *   TRANSLATE_MODEL     選填，預設 claude-sonnet-5-5
 *   TRANSLATE_MAX       選填，單次最多翻幾則（預設 20）
 *
 * 手動翻過的貼文（i18n/posts.en.NN.txt）不會被動到；這支只補缺的。
 * 想改自動翻的結果，直接編輯 posts.en.auto.txt 對應那則，下次不會被覆蓋。
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "i18n");
const OUT = path.join(DIR, "posts.en.auto.txt");
const DRY = process.argv.includes("--dry-run");
const MODEL = process.env.TRANSLATE_MODEL || "claude-sonnet-5-5";
const MAX = Number(process.env.TRANSLATE_MAX || 20);
const KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM = `You translate Traditional Chinese (Taiwan) Threads posts by a Taiwanese student/developer into natural English. Meaning accuracy comes first.
Rules:
- Translate faithfully. Do not add, drop, soften or embellish anything. Keep the author's tone (casual, enthusiastic, etc.).
- Keep URLs, @handles, #hashtags, emoji, numbering and line breaks exactly as in the source.
- Keep product / company / person names in their usual English form (e.g. Claude Code, Codex, Garry Tan). If a Chinese name has no standard English form, give pinyin with the original in parentheses.
- Drop obvious Threads UI debris that is not part of the author's writing (e.g. "3 1 View 1 more").
- If the source is cut off mid-sentence, end the English the same way; never invent a continuation.
- If something is genuinely ambiguous, choose the most literal reasonable reading.
- Output the same number of parts as the input, in the same order.
Reply with JSON only: {"parts": ["...", ...], "alts": {"0": "..."}}
"alts" translates the image alt texts that are given (keyed by image index); omit it if none are given.`;

function loadPosts() {
  const code = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.THREADS_POSTS || [];
}

function translatedIds() {
  const ids = new Set();
  for (const f of fs.readdirSync(DIR)) {
    if (!/^posts\.en\..*\.txt$/.test(f)) continue;
    for (const line of fs.readFileSync(path.join(DIR, f), "utf8").split("\n")) {
      const m = /^## (\S+)\s*$/.exec(line);
      if (m) ids.add(m[1]);
    }
  }
  return ids;
}

async function callApi(post) {
  const alts = {};
  (post.imgs || []).forEach((im, i) => { if (im.alt && /[一-鿿]/.test(im.alt)) alts[i] = im.alt; });
  const user = JSON.stringify({ parts: post.parts, ...(Object.keys(alts).length ? { alts } : {}) });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 8000, system: SYSTEM, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || "").join("");
  const json = /\{[\s\S]*\}/.exec(text);
  if (!json) throw new Error("回應不是 JSON");
  return JSON.parse(json[0]);
}

function toTxt(id, t) {
  let s = `## ${id}\n` + t.parts.map((p) => p.trim()).join("\n---\n") + "\n";
  for (const [i, a] of Object.entries(t.alts || {})) s += `@alt ${i} ${String(a).replace(/\n/g, " ").trim()}\n`;
  return s + "\n";
}

const posts = loadPosts();
const done = translatedIds();
const todo = posts.filter((p) => !done.has(p.id));
if (!todo.length) { console.log("沒有需要翻譯的新貼文。"); process.exit(0); }
console.log(`有 ${todo.length} 則貼文沒有英文版${todo.length > MAX ? `，本次先翻 ${MAX} 則` : ""}。`);
if (DRY) { for (const p of todo.slice(0, MAX)) console.log("  ", p.id, (p.parts[0] || "").slice(0, 30).replace(/\n/g, " ")); process.exit(0); }
if (!KEY) { console.log("沒有設定 ANTHROPIC_API_KEY，略過自動翻譯（英文模式會先顯示中文原文）。"); process.exit(0); }

let ok = 0;
for (const p of todo.slice(0, MAX)) {
  try {
    let t;
    for (let attempt = 0; attempt < 2; attempt++) {
      t = await callApi(p);
      if (Array.isArray(t.parts) && t.parts.length === p.parts.length && t.parts.every((s) => typeof s === "string" && s.trim())) break;
      t = null;
    }
    if (!t) throw new Error(`段數對不上（原文 ${p.parts.length} 段）`);
    fs.appendFileSync(OUT, toTxt(p.id, t));
    ok++;
    console.log("  ✓", p.id);
  } catch (e) {
    console.error("  ✗", p.id, e.message);
  }
}
console.log(`自動翻譯完成 ${ok}/${Math.min(todo.length, MAX)} 則。`);
