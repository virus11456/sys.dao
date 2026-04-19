# sys.dao 雲端同步設定（Supabase）

這份設定做完一次就好。大約 5 分鐘。

---

## 1. 在 Supabase 建 table

進到 https://supabase.com/dashboard/project/cvbvijdmqpkdbntegmqf/sql/new （SQL Editor）

貼上以下 SQL，然後按右下角 **Run**：

```sql
-- kv_sync: 每個使用者的 key/value 同步表
create table if not exists public.kv_sync (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  key        text        not null,
  value      text        not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- 啟用 Row Level Security（RLS）
alter table public.kv_sync enable row level security;

-- 政策：使用者只能讀/寫自己的資料
drop policy if exists "own rows read" on public.kv_sync;
create policy "own rows read" on public.kv_sync
  for select using (auth.uid() = user_id);

drop policy if exists "own rows insert" on public.kv_sync;
create policy "own rows insert" on public.kv_sync
  for insert with check (auth.uid() = user_id);

drop policy if exists "own rows update" on public.kv_sync;
create policy "own rows update" on public.kv_sync
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows delete" on public.kv_sync;
create policy "own rows delete" on public.kv_sync
  for delete using (auth.uid() = user_id);
```

執行後應該會看到 `Success. No rows returned`。

---

## 2. 設定 Auth

進到 https://supabase.com/dashboard/project/cvbvijdmqpkdbntegmqf/auth/providers

- **Email 登入**：預設就是開的，不用動
- **Confirm email**：建議**關掉**（個人用免等驗證信） → Save changes
- （舊版：Anonymous Sign-Ins — 現在沒用到，不管它）

---

## 3. 安裝前端 dependency

在 sys.dao 專案資料夾裡：

```bash
npm install
```

（`package.json` 已經新增了 `@supabase/supabase-js`，所以 `npm install` 會自動裝）

---

## 4. 測試

```bash
npm run dev
```

打開後：

- 第一次：自動匿名登入 → 往日 tab 最底下的「◉ CLOUD」會變 cyan（已連雲端）
- 開 DevTools → Console，不應該有 `[sync] push failed` 錯誤
- Supabase Dashboard → Table Editor → kv_sync → 應該開始看到你的資料 row

---

## 使用方式

在 sys.dao 裡進「往日」tab，滑到最底找「◉ CLOUD」面板：

**第一次使用（任何裝置）：**
- 按「註冊 · SIGN UP」→ 填 email + 密碼（≥6 字）→ 按「▸ 註冊並登入」
- 本機所有歷史資料會自動 push 上雲

**換裝置同步：**
- 在新裝置打開 app → CLOUD 面板「登入 · SIGN IN」→ 填同一組 email/密碼
- 雲端資料會自動拉下來

**其他：**
- **立即同步** → 手動雙向同步（pull + push）
- **登出** → 切斷本機與雲端連線，本機資料仍在 localStorage

---

## 疑難排解

| 症狀 | 可能原因 / 解法 |
|---|---|
| 「◉ CLOUD」一直紅色（離線） | 檢查 step 2 匿名登入是否開啟 |
| Console 報 `relation "public.kv_sync" does not exist` | step 1 SQL 沒跑成功，重跑一次 |
| Console 報 `new row violates row-level security` | RLS policies 沒建好，重跑 step 1 的後半段 |
| 雲端有資料但恢復不回來 | 檢查恢復碼是否完整複製（很長，有時會漏字） |
| 想清空雲端全部重來 | SQL Editor 跑：`delete from public.kv_sync where user_id = auth.uid();` |

---

## 安全備註

- `sb_publishable_...` 這把 key 寫在前端是設計上允許的（專給前端用）
- 真正保護資料的是 **RLS policies** — 沒開 RLS 的話任何人都能讀寫你的資料，務必確認 step 1 跑完
- 匿名使用者的 refresh token = 你的「恢復碼」，長度約 40 字元，有人拿到就能還原你的全部紀錄，跟密碼一樣要保密
- 免費 tier 會在「7 天完全無活動」後暫停專案，你每週用一次就永不會被暫停；就算真的暫停，Dashboard 點 Restore 就回來，資料不會掉
