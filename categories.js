/* 貼文分類的定義（手動維護）。
   每則貼文實際屬於哪一類，記錄在 data.cats.js（由 AI 依貼文內容判斷，見 scripts/classify_posts.mjs）。
   desc 是給 AI 看的判斷準則；zh / en 是網站上顯示的名稱。 */
window.CAT_DEFS = [
  { id: "news", zh: "AI 新知", en: "AI News", desc: "模型 / 產品發布、版本更新、產業動態、評測與跑分、公司公告、爭議事件" },
  { id: "tools", zh: "工具與資源", en: "Tools & Resources", desc: "值得一用的工具 / App / 開源專案、免費額度與優惠、課程與學習資源、資訊來源整理" },
  { id: "prompts", zh: "提示詞", en: "Prompts", desc: "直接分享可複製使用的提示詞（含生圖提示詞與成果圖）" },
  { id: "events", zh: "活動與機會", en: "Events & Opportunities", desc: "黑客松 / 比賽 / 聚會 / 研討會 / 工作坊 / 大使計畫等報名資訊，以及參加活動的講者重點筆記" },
  { id: "dev", zh: "開發與教學", en: "Dev & Tutorials", desc: "作者自己做的專案 / 開源作品、程式教學、vibe coding 方法與實作經驗" },
  { id: "thoughts", zh: "觀點與心得", en: "Thoughts", desc: "作者的想法、觀察、讀後感、對影片 / 訪談 / 趨勢的看法與推薦" },
  { id: "life", zh: "日常", en: "Daily Life", desc: "與科技 / AI 無關的個人生活與閒聊。只有內容真的是私人日常才用，不要拿來當「其他」" },
];
