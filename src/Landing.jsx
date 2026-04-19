// Landing page — 未登入時顯示的一頁式首頁
// 設計：古典墨寶 × 賽博龐克，跟 app 其他部分視覺一致
// 使用 App.jsx 裡同一個 <style> 區塊定義的 utility classes（f-cyber、cyber-border 等）
import React, { useState } from 'react';
import { signUpWithEmail, signInWithEmail } from './sync.js';

export default function Landing({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!email || !password) { setErr('請輸入 email 和密碼'); return; }
    if (password.length < 6) { setErr('密碼至少 6 字元'); return; }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      setPassword('');
      await onAuthSuccess?.();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const features = [
    { kanji: '今', label: '今日', en: 'SYS.DAILY', desc: '節氣飲食 · 修煉任務 · XP 進度' },
    { kanji: '氣', label: '吐納', en: 'QI.BREATH', desc: '4-4-4-4 方盒呼吸 · 上古煉氣法' },
    { kanji: '覺', label: '心覺', en: 'LOG.INNER', desc: '精神 · 睡眠 · 舌象觀察' },
    { kanji: '昔', label: '往日', en: 'PAST.LOG', desc: '歷史時光足跡 · 趨勢分析' },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden" style={{ background: '#0a0612' }}>
      {/* 背景裝飾 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 255, 212, 0.08), transparent 70%), radial-gradient(ellipse 60% 40% at 90% 80%, rgba(255, 0, 170, 0.08), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 md:px-8 py-10 md:py-16">

        {/* Header — 品牌標記 */}
        <div className="flex items-center justify-between mb-12 md:mb-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 cyber-border-small flex items-center justify-center" style={{
              background: 'rgba(0, 255, 212, 0.1)',
              border: '1px solid rgba(0, 255, 212, 0.4)',
            }}>
              <span className="f-serif-black text-lg" style={{ color: '#00ffd4' }}>道</span>
            </div>
            <div>
              <div className="f-cyber text-[10px] tracking-[0.3em] opacity-60" style={{ color: '#e8dfff' }}>SYS.DAO</div>
              <div className="f-cyber text-[8px] tracking-widest opacity-40" style={{ color: '#e8dfff' }}>v0.1 · PUBLIC BETA</div>
            </div>
          </div>
          <div className="f-cyber text-[9px] tracking-[0.3em] opacity-40 hidden sm:block" style={{ color: '#e8dfff' }}>
            INIT.PHASE.01
          </div>
        </div>

        {/* Hero */}
        <div className="mb-16 md:mb-24 text-center">
          <div className="f-cyber text-[10px] md:text-xs tracking-[0.5em] mb-4 neon-cyan opacity-70">
            ◢ SYSTEM OF THE WAY ◣
          </div>
          <h1 className="f-serif-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-widest mb-4 ink-glow-cyan leading-none">
            系統<span className="inline-block mx-2 opacity-40">·</span>道
          </h1>
          <p className="f-wenkai text-base md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed mt-6" style={{ color: '#e8dfff' }}>
            一日一修 · 節氣為本 · 賽博介面下的古法煉形
          </p>
          <p className="f-cyber text-[11px] md:text-xs tracking-[0.2em] opacity-50 mt-3" style={{ color: '#e8dfff' }}>
            A daoist daily-practice OS · ancient rhythm, cyber interface
          </p>

          {/* CTA scroll hint */}
          <div className="mt-12 f-cyber text-[10px] tracking-[0.3em] opacity-40" style={{ color: '#e8dfff' }}>
            ▼ 登入以進入系統 ▼
          </div>
        </div>

        {/* 功能預覽 — 4 卡片對應 4 tab */}
        <div className="mb-16 md:mb-24">
          <div className="f-cyber text-[10px] tracking-[0.3em] opacity-50 mb-4 text-center" style={{ color: '#e8dfff' }}>
            ◢ MODULES · 內建四式 ◣
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((f, i) => (
              <div key={i} className="cyber-border-small p-4 text-center" style={{
                background: 'rgba(20, 10, 35, 0.5)',
                border: '1px solid rgba(0, 255, 212, 0.2)',
              }}>
                <div className="f-serif-black text-4xl md:text-5xl mb-2" style={{
                  color: '#00ffd4',
                  textShadow: '0 0 10px rgba(0, 255, 212, 0.4)',
                }}>{f.kanji}</div>
                <div className="f-sans-black text-sm md:text-base mb-1" style={{ color: '#e8dfff' }}>{f.label}</div>
                <div className="f-cyber text-[8px] md:text-[9px] tracking-widest opacity-50 mb-2" style={{ color: '#00ffd4' }}>{f.en}</div>
                <div className="f-wenkai text-[10px] md:text-[11px] opacity-60 leading-relaxed" style={{ color: '#e8dfff' }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 登入/註冊表單 */}
        <div id="auth" className="mb-16 md:mb-20">
          <div className="cyber-border p-6 md:p-8" style={{
            background: 'linear-gradient(180deg, rgba(0, 255, 212, 0.04), rgba(255, 0, 170, 0.02))',
            border: '1px solid rgba(0, 255, 212, 0.25)',
            maxWidth: '440px',
            margin: '0 auto',
          }}>
            <div className="text-center mb-5">
              <div className="f-cyber text-[10px] tracking-[0.3em] opacity-60 mb-2" style={{ color: '#00ffd4' }}>
                ◉ ENTRY.POINT
              </div>
              <div className="f-serif-black text-2xl md:text-3xl" style={{ color: '#e8dfff' }}>
                {mode === 'signin' ? '登入系統' : '建立帳號'}
              </div>
              <div className="f-wenkai text-[11px] opacity-50 mt-1" style={{ color: '#e8dfff' }}>
                {mode === 'signin' ? 'Welcome back · 繼續你的修煉' : 'Create account · 跨裝置保存你的紀錄'}
              </div>
            </div>

            {/* Tab 切換 */}
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => { setMode('signin'); setErr(''); }}
                className="flex-1 py-2 text-xs f-cyber cyber-border-small tracking-widest"
                style={{
                  background: mode === 'signin' ? 'rgba(0, 255, 212, 0.15)' : 'rgba(20, 10, 35, 0.5)',
                  border: mode === 'signin' ? '1px solid rgba(0, 255, 212, 0.5)' : '1px solid rgba(0, 255, 212, 0.15)',
                  color: mode === 'signin' ? '#00ffd4' : 'rgba(232, 223, 255, 0.6)',
                }}
              >
                登入 · SIGN IN
              </button>
              <button
                onClick={() => { setMode('signup'); setErr(''); }}
                className="flex-1 py-2 text-xs f-cyber cyber-border-small tracking-widest"
                style={{
                  background: mode === 'signup' ? 'rgba(255, 0, 170, 0.15)' : 'rgba(20, 10, 35, 0.5)',
                  border: mode === 'signup' ? '1px solid rgba(255, 0, 170, 0.5)' : '1px solid rgba(255, 0, 170, 0.15)',
                  color: mode === 'signup' ? '#ff00aa' : 'rgba(232, 223, 255, 0.6)',
                }}
              >
                註冊 · SIGN UP
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="f-cyber text-[9px] tracking-[0.3em] opacity-50 mb-1 block" style={{ color: '#e8dfff' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={busy}
                  className="w-full px-3 py-2.5 text-sm f-cyber cyber-border-small"
                  style={{
                    background: 'rgba(10, 6, 18, 0.7)',
                    border: '1px solid rgba(0, 255, 212, 0.2)',
                    color: '#e8dfff',
                  }}
                />
              </div>
              <div>
                <label className="f-cyber text-[9px] tracking-[0.3em] opacity-50 mb-1 block" style={{ color: '#e8dfff' }}>
                  PASSWORD {mode === 'signup' && <span className="opacity-60">· 至少 6 字元</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !busy) submit(); }}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  disabled={busy}
                  className="w-full px-3 py-2.5 text-sm f-cyber cyber-border-small"
                  style={{
                    background: 'rgba(10, 6, 18, 0.7)',
                    border: '1px solid rgba(0, 255, 212, 0.2)',
                    color: '#e8dfff',
                  }}
                />
              </div>
            </div>

            {err && (
              <div className="mb-3 p-2 cyber-border-small f-cyber text-[10px]" style={{
                background: 'rgba(255, 0, 170, 0.08)',
                border: '1px solid rgba(255, 0, 170, 0.3)',
                color: '#ff00aa',
              }}>
                ⚠ {err}
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy || !email || !password}
              className="w-full py-3 text-sm f-cyber cyber-border-small tracking-widest"
              style={{
                background: mode === 'signin' ? 'linear-gradient(90deg, rgba(0, 255, 212, 0.2), rgba(0, 255, 212, 0.1))' : 'linear-gradient(90deg, rgba(255, 0, 170, 0.2), rgba(255, 0, 170, 0.1))',
                border: mode === 'signin' ? '1px solid rgba(0, 255, 212, 0.5)' : '1px solid rgba(255, 0, 170, 0.5)',
                color: mode === 'signin' ? '#00ffd4' : '#ff00aa',
                opacity: (busy || !email || !password) ? 0.5 : 1,
                cursor: (busy || !email || !password) ? 'not-allowed' : 'pointer',
                textShadow: mode === 'signin' ? '0 0 10px rgba(0, 255, 212, 0.4)' : '0 0 10px rgba(255, 0, 170, 0.4)',
              }}
            >
              {busy ? '⧗ 連線中…' : (mode === 'signin' ? '▶ 登入 · ENTER' : '▶ 建立帳號 · REGISTER')}
            </button>

            <div className="f-wenkai text-[10px] opacity-40 mt-3 text-center" style={{ color: '#e8dfff' }}>
              {mode === 'signup'
                ? '◯ 無需驗證 · 註冊即登入 · 資料加密儲存於雲端'
                : '◯ 密碼忘了？請用另一組信箱重新註冊（目前無自助找回）'}
            </div>
          </div>
        </div>

        {/* Footer — 理念聲明 */}
        <div className="text-center opacity-50 space-y-2">
          <div className="f-wenkai text-[11px] md:text-xs leading-relaxed" style={{ color: '#e8dfff' }}>
            「上古之人，其知道者，法於陰陽，和於術數，食飲有節，起居有常。」
          </div>
          <div className="f-cyber text-[9px] tracking-[0.3em]" style={{ color: '#e8dfff' }}>
            —— 黃帝內經 · 素問 · 上古天真論
          </div>
          <div className="f-cyber text-[9px] tracking-[0.3em] mt-4 opacity-70" style={{ color: '#e8dfff' }}>
            BUILT WITH · REACT · VITE · SUPABASE
          </div>
          <div className="f-cyber text-[8px] tracking-widest opacity-50" style={{ color: '#e8dfff' }}>
            github.com/virus11456/sys.dao
          </div>
        </div>

      </div>
    </div>
  );
}
