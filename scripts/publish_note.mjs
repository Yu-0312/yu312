import { readdir, readFile, writeFile, unlink, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { decryptNoteBlob } from "./write_crypto.mjs";

const INBOX = "notes/inbox";
const NOTES_FILE = "notes.js";

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w一-龥-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `note-${Date.now()}`;
}

function normalizeNote(raw) {
  const title = String(raw.title || "").trim() || "未命名";
  const slug = slugify(raw.slug || title);
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((t) => String(t).trim()).filter(Boolean)
    : String(raw.tags || "").split(/[,，\s]+/).filter(Boolean);
  return {
    slug,
    title,
    tags,
    cat: String(raw.cat || "未分類").trim() || "未分類",
    cover: String(raw.cover || "").trim(),
    body: String(raw.body || ""),
    time: raw.time && !Number.isNaN(Date.parse(raw.time))
      ? new Date(raw.time).toISOString()
      : new Date().toISOString(),
  };
}

async function loadNotes() {
  const src = await readFile(NOTES_FILE, "utf8");
  const match = src.match(/window\.NOTES\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!match) return [];
  return JSON.parse(match[1]);
}

async function saveNotes(list) {
  const body = `/* 寫作台發布的文章。由 GitHub Actions（publish-note.yml）更新。 */\nwindow.NOTES = ${JSON.stringify(list, null, 2)};\n`;
  await writeFile(NOTES_FILE, body);
}

async function blobsFromInbox() {
  let names = [];
  try {
    names = (await readdir(INBOX)).filter((n) => n.endsWith(".enc"));
  } catch {
    names = [];
  }
  const out = [];
  for (const name of names) {
    const file = path.join(INBOX, name);
    const text = (await readFile(file, "utf8")).trim();
    out.push({ file, name, text });
  }
  return out;
}

const password = process.env.WRITE_PASSWORD || "";
const direct = (process.env.NOTE_BLOB || "").trim();
const jobs = [];
if (direct) jobs.push({ file: null, name: "workflow_dispatch", text: direct });
jobs.push(...await blobsFromInbox());

if (!jobs.length) {
  console.log("No encrypted notes to publish");
  process.exit(0);
}

if (!password) {
  // Secret 尚未設定：不要動 inbox，避免把（未來可能解得開的）稿子刪掉
  console.error("WRITE_PASSWORD secret is not set; leaving inbox untouched");
  process.exit(1);
}

const list = await loadNotes();
let changed = false;
const done = [];
const failed = [];
for (const job of jobs) {
  try {
    const note = normalizeNote(await decryptNoteBlob(password, job.text));
    const i = list.findIndex((n) => n.slug === note.slug);
    if (i >= 0) list[i] = { ...list[i], ...note };
    else list.unshift(note);
    changed = true;
    done.push(job);
    console.log(`published slug=${note.slug}`);
  } catch (err) {
    // 解不開 = 密碼不對或檔案損壞，永遠救不回來；移到 failed/ 讓流水線繼續跑
    failed.push(job);
    if (job.file) {
      const dir = path.join(path.dirname(job.file), "failed");
      await mkdir(dir, { recursive: true });
      await rename(job.file, path.join(dir, job.name));
    }
    console.error(`failed ${job.name}: ${err.message}`);
  }
}

if (changed) {
  list.sort((a, b) => String(b.time).localeCompare(String(a.time)));
  await saveNotes(list);
}

for (const job of done) {
  if (job.file) await unlink(job.file);
}
if (failed.length) console.log(`${failed.length} note(s) moved to notes/inbox/failed`);
