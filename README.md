<div align="center">

```
╔══════════════════════════════════════════╗
║                                          ║
║            S Y S . D A O                 ║
║                                          ║
║     賽博龐克 · 道家修煉 · 養陰追蹤系統         ║
║                                          ║
╚══════════════════════════════════════════╝
```

**sys.dao · 道家賽博養生追蹤系統**

古老的修真智慧，透過賽博龐克介面重新演繹。

*An ancient Daoist cultivation tracker, reimagined through a cyberpunk lens.*

[功能介紹](#-功能介紹) · [快速開始](#-快速開始) · [設計理念](#-設計理念) · [技術架構](#-技術架構) · [貢獻](#-貢獻指南)

</div>

---

## 📖 關於這個專案

**sys.dao** 是一個將中醫養生理論、道家吐納修煉、節氣養生融合到現代生活的互動式追蹤應用。它不只是一個 to-do list，而是一個「修真系統」——把每日的喝溫水、晨練、午睡、早睡都設計成遊戲化的修煉任務，讓養生變得有趣。

視覺上採用賽博龐克 × 道家美學：霓虹漸層、全息符籙、八卦旋轉、故障文字，配合墨黑底色和宋體黑字，創造出「地下修真者用 AR 終端機運氣」的氛圍。

> 「修行之道，寧簡而正，勿繁而亂。」

---

## ✨ 功能介紹

### 🌅 今日修煉（SYS）

- **二十四節氣自動追蹤**：系統自動判斷當前節氣，顯示養生重點與食材建議
- **七日輪替菜單**：早午晚三餐依節氣 × 星期動態變化（5 季 × 7 天 = 35 套菜單）
- **15 項每日任務**：從起床吞津到子時入眠，完整一日修煉行程
- **三元平衡環**：Apple Health 風格的陰陽津液三色環
- **七日柱狀圖**：追蹤近一週完成率變化
- **即時當下**：自動高亮當前時段該做的事

### 🌬️ 素門吐納（QI）

- **視覺化呼吸引導**：吸・沉・吐・空四相循環動畫
- **八卦旋轉背景**：配合呼吸節奏的神秘氛圍
- **息數計數**：累積呼吸循環數，作為修煉進度指標
- **上古傳承說明**：素門吐納法 vs 小周天功對比
- **修煉效驗階段**：初階排毒 → 中階津液 → 進階丹田溫 → 大成百病不生

### 💭 心覺記錄（LOG）

- **三大指標追蹤**：半夜口乾、白天精神、睡眠品質
- **舌象備註**：每日自由記錄
- **三月觀照提醒**：鼓勵長期調理

### 🎮 遊戲化系統

- **修真九境**：煉體 → 鍛骨 → 築基 → 金丹 → 元嬰 → 化神 → 合體 → 渡劫 → 大乘
- **修為值（QI）**：完成任務獲取經驗，指數曲線升級
- **連續天數（CHAIN）**：Duolingo 風格 streak 追蹤
- **成就系統**：18+ 個修真里程碑（初窺門徑、百日結丹、千息歸元…）

---

## 🎨 設計理念

### 視覺美學

```
配色  墨黑底 × 霓虹青 × 賽博粉 × 警示黃 × 神秘紫
字體  Noto Serif TC 900（大漢字）+ 霞鶩文楷（內文）+ Orbitron（英文）
效果  掃描線 + 故障位移 + 墨光發光 + 切角邊框
```

### 文化融合

- 借鑑 **Apple Health** 的三色環概念，改為陰陽津液
- 採用 **Duolingo** 的連擊機制，改為修真連日
- 遊戲化的等級系統對應 **道家九境**
- 成就徽章改為 **修煉里程碑**

### 中醫原則

此系統圍繞**陰虛體質調理**設計，融合：

- 《黃帝內經》子午流注時辰學說
- 二十四節氣養生原則
- 素門吐納法傳承
- 養陰生津飲食原則

---

## 🚀 快速開始

### 環境需求

- Node.js 18+
- npm 9+

### 安裝與啟動

```bash
# 複製專案
git clone https://github.com/virus11456/sys.dao.git
cd sys.dao

# 安裝依賴
npm install

# 本地開發（熱重載）
npm run dev

# 生產版建置
npm run build

# 預覽生產版
npm run preview
```

### 部署到 Vercel

此 repo 已設定為 Vercel 可直接匯入的 Vite 專案。只要：

1. 到 [vercel.com/new](https://vercel.com/new) 匯入 `virus11456/sys.dao`
2. Framework preset 會自動偵測為 **Vite**（Build: `npm run build`, Output: `dist`）
3. 點 **Deploy**

之後每次 `git push origin main` 都會自動觸發 Vercel 重新部署。

---

## 📱 響應式設計

| 裝置   | 斷點          | 佈局                       |
| ------ | ------------- | -------------------------- |
| 手機   | < 640px       | 單欄堆疊                   |
| 平板   | 640 – 1024px  | 置中容器，放大元件         |
| 桌面   | ≥ 1024px      | 雙欄儀表板（左資訊／右任務）|
| 大螢幕 | ≥ 1280px      | `max-w-7xl` 置中           |

計時器與成就通知會自動從手機的全寬貼底，轉為桌面的右下角浮動卡片。

---

## 🔧 技術架構

### 核心技術

- **Vite 5** — 極速建置與熱重載
- **React 18** — Hooks 驅動的單元件架構
- **Tailwind CSS 3** — 響應式樣式系統
- **localStorage** — 本地資料持久化（詳見 `src/App.jsx` 的 shim）

### 資料結構

```javascript
// 每日狀態
{
  completed: {        // 完成狀態
    wake: true,
    morning: false,
    // ...
  },
  todayLog: {         // 心覺記錄
    drymouth: 2,
    energy: 3,
    sleep: 1,
    notes: "..."
  }
}

// 玩家統計
{
  totalXP: 1250,              // 累積修為
  level: 8,                   // 當前段位
  streak: 14,                 // 連續天數
  totalPracticeMinutes: 360,  // 累積練功分鐘
  totalBreathCycles: 520,     // 累積呼吸循環
  perfectDays: 3,             // 圓滿之日次數
  weeklyHistory: [...]        // 七日完成率
}
```

### 節氣判斷邏輯

```javascript
const solarTerms = [
  { name: '立春', start: [2, 4],  season: 'spring', /* ... */ },
  { name: '雨水', start: [2, 19], season: 'spring', /* ... */ },
  // ... 24 個節氣
];

const currentTerm = solarTerms.find(term => currentDate >= term.start);
```

### 七日菜單矩陣

```
        週日  週一  週二  週三  週四  週五  週六
春季    溫補  潤肺  養肝  健脾  養心   固腎  清腸
夏季    清養  潤肺  養肝  健脾  養心★ 固腎  清暑
長夏    健脾  潤肺  養肝  健脾★ 養心   固腎  化濕
秋季    溫潤  潤肺★ 養肝  健脾  養心   固腎  潤燥
冬季    溫補  潤肺  養肝  健脾  養心   固腎★ 平補
```

---

## 📂 專案結構

```
sys.dao/
├── index.html              # Vite 入口 HTML
├── package.json
├── vite.config.js          # Vite + React plugin
├── tailwind.config.js      # Tailwind content 路徑
├── postcss.config.js
└── src/
    ├── main.jsx            # React 掛載點
    ├── index.css           # Tailwind base/components/utilities
    └── App.jsx             # 主元件（所有邏輯與 UI）
```

`src/App.jsx` 頂部有個 `window.storage` → `localStorage` 相容層，是為了讓原本寫給 Claude Artifact 的程式碼在瀏覽器中直接可跑。未來若要加雲端同步，替換這層 shim 即可（Supabase、Vercel KV、Firebase 等）。

---

## 🌸 節氣與養生對照

| 季節          | 節氣          | 養生重點 | 主要食材                  |
| ------------- | ------------- | -------- | ------------------------- |
| 🌱 春         | 立春 → 穀雨   | 養肝防風 | 春筍、菠菜、枸杞          |
| ☀️ 夏         | 立夏 → 大暑   | 養心防暑 | 蓮子、綠豆、鴨肉          |
| 🌾 長夏       | 小暑 → 立秋   | 健脾化濕 | 薏仁、赤小豆、冬瓜        |
| 🍂 秋 **★**   | 立秋 → 霜降   | 潤肺防燥 | 梨、銀耳、百合            |
| ❄️ 冬         | 立冬 → 大寒   | 養腎藏精 | 黑芝麻、核桃、枸杞        |

**★ = 陰虛體質關鍵季節**

---

## 🧘 使用建議

### 循序漸進三階段

**第一週 · 築基**

- 只做三件事：起床吞津、亥時前眠、戒咖啡冰水

**第二週 · 入門**

- 加入晨間練功（八段錦 + 素門吐納 + 站樁）
- 開始記錄每日心覺

**一個月後 · 進階**

- 完整執行 15 項每日修煉
- 嘗試一個月不中斷 streak

### 陰虛者注意事項

- ⚠️ 素門吐納**絕對不憋氣到極限**
- ⚠️ 月經、感冒、疲勞時暫停練功
- ⚠️ 心煩、口更乾立刻停止
- ⚠️ 嚴重心腦血管疾病患者禁止練習

---

## 🙏 致謝

- 《黃帝內經》— 中醫理論基石
- 素門吐納法 — 上古修秘傳承氣法
- 道家內丹術 — 小周天功法體系
- Apple Health — 三色環進度設計靈感
- Duolingo — 連擊機制設計靈感
- Cyberpunk 2077 — 賽博龐克視覺語彙

---

## 📄 免責聲明

本應用僅為**養生輔助工具**，不能取代專業中醫師診斷與治療。

如有持續性健康問題（半夜口乾超過一個月、明顯體重變化、夜間盜汗等），建議尋求合格中醫師把脈辨證。

素門吐納法非正統道家內丹術，屬現代整理的呼吸法，練習風險自負。深度內丹修煉（小周天、大周天）務必尋找明師指導，切勿自學冒進。

---

## 🤝 貢獻指南

歡迎提交 Issue 與 Pull Request！特別歡迎：

- 🐛 Bug 修復
- 🎨 視覺優化
- 📖 中醫典籍內容補充
- 🌐 多語言翻譯（英文、日文、韓文）
- ♿ 無障礙性改善
- 📱 RWD 細節調整

### 貢獻流程

```bash
# Fork → Clone → Branch
git checkout -b feature/your-feature

# Commit
git commit -m "feat: 加入 XX 功能"

# Push → Pull Request
git push origin feature/your-feature
```

---

## 📜 授權

**MIT License** · 自由使用、修改、分發

```
Copyright (c) 2026 sys.dao

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

<div align="center">

```
  ◯ 緩而不殆，確而行之 ◯
```

**若此專案對你有幫助，請給個 ⭐ Star 支持！**

[⬆ 回到頂部](#)

</div>
