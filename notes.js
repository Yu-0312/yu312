/* 寫作台發布的文章。由 GitHub Actions（publish-note.yml）更新。 */
window.NOTES = [
  {
    "slug": "writing-desk-guide",
    "title": "寫作台使用說明",
    "tags": [
      "寫作台"
    ],
    "cat": "筆記",
    "cover": "",
    "body": "這是第一篇從**寫作台**加密發布的文章，順手當作使用說明。\n\n## 怎麼發布\n1. 到「寫作台」頁面，把 Word、網頁或任何 HTML 直接貼進編輯區——會自動轉成 Markdown，表格、清單、粗斜體都會保留。\n2. 寫好標題後按「發布到網站」，輸入發布密碼，再貼上一條 GitHub Token（fine-grained、只給這個 repo 的 Contents 讀寫權限）。\n3. 文章會用你的密碼加密後送進倉庫，GitHub Actions 用倉庫密鑰解密、寫進網站，密碼本身不會存在任何程式碼裡。\n\n## 小提醒\n- 密碼打錯的話文章發不出去，加密檔會被移到 `notes/inbox/failed/`，不會卡住之後的發布。\n- 草稿會自動存在瀏覽器裡；「匯入檔案」也吃 .docx / .md / .html。\n- 想刪掉這篇說明：編輯倉庫裡的 `notes.js` 就好。",
    "time": "2026-10-02T13:27:57.124Z"
  }
];
