/* 貼文分類的定義（手動維護）。
   每則貼文實際屬於哪一類，記錄在 data.cats.js（由 AI 依貼文內容判斷，見 scripts/classify_posts.mjs）。
   desc 是給 AI 看的判斷準則；zh / en 是網站上顯示的名稱。
   刻意只留少數幾類，避免分得太細；要增減分類改這裡，再用 node scripts/classify_posts.mjs --all 重分。 */
window.CAT_DEFS = [
  { id: "news", zh: "AI 新知", en: "AI News", desc: "模型 / 產品發布、版本更新、產業動態、評測與跑分、公司公告、爭議事件、AI 相關的重大消息" },
  { id: "tools", zh: "工具與資源", en: "Tools & Resources", desc: "值得一用的工具 / App / 外掛 / 開源專案、免費額度與優惠、提示詞（含生圖提示詞）、課程與學習資源、資訊來源整理" },
  { id: "events", zh: "活動與機會", en: "Events & Opportunities", desc: "黑客松 / 比賽 / 聚會 / 研討會 / 工作坊 / 大使計畫等報名資訊，以及參加活動的講者重點筆記" },
  { id: "mine", zh: "我的作品", en: "My Work", desc: "作者自己做的專案 / 開源作品、自己寫的程式教學、vibe coding 方法與實作經驗" },
  { id: "voice", zh: "想法與日常", en: "Thoughts & Daily Life", desc: "作者個人的想法、觀察、讀後感、對影片 / 訪談 / 趨勢的看法與推薦，以及日常閒聊。只要貼文有明確的 AI / 科技消息或工具主題，就不要選這類" },
];
