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
- **番茄鐘／網站按讚**：首頁番茄鐘可設定 1–120 分鐘；心心按讚與主畫面數字即時同步，且不會連動 Threads。按讚資料保存在使用者的瀏覽器中。
- 設定全部存在瀏覽器 `localStorage`，純靜態、不打後端

## 動態頁與 AI 分類

`posts.html` 是時間軸列表：上方可切換 **日 / 週 / 月 / 年 / 分類** 五種分組（選擇會記在瀏覽器，預設「月」），再用分類標籤、搜尋、「有圖片」篩選；點一列就地展開整則貼文，看過的會標「已閱讀」。舊的 `posts.html#<貼文id>` 連結仍會自動展開那一則。

**分類由 AI 依內容判斷，不看貼文發在哪個 Threads 社群**，沒有東西會被預設成「日常」：

- `categories.js`：分類定義（AI 新知 / 工具與資源 / 提示詞 / 活動與機會 / 開發與教學 / 觀點與心得 / 日常），想增減分類改這裡
- `data.cats.js`：每則貼文的分類與主題標籤（`c` 分類、`t` 標籤）。獨立於 `data.js`，每日同步不會洗掉；可手動改，已有的項目不會被覆蓋
- `scripts/classify_posts.mjs`（`npm run classify`）：用 Claude API 幫還沒分類的貼文分類；`--dry-run` 只看會處理哪些，`--all` 全部重分
- 每日同步（`sync-threads.yml`）會在抓到新貼文後自動跑這支，需要 repo secret `ANTHROPIC_API_KEY`；沒設就略過，新貼文會先顯示在「未分類」

## 語言切換（中文 / English）

每頁右上角的 🌐 按鈕可在中文與英文間切換（選擇存在瀏覽器；網址加 `?lang=en` 也可直接開英文版）。預設是中文。

- `i18n.js`：切換邏輯。英文模式下把畫面文字換成英文，沒翻到的字串會原樣（中文）顯示，不會壞
- `i18n/ui.en.js`：介面字典（中文原文 → 英文），要補介面文字就在這裡加一行
- `i18n/content.en.js`：個人簡介、專案 / 教學資源簡介、寫作台文章的英文版
- `i18n/posts.en.*.txt`：**Threads 貼文的英文翻譯**（格式見 `scripts/build_i18n.mjs` 開頭的說明；一則貼文一個 `## <貼文 id>`，多段貼文用單獨一行的 `---` 分段）
- `data.en.js`：由上面幾個來源組出來的檔案，網站實際讀它。**不要手改**，改來源後執行 `npm run build-i18n`

翻譯獨立於 `data.js`，所以每天的 Threads 自動同步不會把翻譯洗掉。新貼文進來後還沒翻譯時，英文模式會顯示原文並標註「Not yet translated」。

```bash
npm run i18n:missing   # 列出還沒翻譯的貼文
npm run build-i18n     # 把 i18n/ 的來源檔組成 data.en.js（會檢查段數、id 是否對得上）
npm run translate-new  # 用 Claude API 把缺的貼文翻成英文（寫進 i18n/posts.en.auto.txt）
```

**新貼文自動翻譯**：每日同步（`sync-threads.yml`）抓到新貼文後，會接著跑 `scripts/translate_new.mjs` 翻譯缺的貼文，再重建 `data.en.js` 一起 commit。需要在 repo 的 Settings → Secrets and variables → Actions 新增 `ANTHROPIC_API_KEY`；沒設就自動略過（英文模式顯示中文原文）。想修自動翻的句子，直接改 `i18n/posts.en.auto.txt` 對應那則即可，不會被覆蓋。可用環境變數 `TRANSLATE_MODEL` 換模型。

## 筆記只有站主能發布

筆記頁的文章都是站主（Yu）的，其他人無法發布：

- 發布需要同時有 `WRITE_PASSWORD`（只存在 GitHub Secrets）與一個對此 repo 有寫入權限的 GitHub Token；兩樣都沒人拿到就送不進去
- `publish-note.yml` 另外加了 `github.actor == github.repository_owner` 的檢查：即使別人（含協作者）把加密檔推進 `notes/inbox/`，或手動觸發 workflow，也不會發布
- 想徹底鎖死：不要把 `WRITE_PASSWORD` 或你的 token 給任何人，也別把其他人加成這個 repo 的協作者

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

**多段貼文（thread / 續文）會合併成一張卡片**：Threads 的續文各自有獨立 post id，但在頁面內嵌 JSON（`data-sjs` script 與 GraphQL 回應）中會放在同一個 `thread_items` 陣列。同步以此為依據，把整個 thread 併入第一則（root），每段續文變成 `parts` 的一個元素，並在資料中記錄 `thread` 成員 id——之後的同步不會把續文再拆成獨立卡片，舊的續文連結（`posts.html#<續文id>`）也會導向合併後的卡片。

> 補充：公開頁未登入時 Threads 只顯示最前面幾則（登入牆），所以每天抓主要是「增量收新貼文」。若之後設定 `THREADS_ACCESS_TOKEN`，會自動改走官方 API 並補齊完整歷史（注意：官方 API 拿不到 thread 分組，續文合併只在瀏覽器抓取路徑生效）。

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
