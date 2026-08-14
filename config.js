// =====================================================================
// 全站設定 —— 只需要改這個檔案，三個頁面都會跟著生效
//
// 這兩個值去哪裡拿：
//   Supabase 後台 → 左下角 Project Settings → API
//   Project URL      貼到 SUPABASE_URL
//   anon / public key 貼到 SUPABASE_ANON_KEY
//
// anon key 公開在原始碼裡是正常的，Supabase 就是這樣設計的。
// 真正的防護在資料庫的 RLS 規則（見 supabase-setup.sql）。
// 絕對不要把 service_role key 貼到這裡——那把可以繞過所有權限。
// =====================================================================

export const SUPABASE_URL = "https://你的專案代號.supabase.co";
export const SUPABASE_ANON_KEY = "貼上你的 anon public key";

// 站長 email，要和 supabase-setup.sql 裡 is_owner() 的 email 一致
export const OWNER_EMAIL = "wang.yuchi.312@gmail.com";

export const SITE = {
  name: "王宇錡 Max Wang",
  tagline: "程式專案與寫作",
  github: "https://github.com/Yu-0312",
};
