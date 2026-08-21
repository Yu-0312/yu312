# 部落格設定步驟

從零到能發文，大約 15 分鐘。全程免費，不用買網域。

---

## 1. 建立 Supabase 專案

1. 去 [supabase.com](https://supabase.com) 用 GitHub 帳號登入
2. **New project** → 名稱填 `blog`（隨意）→ 選 `Northeast Asia (Tokyo)` 這類近一點的區域
3. 資料庫密碼隨機產生就好，這個專案用不到
4. 等建立完成（約 2 分鐘）

## 2. 建立資料表

1. 左側選單 → **SQL Editor** → **New query**
2. 把 `supabase-setup.sql` 整份貼上
3. **執行前先確認第 12 行的 email** 是你 Supabase 登入用的那個
4. 按 **Run**

跑完應該顯示成功。這份 SQL 會建立三樣東西：文章資料表、權限規則，以及存放文章圖片的 `post-images` 空間，並插入一篇範例文章。

可以到左側 **Storage** 確認有出現 `post-images`。

## 3. 拿到連線資訊

1. 左下角 **Project Settings** → **API**
2. 複製 **Project URL** 和 **anon public** 這兩個值
3. 打開 `config.js`，貼進去：

```js
export const SUPABASE_URL = "https://abcdefgh.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGci...";
export const OWNER_EMAIL = "wang.yuchi.312@gmail.com";
```

> ⚠️ 只複製 **anon public**。旁邊那把 `service_role` 可以繞過所有權限，絕對不能放進前端檔案。

## 4. 設定登入回來的網址

Supabase 寄的登入信會把你導回網站，得先告訴它哪些網址是合法的。

**Authentication** → **URL Configuration**：

- **Site URL**：`https://yu-0312.github.io/yu312/admin.html`
- **Redirect URLs** 新增這兩行：
  - `https://yu-0312.github.io/yu312/admin.html`
  - `http://localhost:8000/admin.html`

第二行是為了本機測試用。

## 5. 本機測試

```bash
cd ~/yu312
python3 -m http.server 8000
```

打開 `http://localhost:8000` — 應該看得到範例文章。
再開 `http://localhost:8000/admin.html` 試登入。

> 一定要用伺服器，不能直接雙擊開檔案。`type="module"` 在 `file://` 下會被瀏覽器擋掉。

## 6. 上線

```bash
cd ~/yu312
git add -A
git commit -m "add blog with supabase"
git push
```

等一分鐘後開 `https://yu-0312.github.io/yu312/`。

---

## 檔案在做什麼

| 檔案 | 用途 |
|---|---|
| `index.html` | 首頁：專案 + 最新三篇文章 |
| `blog.html` | 文章列表；帶 `?post=slug` 時顯示單篇 |
| `admin.html` | 後台：登入、寫文、編輯、刪除 |
| `styles.css` | 全站共用樣式 |
| `config.js` | **唯一需要你修改的檔案** |
| `app.js` | Supabase 連線、Markdown 轉換 |
| `supabase-setup.sql` | 資料表與權限規則 |

## 怎麼發一篇文章

1. 開 `你的網址/admin.html`
2. 輸入 email → 收信 → 點信裡的連結
3. 填標題和內文 → 勾「發布這篇文章」→ 儲存

不勾發布就是草稿，只有你看得到。

### 插入圖片

三種方式都可以，上傳完會自動把 Markdown 插到游標位置：

- 按「選擇檔案」挑圖
- 把圖片拖進虛線框
- 截圖後直接在內文按 `Cmd/Ctrl + V`

單張上限 5MB，免費方案總共 1GB。圖片存在 Supabase Storage，不會佔用 GitHub repo 空間。

檔名會自動改寫成安全格式並加上日期資料夾，例如 `2026-08-21/1787324590986-截圖.png`，所以同名檔案不會互相覆蓋。

內文支援 Markdown：

```
## 大標題
### 小標題

這是**粗體**，這是*斜體*，這是 `程式碼`。

- 項目一
- 項目二

1. 第一
2. 第二

> 引用一段話

[連結文字](https://example.com)
![圖片說明](圖片網址)

```程式碼區塊```
```

---

## 安全性

**為什麼 anon key 可以公開？** 因為真正把關的是資料庫的 Row Level Security，不是那把金鑰。規則設成：

- 任何人（含未登入）→ 只能**讀取** `published = true` 的文章
- 只有 `is_owner()` 通過的 email → 才能新增、修改、刪除

就算有人拿走 anon key，他能做的也只是「讀你本來就公開的文章」。

**文章內容有做逸出處理。** 所有從資料庫讀出來的文字都會先轉義再顯示，所以就算內文含 `<script>` 也只會顯示成文字，不會被執行。我用 13 組常見的 XSS 攻擊字串測過，輸出只會產生白名單內的標籤，連結也只允許 `http://` 和 `https://`。

**後台頁面本身是公開的。** `admin.html` 任何人都能打開，但沒有站長 email 的登入連結就什麼都做不了。這是正常設計——真正的防線在資料庫，不在「藏起來的網址」。

## 常見問題

**登入信沒收到** — 先看垃圾郵件。Supabase 免費方案內建的寄信服務有每小時額度限制，超過要等。

**點了信裡的連結卻沒登入** — 多半是第 4 步的 Redirect URLs 沒設對，網址要完全一致（含 `https://` 和結尾）。

**文章存不進去，出現權限錯誤** — `config.js` 的 `OWNER_EMAIL` 和 SQL 裡 `is_owner()` 的 email 必須完全一樣。

**圖片上傳失敗，說找不到 bucket** — SQL 沒跑完整。回 SQL Editor 重跑一次 `supabase-setup.sql`，整份可以重複執行不會出問題。

**圖片上傳成功但文章裡顯示不出來** — 到 Storage → `post-images` → Configuration，確認 Public bucket 是開啟的。圖片網址必須公開，讀者的瀏覽器才載得到。

**首頁顯示「尚未連上資料庫」** — `config.js` 還沒填。
