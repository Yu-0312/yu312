-- =====================================================================
-- 個人部落格資料庫設定
-- 在 Supabase 後台 → SQL Editor → New query，整份貼上後按 Run
--
-- ⚠️ 執行前先把下面這行的 email 換成你 Supabase 登入用的 email
-- =====================================================================

-- 這個函式定義「誰是站長」。只有這個 email 能發文、改文、刪文。
create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'wang.yuchi.312@gmail.com';
$$;


-- ---------------------------------------------------------------------
-- 文章資料表
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  excerpt     text default '',
  content     text not null default '',
  tags        text[] not null default '{}',
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists posts_published_created_idx
  on public.posts (published, created_at desc);


-- 每次更新自動記錄修改時間
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------
-- Row Level Security：這是安全的關鍵，不能省略
--
-- 沒有這段的話，任何人拿到 anon key 就能刪光你的文章。
-- 有了這段，anon key 公開在原始碼裡也沒關係——資料庫只允許讀已發布的文章。
-- ---------------------------------------------------------------------
alter table public.posts enable row level security;

drop policy if exists "anyone reads published posts" on public.posts;
create policy "anyone reads published posts"
  on public.posts for select
  using (published = true);

drop policy if exists "owner reads everything" on public.posts;
create policy "owner reads everything"
  on public.posts for select
  to authenticated
  using (public.is_owner());

drop policy if exists "owner inserts" on public.posts;
create policy "owner inserts"
  on public.posts for insert
  to authenticated
  with check (public.is_owner());

drop policy if exists "owner updates" on public.posts;
create policy "owner updates"
  on public.posts for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "owner deletes" on public.posts;
create policy "owner deletes"
  on public.posts for delete
  to authenticated
  using (public.is_owner());


-- ---------------------------------------------------------------------
-- 一篇範例文章，確認前台讀得到資料。確認後可以在後台刪掉。
-- ---------------------------------------------------------------------
insert into public.posts (slug, title, excerpt, content, tags, published)
values (
  'hello-world',
  '第一篇：這個部落格是怎麼搭起來的',
  '靜態網頁 + Supabase，零成本、不用買網域，但登入和發文是真的。',
  E'## 為什麼不是純靜態網頁\n\n一開始這個網站只是一個 HTML 檔案，放在 GitHub Pages 上。純靜態的好處是免費又快，但它有一個硬限制：**沒有地方存資料**。\n\n登入需要知道「誰是誰」，發文需要把文章存起來。這兩件事都需要一個會記住東西的後端。\n\n## 現在的架構\n\n- **前台**：GitHub Pages，還是靜態 HTML\n- **資料**：Supabase 的 PostgreSQL 資料表\n- **登入**：Supabase Auth，寄一封含登入連結的信\n\n## 那把公開的金鑰安全嗎\n\n原始碼裡有一把 anon key，任何人都看得到。這是設計上就允許的——真正把關的是資料庫的 Row Level Security：\n\n1. 沒登入的人，只能讀到 `published = true` 的文章\n2. 只有站長的 email 能新增、修改、刪除\n\n換句話說，就算有人拿走那把金鑰，他也只能做到「讀你本來就公開的文章」。',
  array['技術筆記','Supabase'],
  true
)
on conflict (slug) do nothing;
