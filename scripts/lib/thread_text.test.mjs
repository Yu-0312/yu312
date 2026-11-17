import test from "node:test";
import assert from "node:assert/strict";
import { cleanPostText, splitParts } from "./thread_text.mjs";

test("preserves authored numeric lines and numbered lists", () => {
  assert.equal(cleanPostText("步驟如下\n1\n2\n3\n完成"), "步驟如下\n1\n2\n3\n完成");
  assert.equal(cleanPostText("2026\n"), "2026");
});

test("removes account metadata and trailing engagement UI", () => {
  assert.equal(cleanPostText("@yuqi._.0313\n2h\n貼文內容\nLike\nReply"), "貼文內容");
});

test("does not split ordinary prose containing continued", () => {
  assert.deepEqual(splitParts("continued pretraining 是關鍵"), ["continued pretraining 是關鍵"]);
  assert.deepEqual(splitParts("A continued story"), ["A continued story"]);
});

test("splits only explicit continuation markers", () => {
  assert.deepEqual(splitParts("第一段\n（留言續）\n第二段"), ["第一段", "第二段"]);
  assert.deepEqual(splitParts("First part (continued)\nSecond part"), ["First part", "Second part"]);
  assert.deepEqual(splitParts("第一段\n以下接續\n第二段"), ["第一段", "第二段"]);
});

test("keeps authored lines that look like interaction labels", () => {
  assert.equal(cleanPostText("Media\n這篇在講 Media 的演進"), "Media\n這篇在講 Media 的演進");
  assert.equal(cleanPostText("貼文內容\nThreads\nReplies"), "貼文內容");
});
