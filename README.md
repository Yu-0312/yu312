# Yu

Yu（王宇錡 · [@yuqi._.0313](https://www.threads.com/@yuqi._.0313)）的個人站 — https://yu-0312.github.io/yu312/

## 頁面

- `index.html` — 首頁：問候、最新動態、近期圖片、時鐘與發文月曆、專注白噪音＋番茄鐘、隨機推薦、可拖曳卡片佈局
- `posts.html` — 動態：同步自 Threads 的全部貼文，可依主題 / 月份 / 時間範圍（日週月年）篩選與搜尋，圖片可放大，每則顯示 Threads 實際按讚數
- `projects.html` — 我的專案（GitHub，依星數排序）
- `share.html` — 教學資源：分類篩選、Views / Marks 收藏
- `friends.html` — 友鏈：朋友與喜歡的部落格
- `write.html` — 寫作台：純前端 Markdown 草稿（自動存本機、匯入 / 匯出 .md）
- `about.html` — 關於我

## 互動功能（`studio.js`）

- **設定面板**：`Ctrl/Cmd + ,` 或右下角齒輪開啟
  - 網站設定：站名、使用者名稱、簡介、社群按鈕（可排序 / 刪除）、時鐘秒數、文章分類
  - 色彩配置：五套配色（暖爐 / 苔綠 / 李子 / 深海 / 夜航）＋主色微調＋隨機配色
  - 首頁佈局：卡片順序說明與重設
- **拖曳首頁卡片**：右下角佈局鈕進入編輯模式，拖完自動記住
- **Views / Marks**：教學資源卡有瀏覽與收藏（存 localStorage）
- **收藏（♥）**：首頁心心顯示所有 Threads 貼文的按讚數總和（真實數據，隨每日同步更新）
- 設定全部存在瀏覽器 `localStorage`，純靜態、不打後端

## 資料

所有內容集中在 `data.js`：`PROFILE`、`THREADS_POSTS`（Threads 貼文，圖片在 `assets/threads/`）、`PROJECT_ITEMS`、`SHARE_ITEMS`、`FRIEND_LINKS`。
純靜態網頁，無框架、無追蹤碼，支援深色模式與 `prefers-reduced-motion`。

## Threads 自動同步

網站上的動態來自 Threads（[@yuqi._.0313](https://www.threads.com/@yuqi._.0313)），由 `scripts/sync_threads.mjs` 自動更新，GitHub Actions **每天**跑一次（也可在 Actions 手動觸發）。**預設不需要 API key。**

流程：

1. 用 Playwright 抓公開 Threads 頁（與先前人工匯出相同路徑）
2. 新貼文併入 `data.js` 的 `THREADS_POSTS`，圖片存到 `assets/threads/`
3. 逐則開公開 embed 頁，把每則貼文的實際按讚數存進 `likes`（首頁 ♥ 總和與動態頁卡片都用它）
4. 較舊貼文與人工標的 `tag` 會保留，不會被覆蓋
5. 有變更才 commit / push，GitHub Pages 自動部署

> 補充：公開頁未登入時 Threads 只顯示最前面幾則（登入牆），所以每天抓主要是「增量收新貼文」。若之後設定 `THREADS_ACCESS_TOKEN`，會自動改走官方 API 並補齊完整歷史。

### 本機執行

```bash
npm install
npx playwright install chromium
npm run sync-threads:dry   # 先看會改什麼
npm run sync-threads       # 真的寫入 data.js 與圖片
```

### 可選：官方 API（完整歷史）

1. Meta 後台建立 App → 加入 **Threads API** → 產生 token（需 `threads_basic`）
2. GitHub repo → **Settings → Secrets and variables → Actions** 新增 `THREADS_ACCESS_TOKEN`
3. 有 secret 時同步會自動改走 API，不需要改程式
