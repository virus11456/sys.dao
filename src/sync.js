// -------- sys.dao cloud sync (Supabase email/password) --------
// Email+密碼註冊/登入，key/value 同步。設計目標：未登入一切正常運作
// (純 localStorage)，登入後自動把本機資料 push 上雲，任何裝置登入
// 同一個帳號都可以拉到一樣的資料。
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvbvijdmqpkdbntegmqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YM1iPG3f2IjnmUeoW68o-Q_IvD-3ldR';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
});

// 只同步 cyber3_ 開頭的 key
function isSyncableKey(k) {
  return typeof k === 'string' && k.startsWith('cyber3_');
}

// --- auth ---------------------------------------------------------------
export async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data.session;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.session;
}

export async function signOut() {
  await sb.auth.signOut();
  // 清掉本地的 __sts_ 時戳標記（不清真實資料 — 資料還在 localStorage）
  const stsKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('__sts_')) stsKeys.push(k);
  }
  stsKeys.forEach(k => localStorage.removeItem(k));
}

// --- pull ---------------------------------------------------------------
// 拉雲端所有 row，比 __sts_ 時戳較新才覆寫本地
export async function pullAll() {
  const session = await getSession();
  if (!session) return { pulled: 0, error: null };
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

// --- push all local (migration-style) -----------------------------------
// 登入後把本機所有 cyber3_* 資料一次 push 上雲。
// pullAll 已經先跑過 → 雲端較新的 key 已經覆蓋本地 → 這裡 push 的就是
// 本地獨有 / 本地較新的。Upsert 用 onConflict 確保安全。
export async function pushAllLocal() {
  const session = await getSession();
  if (!session) return { pushed: 0, error: new Error('not signed in') };
  const rows = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!isSyncableKey(k)) continue;
    const value = localStorage.getItem(k);
    if (value == null) continue;
    rows.push({
      user_id: session.user.id,
      key: k,
      value,
      updated_at: new Date().toISOString(),
    });
  }
  if (rows.length === 0) return { pushed: 0, error: null };
  const { error } = await sb.from('kv_sync').upsert(rows, { onConflict: 'user_id,key' });
  if (!error) {
    rows.forEach(r => localStorage.setItem(`__sts_${r.key}`, String(Date.parse(r.updated_at))));
  }
  return { pushed: error ? 0 : rows.length, error };
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
  const session = await getSession();
  if (!session) { pending.clear(); return; } // 未登入就丟棄，避免 queue 無限成長
  isFlushing = true;
  const batch = [...pending.entries()];
  pending.clear();
  try {
    const rows = batch.map(([key, { value, ts }]) => ({
      user_id: session.user.id,
      key,
      value,
      updated_at: new Date(ts).toISOString(),
    }));
    const { error } = await sb.from('kv_sync').upsert(rows, { onConflict: 'user_id,key' });
    if (error) {
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
