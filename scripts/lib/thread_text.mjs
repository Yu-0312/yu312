const NOISE_LINES = [
  /^Translate$/i,
  /^翻譯$/,
  /^See more$/i,
  /^Show more$/i,
  /^查看更多$/,
  /^View \d+ more$/i,
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
  /^[\d.,]+[kKmM]? ?(likes?|replies|reposts|views|shares|quotes)$/i,
  /^(like|reply|repost|share|quote|bookmark|heart)s?$/i,
  /^讀取更多$/i,
  /^收合$/,
];

const ACTION_LINE = /^(Reply|Like|Repost|Share|Quote|Send|View all \d+ comments|View \d+ more)$/i;

// Threads 的互動標籤只會出現在貼文最下面；「Media」「Quotes」也可能是正文的一行，
// 所以只在結尾連續移除，不做全域過濾。
const TRAILING_NOISE = /^(Threads|Replies|Reposts|Media|Quotes)$/i;

function isNoiseLine(line) {
  const text = line.trim();
  if (!text) return false;
  return NOISE_LINES.some((pattern) => pattern.test(text));
}

export function cleanPostText(raw, handle = "yuqi._.0313") {
  const lines = String(raw || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .filter((line) => !isNoiseLine(line));

  // Remove account name / relative timestamp only at the very beginning.
  while (lines.length) {
    const line = lines[0].trim();
    if (line === handle || new RegExp(`^@?${handle.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i").test(line)) {
      lines.shift();
      continue;
    }
    if (
      /^\d+[mhdwMy]$/.test(line) ||
      /^\d+\s*(minute|hour|day|week|month|year)s?$/i.test(line) ||
      /^\d+\s*(分鐘|小時|天|週|個月|年)前?$/.test(line) ||
      /^(剛剛|昨天|前天)$/.test(line)
    ) {
      lines.shift();
      continue;
    }
    break;
  }

  // Remove trailing interaction labels, but never discard a plain numeric line:
  // it may be a numbered list, year, amount, or other authored content.
  while (lines.length) {
    const line = lines[lines.length - 1].trim();
    if (!line) {
      lines.pop();
      continue;
    }
    if (TRAILING_NOISE.test(line) || ACTION_LINE.test(line) || /^(全部|查看全部)留言$/.test(line)) {
      lines.pop();
      continue;
    }
    break;
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const CONTINUATION_MARKER_LINE = /^(?:continued|\(\s*continued\s*\)|（\s*(?:留言續|以下接續)\s*）|留言續|以下接續|↓)$/i;
const CONTINUATION_MARKER_END = /(?:\(\s*continued\s*\)|（\s*(?:留言續|以下接續)\s*）|↓)\s*$/i;

export function splitParts(text) {
  const source = String(text || "").replace(/\r\n/g, "\n");
  if (!source) return [""];
  const parts = [];
  let current = [];
  const flush = () => {
    const part = current.join("\n").trim();
    if (part) parts.push(part);
    current = [];
  };

  for (const line of source.split("\n")) {
    if (CONTINUATION_MARKER_LINE.test(line.trim())) {
      flush();
      continue;
    }
    const marker = line.match(CONTINUATION_MARKER_END);
    if (marker) {
      const content = line.slice(0, marker.index).trimEnd();
      if (content) current.push(content);
      flush();
      continue;
    }
    current.push(line);
  }
  flush();
  return parts.length ? parts : [source.trim()];
}
