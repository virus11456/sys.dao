// Landing page — 賽博修仙版
// 未登入時顯示的一頁式首頁
// 設計：古典修仙 × 賽博龐克，終端機 × 道場
import React, { useState, useEffect } from 'react';
import { signUpWithEmail, signInWithEmail } from './sync.js';

export default function Landing({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const modules = [
    { kanji: '今', label: '今日', en: 'SYS.DAILY',
      desc: '依當日節氣立食、息、動三課 · 勾之即行 · 日累為功' },
    { kanji: '氣', label: '吐納', en: 'QI.BREATH',
      desc: '上古煉氣四相 · 直貫丹田 · 返還先天一氣' },
    { kanji: '覺', label: '心覺', en: 'LOG.INNER',
      desc: '錄渴氣眠三候 · 備舌象 · 以身為鏡' },
    { kanji: '昔', label: '往日', en: 'PAST.LOG',
      desc: '歷日足跡 · 三候趨勢 · 回溯觀照' },
  ];

  const steps = [
    { num: '壹', title: '晨起入系', en: 'BOOT', desc: '檢視當日節氣 · 明食材、避發物、知原則 · 以節氣為律' },
    { num: '貳', title: '吐納煉氣', en: 'BREATHE', desc: '循上古煉氣四相（吸·沉·吐·空）· 直貫丹田 · 引後天氣返先天一氣' },
    { num: '參', title: '勾選行課', en: 'EXECUTE', desc: '依今日三課勾而行之 · 完成即積經驗 · 漸次補養營衛' },
    { num: '肆', title: '夜終心覺', en: 'LOG', desc: '睡前錄渴氣眠三候 · 不強解、不刻意 · 只記觀察' },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden" style={{ background: '#0a0612' }}>
      <style>{`
        /* Hero 用霞鶩文楷（已在 index.html 載入），毛筆字感 + 白字 + cyan 外發光，
           比 Cactus Classical Serif 900 重體更優雅、更配「賽博修仙」這種戲謔題字 */
        .hero-title-font {
          font-family: 'LXGW WenKai', 'Cactus Classical Serif', 'Noto Serif TC', serif;
          font-weight: 400;
          font-feature-settings: 'halt' 1, 'vpal' 1;
        }
        @keyframes hero-glitch {
          0%, 92%, 100% {
            text-shadow:
              0 0 18px rgba(0, 255, 212, 0.5),
              0 0 40px rgba(0, 255, 212, 0.25),
              0 0 80px rgba(255, 0, 170, 0.15);
            transform: translate(0, 0);
          }
          93% { text-shadow: -2px 0 rgba(255, 0, 170, 0.6), 2px 0 rgba(0, 255, 212, 0.6), 0 0 30px rgba(0, 255, 212, 0.3); transform: translate(-1px, 0); }
          94% { text-shadow: 2px 0 rgba(255, 0, 170, 0.6), -2px 0 rgba(0, 255, 212, 0.6), 0 0 30px rgba(0, 255, 212, 0.3); transform: translate(1px, 0); }
        }
        .hero-title { animation: hero-glitch 6s ease-in-out infinite; }

        @keyframes grid-drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        .grid-bg {
          position: absolute; inset: -40px;
          background-image:
            linear-gradient(rgba(0, 255, 212, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 212, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-drift 30s linear infinite;
          pointer-events: none;
          opacity: 0.5;
        }

        @keyframes scanline {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        .scanline {
          position: fixed;
          left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 212, 0.5), transparent);
          box-shadow: 0 0 8px rgba(0, 255, 212, 0.3);
          animation: scanline 10s linear infinite;
          pointer-events: none;
          z-index: 2;
        }

        @keyframes kanji-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .kanji-float { animation: kanji-float 4s ease-in-out infinite; }
        .kanji-float-1 { animation-delay: 0s; }
        .kanji-float-2 { animation-delay: 1s; }
        .kanji-float-3 { animation-delay: 2s; }
        .kanji-float-4 { animation-delay: 3s; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.9s ease-out both; }
        .fade-up-d1 { animation-delay: 0.15s; }
        .fade-up-d2 { animation-delay: 0.35s; }
        .fade-up-d3 { animation-delay: 0.55s; }
        .fade-up-d4 { animation-delay: 0.75s; }
        .fade-up-d5 { animation-delay: 0.95s; }

        @keyframes card-pulse {
          0%, 100% { box-shadow: 0 0 0 rgba(0, 255, 212, 0); border-color: rgba(0, 255, 212, 0.2); }
          50% { box-shadow: 0 0 24px rgba(0, 255, 212, 0.15); border-color: rgba(0, 255, 212, 0.5); }
        }
        .module-card {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .module-card::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(0, 255, 212, 0.15) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        .module-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 255, 212, 0.7) !important;
          box-shadow: 0 8px 32px rgba(0, 255, 212, 0.2);
        }
        .module-card:hover::before { opacity: 1; }
        .module-card:hover .kanji-float { animation-play-state: paused; transform: scale(1.15); }

        @keyframes auth-border-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(0, 255, 212, 0.15), inset 0 0 20px rgba(0, 255, 212, 0.03); }
          50% { box-shadow: 0 0 48px rgba(0, 255, 212, 0.3), inset 0 0 30px rgba(255, 0, 170, 0.05); }
        }
        .auth-card { animation: auth-border-pulse 4s ease-in-out infinite; }

        @keyframes cta-arrow {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(6px); opacity: 0.8; }
        }
        .cta-arrow { animation: cta-arrow 2s ease-in-out infinite; }

        @keyframes particle-drift {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.2; }
          100% { transform: translate(20px, -40px) scale(0.5); opacity: 0; }
        }
        .particle {
          position: absolute;
          width: 3px; height: 3px;
          background: #00ffd4;
          border-radius: 50%;
          pointer-events: none;
          box-shadow: 0 0 6px rgba(0, 255, 212, 0.8);
        }

        @keyframes step-arrow {
          0%, 100% { opacity: 0.3; transform: translateX(0); }
          50% { opacity: 0.7; transform: translateX(4px); }
        }
        .step-arrow { animation: step-arrow 2s ease-in-out infinite; }

        @keyframes blink-caret {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .caret { animation: blink-caret 1s step-end infinite; }
      `}</style>

      {/* 背景：網格漂移 + 漸層光暈 */}
      <div className="grid-bg" />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 255, 212, 0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 10% 70%, rgba(255, 0, 170, 0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 90%, rgba(255, 238, 0, 0.06), transparent 60%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* 掃描線 */}
      <div className="scanline" />
      {/* 粒子 */}
      {mounted && [...Array(8)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${(i * 13) % 100}%`,
          top: `${(i * 19 + 20) % 90}%`,
          animation: `particle-drift ${4 + (i % 3)}s linear infinite`,
          animationDelay: `${i * 0.7}s`,
        }} />
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 md:px-8 py-10 md:py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-16 md:mb-24 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 cyber-border-small flex items-center justify-center" style={{
              background: 'rgba(0, 255, 212, 0.1)',
              border: '1px solid rgba(0, 255, 212, 0.5)',
              boxShadow: '0 0 12px rgba(0, 255, 212, 0.2)',
            }}>
              <span className="f-serif-black text-xl" style={{ color: '#00ffd4' }}>道</span>
            </div>
            <div>
              <div className="f-cyber text-[10px] tracking-[0.3em] opacity-70" style={{ color: '#e8dfff' }}>SYS.DAO</div>
              <div className="f-cyber text-[8px] tracking-widest opacity-40" style={{ color: '#e8dfff' }}>v0.2 · 賽博修仙 BETA</div>
            </div>
          </div>
          <div className="f-cyber text-[9px] tracking-[0.3em] opacity-40 hidden sm:block" style={{ color: '#e8dfff' }}>
            <span className="caret">▋</span> INIT.PHASE.01
          </div>
        </div>

        {/* Hero */}
        <div className="mb-20 md:mb-28 text-center">
          <div className="f-cyber text-[10px] md:text-xs tracking-[0.5em] mb-8 opacity-60 fade-up" style={{ color: '#00ffd4' }}>
            ◢ CYBER × CULTIVATION ◣
          </div>
          <h1
            className="hero-title hero-title-font text-6xl sm:text-7xl md:text-8xl tracking-[0.15em] mb-8 leading-none fade-up fade-up-d1"
            style={{ color: '#f2ecff' }}
          >
            賽博修仙
          </h1>
          {/* 細線分隔 */}
          <div className="fade-up fade-up-d2 flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 md:w-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,212,0.5))' }} />
            <span className="f-cyber text-[9px] tracking-[0.3em] opacity-40" style={{ color: '#00ffd4' }}>◆</span>
            <div className="h-px w-12 md:w-20" style={{ background: 'linear-gradient(90deg, rgba(0,255,212,0.5), transparent)' }} />
          </div>

          <div className="fade-up fade-up-d2">
            <p className="f-wenkai text-2xl md:text-4xl leading-relaxed max-w-2xl mx-auto" style={{ color: '#e8dfff' }}>
              返還先天一氣
            </p>
            <p className="f-wenkai text-sm md:text-base opacity-60 mt-3 leading-relaxed" style={{ color: '#e8dfff' }}>
              呼吸精氣 <span className="opacity-40 mx-1">·</span>
              調和營衛 <span className="opacity-40 mx-1">·</span>
              獨立守神
            </p>
            <p className="f-cyber text-[10px] md:text-xs tracking-[0.2em] opacity-40 mt-4" style={{ color: '#e8dfff' }}>
              return to pre-heaven primordial qi · balance ying & wei
            </p>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 fade-up fade-up-d4">
            <div className="f-cyber text-[10px] tracking-[0.3em] opacity-40 mb-1" style={{ color: '#e8dfff' }}>
              ENTER THE SYSTEM
            </div>
            <div className="cta-arrow text-lg opacity-60" style={{ color: '#00ffd4' }}>▼</div>
          </div>
        </div>

        {/* What is this? — 上古煉氣 × 先天一氣 × 營衛 */}
        <div className="mb-20 md:mb-28 fade-up">
          <div className="f-cyber text-[10px] tracking-[0.3em] opacity-50 mb-8 text-center" style={{ color: '#e8dfff' }}>
            ◢ WHAT IS THIS ◣
          </div>
          <div className="max-w-2xl mx-auto space-y-7">
            <p className="f-wenkai text-base md:text-lg leading-loose text-center" style={{ color: '#e8dfff' }}>
              sys.dao 以「上古煉氣之法」為本——後天呼吸浮於胸膈，煉氣則直貫丹田，<span style={{ color: '#00ffd4' }}>返還先天一氣</span>。
            </p>
            <p className="f-wenkai text-base md:text-lg leading-loose text-center opacity-85" style={{ color: '#e8dfff' }}>
              一氣既充，<span style={{ color: '#00ffd4' }}>營氣</span>循脈以濡養五臟，<span style={{ color: '#00ffd4' }}>衛氣</span>充表以抵百病。神自凝、心自喜、百脈自調。
            </p>
            <p className="f-wenkai text-base md:text-lg leading-loose text-center opacity-75" style={{ color: '#e8dfff' }}>
              節氣為律 · 吐納為本 · 心覺為鏡。不精研陰陽，讓身體做主；依法而行，自有所感。
            </p>

            {/* 典籍引文 */}
            <div className="pt-4 fade-up fade-up-d1">
              <div className="cyber-border-small p-4 md:p-5 text-center" style={{
                background: 'rgba(20, 10, 35, 0.5)',
                border: '1px solid rgba(0, 255, 212, 0.18)',
                borderLeft: '2px solid rgba(0, 255, 212, 0.45)',
              }}>
                <div className="f-cyber text-[9px] tracking-[0.3em] opacity-50 mb-3" style={{ color: '#00ffd4' }}>◆ 典出 · CANON</div>
                <div className="f-wenkai text-sm md:text-base leading-loose" style={{ color: '#e8dfff' }}>
                  「呼吸精氣，獨立守神，肌肉若一，故能壽敝天地。」
                </div>
                <div className="f-cyber text-[9px] tracking-[0.3em] opacity-40 mt-3" style={{ color: '#e8dfff' }}>
                  ——《黃帝內經 · 素問 · 上古天真論》
                </div>
              </div>
            </div>

            {/* 三氣結構 spec chips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 fade-up fade-up-d2">
              {[
                { tag: '先天一氣', en: 'PRIMORDIAL', desc: '煉氣直貫丹田 · 返還本源' },
                { tag: '營氣', en: 'YING · NUTRITIVE', desc: '行脈中 · 濡養五臟六腑' },
                { tag: '衛氣', en: 'WEI · DEFENSIVE', desc: '充肌表 · 百病不侵' },
              ].map((s, i) => (
                <div key={i} className="cyber-border-small p-3" style={{
                  background: 'rgba(20, 10, 35, 0.5)',
                  border: '1px solid rgba(0, 255, 212, 0.15)',
                }}>
                  <div className="f-cyber text-[8px] tracking-[0.25em] opacity-50 mb-1" style={{ color: '#00ffd4' }}>{s.en}</div>
                  <div className="f-serif-black text-base mb-1.5" style={{ color: '#f2ecff' }}>{s.tag}</div>
                  <div className="f-wenkai text-[11px] leading-relaxed opacity-70" style={{ color: '#e8dfff' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modules — 4 功能 */}
        <div className="mb-24 md:mb-32 fade-up">
          <div className="f-cyber text-[10px] tracking-[0.3em] opacity-50 mb-6 text-center" style={{ color: '#e8dfff' }}>
            ◢ MODULES · 內建四式 ◣
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modules.map((f, i) => (
              <div key={i} className={`module-card cyber-border-small p-5 text-center fade-up fade-up-d${i+1}`} style={{
                background: 'rgba(20, 10, 35, 0.6)',
                border: '1px solid rgba(0, 255, 212, 0.2)',
              }}>
                <div className={`kanji-float kanji-float-${i+1} hero-title-font text-5xl md:text-6xl mb-3 relative z-10`} style={{
                  color: '#f2ecff',
                  textShadow: '0 0 14px rgba(0, 255, 212, 0.35), 0 0 28px rgba(0, 255, 212, 0.15)',
                }}>{f.kanji}</div>
                <div className="f-sans-black text-base md:text-lg mb-1 relative z-10" style={{ color: '#e8dfff' }}>{f.label}</div>
                <div className="f-cyber text-[8px] md:text-[9px] tracking-widest opacity-60 mb-3 relative z-10" style={{ color: '#00ffd4' }}>{f.en}</div>
                <div className="f-wenkai text-[11px] md:text-xs opacity-70 leading-relaxed relative z-10" style={{ color: '#e8dfff' }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works — 一日修煉流程 */}
        <div className="mb-24 md:mb-32 fade-up">
          <div className="f-cyber text-[10px] tracking-[0.3em] opacity-50 mb-6 text-center" style={{ color: '#e8dfff' }}>
            ◢ A DAY IN THE SYSTEM · 一日修煉流程 ◣
          </div>
          <div className="space-y-4 max-w-3xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-start gap-4 cyber-border-small p-4 fade-up fade-up-d${i+1}`} style={{
                background: 'rgba(20, 10, 35, 0.5)',
                border: '1px solid rgba(0, 255, 212, 0.15)',
              }}>
                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center cyber-border-small" style={{
                  background: 'rgba(0, 255, 212, 0.06)',
                  border: '1px solid rgba(0, 255, 212, 0.3)',
                }}>
                  <span className="hero-title-font text-2xl" style={{ color: '#f2ecff', textShadow: '0 0 10px rgba(0, 255, 212, 0.35)' }}>{s.num}</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <div className="f-sans-black text-base" style={{ color: '#e8dfff' }}>{s.title}</div>
                    <div className="f-cyber text-[9px] tracking-[0.3em] opacity-50" style={{ color: '#00ffd4' }}>{s.en}</div>
                  </div>
                  <div className="f-wenkai text-[12px] md:text-sm opacity-70 leading-relaxed" style={{ color: '#e8dfff' }}>
                    {s.desc}
                  </div>
                </div>
                <div className="step-arrow f-cyber text-sm self-center" style={{ color: '#00ffd4' }}>▸</div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth form */}
        <div id="auth" className="mb-20 md:mb-24 fade-up">
          <div className="auth-card cyber-border p-6 md:p-8" style={{
            background: 'linear-gradient(180deg, rgba(0, 255, 212, 0.05), rgba(255, 0, 170, 0.02))',
            border: '1px solid rgba(0, 255, 212, 0.3)',
            maxWidth: '440px',
            margin: '0 auto',
          }}>
            <div className="text-center mb-5">
              <div className="f-cyber text-[10px] tracking-[0.3em] opacity-70 mb-2" style={{ color: '#00ffd4' }}>
                ◉ ENTRY.POINT
              </div>
              <div className="f-serif-black text-2xl md:text-3xl" style={{ color: '#e8dfff' }}>
                {mode === 'signin' ? '入門登入' : '結緣註冊'}
              </div>
              <div className="f-wenkai text-[11px] opacity-60 mt-1" style={{ color: '#e8dfff' }}>
                {mode === 'signin' ? 'Welcome back · 繼續你的修煉' : 'Create account · 開啟第一日修煉'}
              </div>
            </div>

            <div className="flex gap-1 mb-4">
              <button
                onClick={() => { setMode('signin'); setErr(''); }}
                className="flex-1 py-2 text-xs f-cyber cyber-border-small tracking-widest transition-all"
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
                className="flex-1 py-2 text-xs f-cyber cyber-border-small tracking-widest transition-all"
                style={{
                  background: mode === 'signup' ? 'rgba(255, 0, 170, 0.15)' : 'rgba(20, 10, 35, 0.5)',
                  border: mode === 'signup' ? '1px solid rgba(255, 0, 170, 0.5)' : '1px solid rgba(255, 0, 170, 0.15)',
                  color: mode === 'signup' ? '#ff00aa' : 'rgba(232, 223, 255, 0.6)',
                }}
              >
                註冊 · SIGN UP
              </button>
            </div>

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
              className="w-full py-3 text-sm f-cyber cyber-border-small tracking-widest transition-all"
              style={{
                background: mode === 'signin' ? 'linear-gradient(90deg, rgba(0, 255, 212, 0.25), rgba(0, 255, 212, 0.1))' : 'linear-gradient(90deg, rgba(255, 0, 170, 0.25), rgba(255, 0, 170, 0.1))',
                border: mode === 'signin' ? '1px solid rgba(0, 255, 212, 0.6)' : '1px solid rgba(255, 0, 170, 0.6)',
                color: mode === 'signin' ? '#00ffd4' : '#ff00aa',
                opacity: (busy || !email || !password) ? 0.4 : 1,
                cursor: (busy || !email || !password) ? 'not-allowed' : 'pointer',
                textShadow: mode === 'signin' ? '0 0 12px rgba(0, 255, 212, 0.5)' : '0 0 12px rgba(255, 0, 170, 0.5)',
              }}
            >
              {busy ? '⧗ 連線中…' : (mode === 'signin' ? '▶ 入山 · ENTER' : '▶ 開始修煉 · BEGIN')}
            </button>

            <div className="f-wenkai text-[10px] opacity-40 mt-3 text-center leading-relaxed" style={{ color: '#e8dfff' }}>
              {mode === 'signup'
                ? '◯ 無需驗證 · 註冊即登入 · 資料加密儲存於 Supabase'
                : '◯ 密碼遺忘請以他信箱重新註冊（目前無自助找回）'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center opacity-50 space-y-2 pb-8 fade-up">
          <div className="f-wenkai text-[11px] md:text-xs leading-relaxed" style={{ color: '#e8dfff' }}>
            「上古之人，其知道者，法於陰陽，和於術數，食飲有節，起居有常。」
          </div>
          <div className="f-cyber text-[9px] tracking-[0.3em]" style={{ color: '#e8dfff' }}>
            —— 黃帝內經 · 素問 · 上古天真論
          </div>
          <div className="f-cyber text-[9px] tracking-[0.3em] mt-6 opacity-70" style={{ color: '#e8dfff' }}>
            BUILT WITH · REACT · VITE · SUPABASE · TAILWIND
          </div>
          <div className="f-cyber text-[8px] tracking-widest opacity-50" style={{ color: '#e8dfff' }}>
            github.com/virus11456/sys.dao · v0.2 · 賽博修仙
          </div>
        </div>

      </div>
    </div>
  );
}
