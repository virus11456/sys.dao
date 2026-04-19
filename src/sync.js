// -------- sys.dao cloud sync (Supabase) --------
// 匿名登入 + key/value 同步 + 恢復碼。設計目標：無感、可離線、切裝置用恢復碼
// 回來。所有 API 都是非阻塞的（同步失敗不會擋住 UI）。
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvbvijdmqpkdbntegmqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YM1iPG3f2IjnmUeoW68o-Q_IvD-3ldR';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
});

// 只同步 cyber3_ 開頭的 key（app 的資料），避免把 supabase 自己的 token 也推上去
function isSyncableKey(k) {
  return typeof k === 'string' && k.startsWith('cyber3_');
}

// --- auth ---------------------------------------------------------------
export async function ensureAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) return session;
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function getUserId() {
  const { data: { session } } = await sb.auth.getSession();
  return session?.user?.id || null;
}

// --- pull ---------------------------------------------------------------
// 把雲端所有 row 拉下來，逐筆跟本地比對：雲端時戳較新才覆寫本地。
// __sts_<key> 記錄本地該 key 最後一次已同步的時戳。
export async function pullAll() {
  const { data, error } = await sb.from('kv_sync').select('key, value, updated_at');
  if (error || !data) return { pulled: 0, error };
  let pulled = 0;
  for (const row of data) {
    const cloudTs = Date.parse(row.updated_at);
    const localTs = Number(localStorage.getItem(`__sts_${row.key}`) || 0);
    if (cloudTs > localTs) {
      localStorage.setItem(row.key, row.value);
      localStorage.setItem(`__sts_${row.key}`, String(cloudTs));
      pulled++;
    }
  }
  return { pulled, error: null };
}

// --- push (debounced batch upsert) --------------------------------------
const pending = new Map();
let pushTimer = null;
let isFlushing = false;

export function queuePush(key, value) {
  if (!isSyncableKey(key)) return;
  pending.set(key, { value, ts: Date.now() });
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(flush, 800);
}

async function flush() {
  if (isFlushing || pending.size === 0) return;
  isFlushing = true;
  const batch = [...pending.entries()];
  pending.clear();
  try {
    const session = await ensureAuth();
    if (!session) { batch.forEach(([k, v]) => pending.set(k, v)); return; }
    const rows = batch.map(([key, { value, ts }]) => ({
      user_id: session.user.id,
      key,
      value,
      updated_at: new Date(ts).toISOString(),
    }));
    const { error } = await sb.from('kv_sync').upsert(rows, { onConflict: 'user_id,key' });
    if (error) {
      // 失敗就重新排隊（不覆蓋更新的 in-flight 寫入）
      for (const [k, v] of batch) if (!pending.has(k)) pending.set(k, v);
      console.warn('[sync] push failed:', error.message);
    } else {
      for (const [k, { ts }] of batch) localStorage.setItem(`__sts_${k}`, String(ts));
    }
  } catch (e) {
    for (const [k, v] of batch) if (!pending.has(k)) pending.set(k, v);
    console.warn('[sync] push threw:', e);
  } finally {
    isFlushing = false;
    if (pending.size > 0) {
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(flush, 1500);
    }
  }
}

// --- recovery code (= refresh token) -----------------------------------
// 簡化設計：恢復碼就是 Supabase 的 refresh token。長但能直接 setSession 回來。
export async function getRecoveryCode() {
  const { data: { session } } = await sb.auth.getSession();
  return session?.refresh_token || null;
}

export async function restoreFromCode(code) {
  const trimmed = (code || '').trim();
  if (!trimmed) throw new Error('請輸入恢復碼');
  const { data, error } = await sb.auth.refreshSession({ refresh_token: trimmed });
  if (error) throw new Error(error.message || '恢復碼無效');
  // 清掉本地的 __sts_ 時戳標記，讓下一次 pullAll 一定會從雲端覆寫回來
  const stsKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('__sts_')) stsKeys.push(k);
  }
  stsKeys.forEach(k => localStorage.removeItem(k));
  return data.session;
}

// --- 登出（保留資料在雲端，只斷本機連線） --------------------------------
export async function signOutLocal() {
  await sb.auth.signOut();
  const stsKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('__sts_')) stsKeys.push(k);
  }
  stsKeys.forEach(k => localStorage.removeItem(k));
}
