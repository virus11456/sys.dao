import React, { useState, useEffect, useRef } from 'react';

// -------- window.storage -> localStorage shim --------
// The original app was written against a Claude artifact window.storage API.
// This shim implements the same async {get(key) -> {value}}/{set(key, value)}
// contract on top of the browser's localStorage so all original call sites
// keep working unchanged.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      try {
        const v = window.localStorage.getItem(key);
        return v == null ? null : { value: v };
      } catch (e) { return null; }
    },
    async set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) {}
    },
    async delete(key) {
      try { window.localStorage.removeItem(key); } catch (e) {}
    },
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completed, setCompleted] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerLabel, setTimerLabel] = useState('');
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [showBreath, setShowBreath] = useState(false);
  const [todayLog, setTodayLog] = useState({ drymouth: null, energy: null, sleep: null, notes: '' });
  const [glitchText, setGlitchText] = useState('');
  
  const [stats, setStats] = useState({
    totalXP: 0, level: 1, streak: 0, lastActiveDate: null,
    totalDaysActive: 0, totalPracticeMinutes: 0, totalBreathCycles: 0,
    totalCompleted: 0, perfectDays: 0, earlyBirdDays: 0,
    nightOwlDefeatedDays: 0, weeklyHistory: [],
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState({});
  const [showAchievement, setShowAchievement] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const intervalRef = useRef(null);
  const prevCompletedRef = useRef({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date().toDateString();
        const sc = await window.storage?.get(`cyber3_completed_${today}`);
        if (sc) setCompleted(JSON.parse(sc.value));
        const sl = await window.storage?.get(`cyber3_log_${today}`);
        if (sl) setTodayLog(JSON.parse(sl.value));
        const ss = await window.storage?.get('cyber3_stats');
        if (ss) setStats(JSON.parse(ss.value));
        const sa = await window.storage?.get('cyber3_achievements');
        if (sa) setUnlockedAchievements(JSON.parse(sa.value));
      } catch (e) {}
    };
    loadData();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        const today = new Date().toDateString();
        await window.storage?.set(`cyber3_completed_${today}`, JSON.stringify(completed));
      } catch (e) {}
    };
    if (Object.keys(completed).length > 0) save();
  }, [completed]);

  useEffect(() => {
    const save = async () => {
      try {
        const today = new Date().toDateString();
        await window.storage?.set(`cyber3_log_${today}`, JSON.stringify(todayLog));
      } catch (e) {}
    };
    save();
  }, [todayLog]);

  useEffect(() => {
    const save = async () => {
      try { await window.storage?.set('cyber3_stats', JSON.stringify(stats)); } catch (e) {}
    };
    save();
  }, [stats]);

  useEffect(() => {
    const save = async () => {
      try { await window.storage?.set('cyber3_achievements', JSON.stringify(unlockedAchievements)); } catch (e) {}
    };
    save();
  }, [unlockedAchievements]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerActive(false);
            addXP(Math.floor(timerDuration / 60) * 5, timerLabel);
            setStats(p => ({ ...p, totalPracticeMinutes: p.totalPracticeMinutes + Math.floor(timerDuration / 60) }));
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive, timerSeconds]);

  useEffect(() => {
    if (showBreath) {
      const cycle = setInterval(() => {
        setBreathPhase(p => {
          if (p === 'inhale') return 'hold1';
          if (p === 'hold1') return 'exhale';
          if (p === 'exhale') {
            setBreathCount(c => c + 1);
            setStats(prev => ({ ...prev, totalBreathCycles: prev.totalBreathCycles + 1 }));
            return 'hold2';
          }
          return 'inhale';
        });
      }, 4000);
      return () => clearInterval(cycle);
    }
  }, [showBreath]);

  useEffect(() => {
    const chars = '道氣陰陽坎離震巽乾兌艮坤太極無極玄靈炁神精修真01';
    const interval = setInterval(() => {
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      setGlitchText(result);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // ===== 二十四節氣系統 =====
  const solarTerms = [
    { name: '立春', en: 'SPRING.BEGIN', start: [2, 4], season: 'spring', element: '木', color: '#7cc66e',
      focus: '養肝防風', principle: '減酸增甘、清淡柔肝',
      foods: '春筍、薺菜、菠菜、枸杞、紅棗、百合',
      avoid: '過酸傷脾、過補陽升太過' },
    { name: '雨水', en: 'RAIN.WATER', start: [2, 19], season: 'spring', element: '木', color: '#7cc66e',
      focus: '疏肝健脾', principle: '平補柔肝、健脾祛濕',
      foods: '山藥、蓮子、薏仁、韭菜、芹菜', avoid: '生冷油膩' },
    { name: '驚蟄', en: 'AWAKE.INSECT', start: [3, 5], season: 'spring', element: '木', color: '#7cc66e',
      focus: '疏肝理氣', principle: '清肝降火、滋陰潤燥',
      foods: '梨、蜂蜜、菊花、枸杞、百合', avoid: '辛辣刺激' },
    { name: '春分', en: 'SPRING.EQUI', start: [3, 20], season: 'spring', element: '木', color: '#7cc66e',
      focus: '陰陽平衡', principle: '寒熱平衡、調和陰陽',
      foods: '春筍、菠菜、韭菜、豆芽', avoid: '溫補過度' },
    { name: '清明', en: 'PURE.BRIGHT', start: [4, 4], season: 'spring', element: '木', color: '#7cc66e',
      focus: '養肝護陽', principle: '清補養肝、疏肝解鬱',
      foods: '薺菜、馬蘭頭、香椿、枸杞', avoid: '發物羊肉' },
    { name: '穀雨', en: 'GRAIN.RAIN', start: [4, 20], season: 'spring', element: '木', color: '#7cc66e',
      focus: '健脾祛濕', principle: '平補脾肺、祛濕解毒',
      foods: '山藥、薏仁、紅豆、玉米', avoid: '過於滋膩' },
    { name: '立夏', en: 'SUMMER.BEGIN', start: [5, 5], season: 'summer', element: '火', color: '#ff6b6b',
      focus: '養心防暑', principle: '增苦減辛、清心生津',
      foods: '蓮子、苦瓜、綠豆、鴨肉、蓮藕', avoid: '溫補燒烤' },
    { name: '小滿', en: 'GRAIN.FULL', start: [5, 21], season: 'summer', element: '火', color: '#ff6b6b',
      focus: '清熱利濕', principle: '清熱除濕、健脾和胃',
      foods: '冬瓜、絲瓜、苦瓜、綠豆、薏仁', avoid: '甘肥厚膩' },
    { name: '芒種', en: 'GRAIN.EAR', start: [6, 5], season: 'summer', element: '火', color: '#ff6b6b',
      focus: '養心安神', principle: '清補養心、生津止渴',
      foods: '蓮子、百合、銀耳、西瓜、蓮藕', avoid: '大熱大補' },
    { name: '夏至', en: 'SUMMER.SOLS', start: [6, 21], season: 'summer', element: '火', color: '#ff6b6b',
      focus: '★ 護陰生津', principle: '陽極轉陰・最傷陰日',
      foods: '生脈飲、烏梅、蓮子、鴨肉、西洋參', avoid: '激烈運動、大汗' },
    { name: '小暑', en: 'MINOR.HEAT', start: [7, 7], season: 'longsummer', element: '土', color: '#d4a017',
      focus: '健脾化濕', principle: '清淡健脾、芳香化濕',
      foods: '薏仁、赤小豆、冬瓜、絲瓜、蓮藕', avoid: '甜膩生冷' },
    { name: '大暑', en: 'MAJOR.HEAT', start: [7, 22], season: 'longsummer', element: '土', color: '#d4a017',
      focus: '清暑益氣', principle: '清心消暑、益氣生津',
      foods: '綠豆、薏仁、苦瓜、冬瓜、西瓜', avoid: '辛辣燥熱' },
    { name: '立秋', en: 'AUTUMN.BEGIN', start: [8, 7], season: 'autumn', element: '金', color: '#e0c080',
      focus: '潤肺防燥', principle: '減辛增酸、滋陰潤燥',
      foods: '梨、銀耳、百合、蜂蜜、蓮藕', avoid: '辛辣燒烤' },
    { name: '處暑', en: 'END.HEAT', start: [8, 23], season: 'autumn', element: '金', color: '#e0c080',
      focus: '養陰潤燥', principle: '滋陰潤肺、清熱生津',
      foods: '梨、百合、銀耳、杏仁、蓮藕', avoid: '油膩辛辣' },
    { name: '白露', en: 'WHITE.DEW', start: [9, 8], season: 'autumn', element: '金', color: '#e0c080',
      focus: '潤燥養肺', principle: '滋陰潤肺、補氣健脾',
      foods: '梨、蜂蜜、白木耳、芝麻、杏仁', avoid: '生冷瓜果過量' },
    { name: '秋分', en: 'AUTUMN.EQUI', start: [9, 23], season: 'autumn', element: '金', color: '#e0c080',
      focus: '★ 陰虛關鍵日', principle: '燥氣最盛・重點滋陰',
      foods: '沙參、麥冬、玉竹、梨、銀耳', avoid: '辛散耗氣' },
    { name: '寒露', en: 'COLD.DEW', start: [10, 8], season: 'autumn', element: '金', color: '#e0c080',
      focus: '養陰防燥', principle: '滋陰潤燥、養胃生津',
      foods: '芝麻、核桃、蜂蜜、山藥、銀耳', avoid: '辛辣寒涼' },
    { name: '霜降', en: 'FROST.DES', start: [10, 23], season: 'autumn', element: '金', color: '#e0c080',
      focus: '平補潤燥', principle: '平補養陰、健脾潤肺',
      foods: '山藥、芝麻、核桃、紅棗、栗子', avoid: '大辛大熱' },
    { name: '立冬', en: 'WINTER.BEGIN', start: [11, 7], season: 'winter', element: '水', color: '#6b7fc4',
      focus: '溫補腎陽', principle: '增苦減鹹、溫潤補腎',
      foods: '黑芝麻、黑豆、核桃、山藥、枸杞', avoid: '燥補過度' },
    { name: '小雪', en: 'MINOR.SNOW', start: [11, 22], season: 'winter', element: '水', color: '#6b7fc4',
      focus: '溫養腎陽', principle: '滋陰潛陽、溫補腎氣',
      foods: '黑芝麻、核桃、枸杞、山藥、蓮子', avoid: '生冷辛辣' },
    { name: '大雪', en: 'MAJOR.SNOW', start: [12, 7], season: 'winter', element: '水', color: '#6b7fc4',
      focus: '進補養腎', principle: '滋陰填精、溫補養腎',
      foods: '枸杞、黑豆、核桃、羊肉（少）、鴨肉', avoid: '羊肉過量' },
    { name: '冬至', en: 'WINTER.SOLS', start: [12, 22], season: 'winter', element: '水', color: '#6b7fc4',
      focus: '★ 陰陽轉換', principle: '陰極轉陽・養生關鍵日',
      foods: '黑芝麻糊、枸杞雞湯、核桃、栗子', avoid: '大熱補品' },
    { name: '小寒', en: 'MINOR.COLD', start: [1, 6], season: 'winter', element: '水', color: '#6b7fc4',
      focus: '補腎養藏', principle: '滋陰潛陽、溫補腎精',
      foods: '黑芝麻、核桃、枸杞、紅棗、山藥', avoid: '冰冷生冷' },
    { name: '大寒', en: 'MAJOR.COLD', start: [1, 20], season: 'winter', element: '水', color: '#6b7fc4',
      focus: '滋陰填精', principle: '最冷時節・滋陰填精黃金期',
      foods: '黑芝麻、桑椹、枸杞、黑豆、核桃', avoid: '燥烈辛辣' },
  ];

  const getCurrentSolarTerm = () => {
    const now = currentTime;
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const current = m * 100 + d;
    // 原 solarTerms 為農曆序（立春開頭、大寒結尾）；改成西曆序：小寒 → 大寒 → 立春 → ... → 冬至
    // 否則 4 月走訪會被尾端的 小寒/大寒 覆寫成冬季節氣
    const ordered = [...solarTerms.slice(-2), ...solarTerms.slice(0, -2)];
    // 1/1 ~ 1/5 還在前一年的「冬至」延續
    let result = ordered[ordered.length - 1]; // 冬至
    for (const term of ordered) {
      const termDate = term.start[0] * 100 + term.start[1];
      if (current >= termDate) result = term;
    }
    return result;
  };

  const currentTerm = getCurrentSolarTerm();

  // ===== 七日輪替菜單（依節氣調整） =====
  const getWeeklyMenu = (dayOfWeek, season) => {
    // dayOfWeek: 0=日 1=一 2=二 3=三 4=四 5=五 6=六
    const menus = {
      // 春季菜單
      spring: [
        { day: '日', theme: '溫補日', am: '桂圓紅棗小米粥 + 水煮蛋 + 溫豆漿', pm: '當歸枸杞雞湯 + 清蒸魚 + 燙韭菜 + 五穀飯', ev: '山藥蓮子湯 + 清炒時蔬 + 糙米飯' },
        { day: '一', theme: '潤肺日', am: '山藥銀耳粥 + 水煮蛋 + 溫豆漿', pm: '百合薺菜湯 + 清蒸鱸魚 + 燙菠菜 + 糙米飯', ev: '銀耳春筍湯 + 涼拌豆腐 + 蒸南瓜' },
        { day: '二', theme: '養肝日', am: '枸杞菠菜粥 + 蒸蛋 + 溫豆漿', pm: '枸杞菊花雞湯 + 白切雞 + 燙韭菜 + 五穀飯', ev: '菠菜豆腐湯 + 涼拌馬蘭頭 + 地瓜' },
        { day: '三', theme: '健脾日', am: '紅棗山藥粥 + 水煮蛋 + 溫牛奶', pm: '四神湯 + 蒸鱈魚 + 燙豆苗 + 糙米飯', ev: '山藥玉米湯 + 蒸南瓜 + 涼拌木耳' },
        { day: '四', theme: '養心日', am: '紅棗桂圓小米粥 + 水煮蛋 + 溫豆漿', pm: '番茄牛肉湯 + 清蒸魚 + 燙紅莧菜 + 紫米飯', ev: '紅豆薏仁湯 + 清炒紅鳳菜 + 蒸紅蘿蔔' },
        { day: '五', theme: '固腎日', am: '黑芝麻糊 + 水煮蛋 + 溫豆漿', pm: '黑豆枸杞排骨湯 + 清蒸魚 + 燙菠菜 + 黑米飯', ev: '黑木耳蓮藕湯 + 涼拌海帶 + 蒸芋頭' },
        { day: '六', theme: '清腸日', am: '白粥配薺菜 + 蒸蛋 + 溫豆漿', pm: '冬瓜薏仁湯 + 涼拌豆腐 + 燙春筍 + 糙米飯', ev: '蓮藕排骨湯 + 涼拌茄子 + 小地瓜' },
      ],
      // 夏季菜單
      summer: [
        { day: '日', theme: '清養日', am: '綠豆百合粥 + 水煮蛋 + 溫豆漿', pm: '蓮子鴨肉湯 + 清蒸魚 + 燙莧菜 + 五穀飯', ev: '蓮藕綠豆湯 + 涼拌豆腐 + 蒸山藥' },
        { day: '一', theme: '潤肺日', am: '百合蓮子粥 + 水煮蛋 + 溫豆漿', pm: '蓮藕銀耳湯 + 清蒸鱸魚 + 燙絲瓜 + 糙米飯', ev: '銀耳蓮子湯 + 涼拌豆腐 + 蒸茭白筍' },
        { day: '二', theme: '養肝日', am: '枸杞菊花粥 + 蒸蛋 + 溫豆漿', pm: '絲瓜蛤蜊湯 + 白切雞 + 燙地瓜葉 + 五穀飯', ev: '苦瓜豆腐湯 + 涼拌小黃瓜 + 地瓜' },
        { day: '三', theme: '健脾日', am: '薏仁紅豆粥 + 水煮蛋 + 溫豆漿', pm: '冬瓜薏仁排骨湯 + 蒸鱈魚 + 燙空心菜 + 糙米飯', ev: '玉米薏仁湯 + 蒸冬瓜 + 涼拌木耳' },
        { day: '四', theme: '養心日 ★', am: '蓮子紅棗粥 + 水煮蛋 + 溫豆漿', pm: '蓮子鴨湯 + 清蒸魚 + 燙紅莧菜 + 紫米飯', ev: '紅豆蓮子湯 + 清炒莧菜 + 蒸南瓜' },
        { day: '五', theme: '固腎日', am: '黑芝麻糊 + 水煮蛋 + 溫豆漿', pm: '黑豆排骨湯 + 清蒸魚 + 燙菠菜 + 黑米飯', ev: '黑木耳冬瓜湯 + 涼拌海帶 + 蒸山藥' },
        { day: '六', theme: '清暑日', am: '綠豆薏仁湯 + 蒸蛋 + 溫豆漿', pm: '苦瓜排骨湯 + 涼拌豆腐 + 燙絲瓜 + 糙米飯', ev: '冬瓜蓮藕湯 + 涼拌茄子 + 西瓜少量' },
      ],
      // 長夏菜單
      longsummer: [
        { day: '日', theme: '健脾日', am: '薏仁山藥粥 + 水煮蛋 + 溫豆漿', pm: '四神雞湯 + 清蒸魚 + 燙莧菜 + 五穀飯', ev: '山藥蓮子湯 + 清炒時蔬 + 糙米飯' },
        { day: '一', theme: '潤肺日', am: '白木耳蓮子粥 + 水煮蛋 + 溫豆漿', pm: '絲瓜蛤蜊湯 + 清蒸鱸魚 + 燙空心菜 + 糙米飯', ev: '銀耳百合湯 + 涼拌豆腐 + 蒸茭白筍' },
        { day: '二', theme: '養肝日', am: '枸杞薏仁粥 + 蒸蛋 + 溫豆漿', pm: '絲瓜蛤蜊湯 + 白切雞 + 燙菠菜 + 五穀飯', ev: '冬瓜菠菜湯 + 涼拌小黃瓜 + 地瓜' },
        { day: '三', theme: '健脾日 ★', am: '薏仁紅豆粥 + 水煮蛋 + 溫豆漿', pm: '冬瓜薏仁排骨湯 + 蒸鱈魚 + 燙地瓜葉 + 糙米飯', ev: '玉米薏仁湯 + 蒸冬瓜 + 涼拌木耳' },
        { day: '四', theme: '養心日', am: '蓮子百合粥 + 水煮蛋 + 溫豆漿', pm: '蓮子鴨湯 + 清蒸魚 + 燙紅莧菜 + 紫米飯', ev: '紅豆蓮子湯 + 清炒紅鳳菜 + 蒸紅蘿蔔' },
        { day: '五', theme: '固腎日', am: '黑芝麻糊 + 水煮蛋 + 溫豆漿', pm: '黑豆薏仁排骨湯 + 清蒸魚 + 燙菠菜 + 黑米飯', ev: '黑木耳冬瓜湯 + 涼拌海帶 + 蒸山藥' },
        { day: '六', theme: '化濕日', am: '赤小豆薏仁粥 + 蒸蛋 + 溫豆漿', pm: '冬瓜薏仁湯 + 涼拌豆腐 + 燙絲瓜 + 糙米飯', ev: '茯苓山藥湯 + 涼拌茄子 + 小地瓜' },
      ],
      // 秋季菜單 - 陰虛關鍵季
      autumn: [
        { day: '日', theme: '溫潤日', am: '芝麻核桃粥 + 水煮蛋 + 溫豆漿', pm: '銀耳燉雞湯 + 清蒸魚 + 燙青菜 + 五穀飯', ev: '山藥栗子湯 + 清炒時蔬 + 糙米飯' },
        { day: '一', theme: '潤肺日 ★', am: '梨山藥銀耳粥 + 水煮蛋 + 溫豆漿', pm: '百合杏仁湯 + 清蒸鱸魚 + 燙白菜 + 糙米飯', ev: '銀耳雪梨湯 + 涼拌豆腐 + 蒸南瓜' },
        { day: '二', theme: '養肝日', am: '枸杞桑椹粥 + 蒸蛋 + 溫豆漿', pm: '沙參玉竹雞湯 + 白切雞 + 燙菠菜 + 五穀飯', ev: '菠菜豆腐湯 + 涼拌木耳 + 地瓜' },
        { day: '三', theme: '健脾日', am: '山藥紅棗粥 + 水煮蛋 + 溫豆漿', pm: '四神湯 + 蒸鱈魚 + 燙地瓜葉 + 糙米飯', ev: '山藥玉米湯 + 蒸南瓜 + 涼拌木耳' },
        { day: '四', theme: '養心日', am: '蓮子百合粥 + 水煮蛋 + 溫豆漿', pm: '蓮藕排骨湯 + 清蒸魚 + 燙紅莧菜 + 紫米飯', ev: '紅棗桂圓湯 + 清炒紅鳳菜 + 蒸紅蘿蔔' },
        { day: '五', theme: '固腎日', am: '黑芝麻核桃糊 + 水煮蛋 + 溫豆漿', pm: '黑豆枸杞排骨湯 + 清蒸魚 + 燙菠菜 + 黑米飯', ev: '黑木耳蓮藕湯 + 涼拌海帶 + 蒸山藥' },
        { day: '六', theme: '潤燥日', am: '蜂蜜芝麻粥 + 蒸蛋 + 溫豆漿', pm: '玉竹麥冬雞湯 + 涼拌豆腐 + 燙青菜 + 糙米飯', ev: '蓮藕百合湯 + 涼拌秋葵 + 小地瓜' },
      ],
      // 冬季菜單
      winter: [
        { day: '日', theme: '溫補日', am: '桂圓紅棗小米粥 + 水煮蛋 + 溫豆漿', pm: '枸杞燉雞湯 + 清蒸魚 + 燙青菜 + 五穀飯', ev: '山藥羊肉湯（少）+ 清炒時蔬 + 糙米飯' },
        { day: '一', theme: '潤肺日', am: '核桃銀耳粥 + 水煮蛋 + 溫豆漿', pm: '百合雞湯 + 清蒸鱸魚 + 燙白菜 + 糙米飯', ev: '銀耳雪梨湯 + 涼拌豆腐 + 蒸栗子' },
        { day: '二', theme: '養肝日', am: '枸杞桑椹粥 + 蒸蛋 + 溫豆漿', pm: '枸杞紅棗雞湯 + 白切雞 + 燙菠菜 + 五穀飯', ev: '菠菜豆腐湯 + 涼拌木耳 + 地瓜' },
        { day: '三', theme: '健脾日', am: '山藥紅棗粥 + 水煮蛋 + 溫豆漿', pm: '栗子山藥雞湯 + 蒸鱈魚 + 燙青菜 + 糙米飯', ev: '山藥核桃湯 + 蒸南瓜 + 涼拌木耳' },
        { day: '四', theme: '養心日', am: '桂圓紅棗粥 + 水煮蛋 + 溫豆漿', pm: '紅棗桂圓燉雞 + 清蒸魚 + 燙紅莧菜 + 紫米飯', ev: '紅豆桂圓湯 + 清炒紅鳳菜 + 蒸紅蘿蔔' },
        { day: '五', theme: '固腎日 ★', am: '黑芝麻核桃糊 + 水煮蛋 + 溫豆漿', pm: '黑豆核桃排骨湯 + 清蒸魚 + 燙菠菜 + 黑米飯', ev: '黑木耳枸杞湯 + 涼拌海帶 + 蒸山藥' },
        { day: '六', theme: '平補日', am: '栗子紅棗粥 + 蒸蛋 + 溫豆漿', pm: '山藥枸杞雞湯 + 涼拌豆腐 + 燙青菜 + 糙米飯', ev: '蓮藕排骨湯 + 涼拌茄子 + 蒸芋頭' },
      ],
    };
    return menus[season][dayOfWeek];
  };

  const todayDayOfWeek = currentTime.getDay();
  const todayMenu = getWeeklyMenu(todayDayOfWeek, currentTerm.season);

  const schedule = [
    { id: 'wake', time: '06:30', kanji: '起', code: 'INIT', title: '起床三事', subtitle: '乾洗臉・叩齒・吞津', meridian: '卯時 / 大腸經', duration: 10, ring: 'yang',
      detail: '雙手搓熱三十六下乾洗臉。上下牙齒輕叩三十六下。舌頭口中攪動順逆各十八圈。津液滿口鼓漱三十六下，分三口嚥下。', timer: 600, xp: 15 },
    { id: 'water', time: '06:40', kanji: '水', code: 'H2O', title: '晨起溫水', subtitle: '三百毫升・四十度', meridian: '卯時 / 大腸經', duration: 10, ring: 'fluid',
      detail: '溫開水加二片薑或一顆紅棗。小口慢飲。避免冰水、果汁、咖啡。', xp: 10 },
    { id: 'morning', time: '07:00', kanji: '朝', code: 'QI.BOOT', title: '晨間練功', subtitle: '八段錦・吐納・站樁', meridian: '辰時 / 胃經', duration: 30, key: true, ring: 'yang',
      detail: '【十分】八段錦三式\n【十分】上古煉氣呼吸法\n【十分】舌抵上顎站樁', timer: 1800, hasBreath: true, xp: 40 },
    { id: 'breakfast', time: '07:30', kanji: '膳', code: 'FEED.AM', title: `養陰早餐・${todayMenu.theme}`, subtitle: todayMenu.am.split(' + ')[0], meridian: '辰時 / 胃經', duration: 30, ring: 'yin',
      detail: `【今日主題】${todayMenu.theme}（${currentTerm.name}節氣）\n\n${todayMenu.am}\n\n【節氣調理】${currentTerm.focus}\n【食材原則】${currentTerm.foods}`, xp: 15 },
    { id: 'work_am', time: '09:00', kanji: '勤', code: 'WORK.PEAK', title: '高效工作', subtitle: '巳時創造力高峰', meridian: '巳時 / 脾經', duration: 120, ring: 'yang',
      detail: '一天最清晰的時段，安排最需要創造力的工作。不要刷手機浪費。', xp: 20 },
    { id: 'tea_am', time: '10:00', kanji: '茶', code: 'SIP.01', title: '護眼養陰茶', subtitle: '搓手敷眼・養陰茶飲', meridian: '巳時 / 脾經', duration: 20, ring: 'fluid',
      detail: '護眼三式搭配養陰茶四選一（西洋參/枸杞菊/玉竹麥冬/酸棗仁）。', xp: 15 },
    { id: 'lunch', time: '12:00', kanji: '午', code: 'FEED.PM', title: `養陰午膳・${todayMenu.theme}`, subtitle: todayMenu.pm.split(' + ')[0], meridian: '午時 / 心經', duration: 30, ring: 'yin',
      detail: `【今日主題】${todayMenu.theme}（${currentTerm.name}節氣）\n\n${todayMenu.pm}\n\n【避免】${currentTerm.avoid}`, xp: 15 },
    { id: 'nap', time: '13:00', kanji: '眠', code: 'SLEEP.1', title: '午睡・內觀', subtitle: '養心陰・不過卅分', meridian: '午時 / 心經', duration: 30, key: true, ring: 'yin',
      detail: '午睡十五至三十分鐘。醒後師公內觸法三至五分鐘。', timer: 1500, xp: 30 },
    { id: 'tea_pm', time: '15:00', kanji: '飲', code: 'SIP.02', title: '下午茶', subtitle: '完全戒咖啡', meridian: '申時 / 膀胱經', duration: 10, ring: 'fluid',
      detail: '椰子水、酸梅湯、桑椹葡萄汁擇一。', xp: 10 },
    { id: 'exercise', time: '17:00', kanji: '動', code: 'TRAIN.PM', title: '黃昏練功', subtitle: '太極・八段錦・微汗即止', meridian: '酉時 / 腎經', duration: 60, ring: 'yang',
      detail: '太極拳、八段錦完整套路十五至二十分鐘。微汗即止。', timer: 1200, xp: 30 },
    { id: 'dinner', time: '18:00', kanji: '餐', code: 'FEED.EV', title: `清淡晚膳・${todayMenu.theme}`, subtitle: todayMenu.ev.split(' + ')[0], meridian: '酉時 / 腎經', duration: 30, ring: 'yin',
      detail: `【今日主題】${todayMenu.theme}（${currentTerm.name}節氣）\n\n${todayMenu.ev}\n\n【節氣原則】${currentTerm.principle}`, xp: 15 },
    { id: 'foot', time: '20:00', kanji: '湯', code: 'FLUSH', title: '泡腳搓湧泉', subtitle: '引火歸元', meridian: '戌時 / 心包經', duration: 30, ring: 'yin',
      detail: '四十度溫水泡腳十五分鐘。泡完搓湧泉穴各一百下。', timer: 900, xp: 20 },
    { id: 'night', time: '21:00', kanji: '禪', code: 'MEDIT.X', title: '睡前禪修', subtitle: '吐納・玉液還丹・靜坐', meridian: '亥時 / 三焦經', duration: 30, key: true, ring: 'yin',
      detail: '【十五分】上古煉氣\n【十分】玉液還丹\n【五分】收功靜坐', timer: 1800, hasBreath: true, xp: 40 },
    { id: 'prep', time: '22:00', kanji: '寢', code: 'PREP.OFF', title: '寢前準備', subtitle: '關三C・床頭溫水', meridian: '亥時 / 三焦經', duration: 30, ring: 'yin',
      detail: '關閉三C螢幕。床頭放溫開水。房間調暗。可聽古琴頌缽。', xp: 10 },
    { id: 'sleep', time: '22:30', kanji: '寂', code: 'NULL', title: '入定', subtitle: '★ 最高優先級', meridian: '子時 / 膽經', duration: 0, key: true, critical: true, ring: 'yin',
      detail: '務必子時前入睡。子時膽經當令、一陽初生，身體自動完成內在修復。', xp: 50 },
  ];

  const achievements = [
    { id: 'first_step', kanji: '初', name: '初窺門徑', desc: '完成第一項修煉', color: '#00ffd4', rarity: 'common',
      check: (s, c) => Object.values(c).filter(Boolean).length >= 1 },
    { id: 'perfect_day', kanji: '圓', name: '功德圓滿', desc: '單日完成全部 15 項', color: '#ff00aa', rarity: 'rare',
      check: (s, c) => Object.values(c).filter(Boolean).length >= 15 },
    { id: 'streak_3', kanji: '參', name: '三日持心', desc: '連續 3 天修煉', color: '#00ffd4', rarity: 'common',
      check: (s) => s.streak >= 3 },
    { id: 'streak_7', kanji: '柒', name: '七日封印', desc: '連續 7 天修煉', color: '#ffaa00', rarity: 'uncommon',
      check: (s) => s.streak >= 7 },
    { id: 'streak_21', kanji: '築', name: '廿一築基', desc: '連續 21 天修煉', color: '#ffaa00', rarity: 'rare',
      check: (s) => s.streak >= 21 },
    { id: 'streak_49', kanji: '閉', name: '四九閉關', desc: '連續 49 天修煉', color: '#ff00aa', rarity: 'epic',
      check: (s) => s.streak >= 49 },
    { id: 'streak_100', kanji: '丹', name: '百日結丹', desc: '連續 100 天修煉', color: '#ffee00', rarity: 'legendary',
      check: (s) => s.streak >= 100 },
    { id: 'breath_100', kanji: '息', name: '龜息之道', desc: '完成 100 個呼吸循環', color: '#00ffd4', rarity: 'common',
      check: (s) => s.totalBreathCycles >= 100 },
    { id: 'breath_1000', kanji: '玄', name: '千息歸元', desc: '完成 1000 個呼吸循環', color: '#ff00aa', rarity: 'rare',
      check: (s) => s.totalBreathCycles >= 1000 },
    { id: 'level_5', kanji: '基', name: '築基境', desc: '達到 5 級', color: '#00ffd4', rarity: 'common',
      check: (s) => s.level >= 5 },
    { id: 'level_10', kanji: '金', name: '金丹境', desc: '達到 10 級', color: '#ffaa00', rarity: 'uncommon',
      check: (s) => s.level >= 10 },
    { id: 'level_20', kanji: '嬰', name: '元嬰境', desc: '達到 20 級', color: '#ff00aa', rarity: 'rare',
      check: (s) => s.level >= 20 },
    { id: 'level_30', kanji: '神', name: '化神境', desc: '達到 30 級', color: '#ffee00', rarity: 'epic',
      check: (s) => s.level >= 30 },
    { id: 'practice_60', kanji: '勤', name: '勤修苦煉', desc: '累積練功 60 分鐘', color: '#00ffd4', rarity: 'common',
      check: (s) => s.totalPracticeMinutes >= 60 },
    { id: 'practice_600', kanji: '煉', name: '十時一煉', desc: '累積練功 600 分鐘', color: '#ffaa00', rarity: 'uncommon',
      check: (s) => s.totalPracticeMinutes >= 600 },
    { id: 'perfect_3', kanji: '三', name: '三日圓滿', desc: '累積 3 個圓滿之日', color: '#ff00aa', rarity: 'rare',
      check: (s) => s.perfectDays >= 3 },
    { id: 'early_bird', kanji: '晨', name: '迎風飲露', desc: '5 天在晨前完成練功', color: '#ffaa00', rarity: 'uncommon',
      check: (s) => s.earlyBirdDays >= 5 },
    { id: 'night_owl_defeated', kanji: '子', name: '子時歸寂', desc: '5 天在子時前入睡', color: '#ff00aa', rarity: 'uncommon',
      check: (s) => s.nightOwlDefeatedDays >= 5 },
  ];

  const levelTitles = [
    { min: 1, max: 2, title: '煉體', en: 'TEMPER' },
    { min: 3, max: 4, title: '鍛骨', en: 'FORGE' },
    { min: 5, max: 9, title: '築基', en: 'FOUND' },
    { min: 10, max: 14, title: '金丹', en: 'CORE' },
    { min: 15, max: 19, title: '元嬰', en: 'NASC' },
    { min: 20, max: 29, title: '化神', en: 'SPIRIT' },
    { min: 30, max: 49, title: '合體', en: 'UNITY' },
    { min: 50, max: 99, title: '渡劫', en: 'TRIAL' },
    { min: 100, max: 999, title: '大乘', en: 'ASCEND' },
  ];

  const getLevelTitle = (lv) => levelTitles.find(t => lv >= t.min && lv <= t.max) || levelTitles[0];
  const getXPForLevel = (lv) => Math.floor(100 * Math.pow(1.15, lv - 1));

  const addXP = (amount, reason) => {
    setStats(prev => {
      let newXP = prev.totalXP + amount;
      let newLevel = prev.level;
      let requiredXP = getXPForLevel(newLevel);
      while (newXP >= requiredXP) {
        newXP -= requiredXP;
        newLevel++;
        requiredXP = getXPForLevel(newLevel);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      return { ...prev, totalXP: newXP, level: newLevel };
    });
  };

  useEffect(() => {
    const newlyDone = Object.keys(completed).filter(
      id => completed[id] && !prevCompletedRef.current[id]
    );
    newlyDone.forEach(id => {
      const item = schedule.find(s => s.id === id);
      if (item) {
        addXP(item.xp, item.title);
        setStats(p => ({ ...p, totalCompleted: p.totalCompleted + 1 }));
      }
    });
    prevCompletedRef.current = completed;
  }, [completed]);

  useEffect(() => {
    const doneCount = Object.values(completed).filter(Boolean).length;
    const today = new Date().toDateString();
    
    if (doneCount >= 3 && stats.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      setStats(p => ({
        ...p,
        streak: p.lastActiveDate === yesterdayStr ? p.streak + 1 : 1,
        lastActiveDate: today,
        totalDaysActive: p.totalDaysActive + 1,
        perfectDays: doneCount === 15 ? p.perfectDays + 1 : p.perfectDays,
      }));
    }
    
    setStats(p => {
      const percent = Math.round((doneCount / 15) * 100);
      const newHistory = [...(p.weeklyHistory || [])];
      const existingIdx = newHistory.findIndex(h => h.date === today);
      if (existingIdx >= 0) newHistory[existingIdx] = { date: today, percent };
      else newHistory.push({ date: today, percent });
      return { ...p, weeklyHistory: newHistory.slice(-7) };
    });
  }, [completed]);

  useEffect(() => {
    achievements.forEach(ach => {
      if (!unlockedAchievements[ach.id] && ach.check(stats, completed)) {
        setUnlockedAchievements(prev => ({ ...prev, [ach.id]: Date.now() }));
        setShowAchievement(ach);
        setTimeout(() => setShowAchievement(null), 4000);
      }
    });
  }, [stats, completed]);

  const toggleComplete = (id) => setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  const startTimer = (s, l) => { setTimerSeconds(s); setTimerDuration(s); setTimerLabel(l); setTimerActive(true); };
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getCurrentSession = () => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    let current = null;
    for (const s of schedule) {
      const [h, m] = s.time.split(':').map(Number);
      if (h * 60 + m <= now) current = s;
    }
    return current;
  };

  const getProgress = () => {
    const total = schedule.length;
    const done = Object.values(completed).filter(Boolean).length;
    return { done, total, percent: Math.round((done / total) * 100) };
  };

  const getRings = () => {
    const rings = { yang: { done: 0, total: 0 }, yin: { done: 0, total: 0 }, fluid: { done: 0, total: 0 } };
    schedule.forEach(s => {
      if (s.ring) {
        rings[s.ring].total++;
        if (completed[s.id]) rings[s.ring].done++;
      }
    });
    return rings;
  };

  const currentSession = getCurrentSession();
  const progress = getProgress();
  const rings = getRings();
  const currentTitle = getLevelTitle(stats.level);
  const nextLevelXP = getXPForLevel(stats.level);
  const xpPercent = Math.round((stats.totalXP / nextLevelXP) * 100);
  const unlockedCount = Object.keys(unlockedAchievements).length;

  const breathLabels = {
    inhale: { cn: '吸', en: 'INHALE', scale: 1.2, color: '#00ffd4' },
    hold1: { cn: '沉', en: 'SINK', scale: 1.2, color: '#ffaa00' },
    exhale: { cn: '吐', en: 'EXHALE', scale: 0.8, color: '#ff00aa' },
    hold2: { cn: '空', en: 'VOID', scale: 0.8, color: '#8b5cf6' }
  };

  const rarityColors = {
    common: { color: '#00ffd4', label: 'COMMON' },
    uncommon: { color: '#ffaa00', label: 'UNCOMMON' },
    rare: { color: '#ff00aa', label: 'RARE' },
    epic: { color: '#8b5cf6', label: 'EPIC' },
    legendary: { color: '#ffee00', label: 'LEGEND' }
  };

  const baguaSymbols = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: '#0a0612',
      color: '#e8dfff',
    }}>
      <style>{`
        /* 字體 link 在 index.html 統一載入（preconnect + Google Fonts + chinese-fonts-cdn） */

        /* 字體體系 v2 — 古典墨寶 × 賽博龐克 */
        .f-wenkai {
          font-family: 'LXGW WenKai', 'Cactus Classical Serif', 'Noto Serif TC', serif;
          font-weight: 400;
          font-feature-settings: 'halt' 1, 'vpal' 1;
        }
        .f-wenkai-bold {
          font-family: 'LXGW WenKai Bold', 'LXGW WenKai', 'Cactus Classical Serif', 'Noto Serif TC', serif;
          font-weight: 700;
          font-feature-settings: 'halt' 1, 'vpal' 1;
        }
        .f-serif-black {
          /* 古典墨寶宋體：冷峻、鋒利、有鐵畫銀鉤之氣 */
          font-family: 'Cactus Classical Serif', 'LXGW Bright', 'Noto Serif TC', serif;
          font-weight: 900;
          letter-spacing: 0.06em;
          font-feature-settings: 'halt' 1, 'vpal' 1;
        }
        .f-sans-black {
          /* Chiron Hei HK：香港黑體現代版，矩形骨架、銳利轉角 */
          font-family: 'Chiron Hei HK Bold', 'Chiron Hei HK', 'Noto Sans TC', sans-serif;
          font-weight: 900;
          letter-spacing: 0.03em;
          font-feature-settings: 'halt' 1, 'vpal' 1;
        }
        .f-sans {
          font-family: 'Chiron Hei HK', 'Noto Sans TC', sans-serif;
          font-weight: 500;
          font-feature-settings: 'halt' 1, 'vpal' 1;
        }
        .f-sans-light {
          font-family: 'Chiron Hei HK', 'Noto Sans TC', sans-serif;
          font-weight: 300;
          font-feature-settings: 'halt' 1, 'vpal' 1;
        }
        .f-cyber {
          /* Chakra Petch：賽博龐克招牌，有稜有角 */
          font-family: 'Chakra Petch', 'Orbitron', sans-serif;
          font-weight: 700;
          letter-spacing: 0.1em;
          font-feature-settings: 'tnum' 1;
        }
        .f-cyber-light {
          font-family: 'Chakra Petch', 'Rajdhani', sans-serif;
          font-weight: 500;
          letter-spacing: 0.18em;
          font-feature-settings: 'tnum' 1;
        }
        .f-mono {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
          font-weight: 400;
          font-feature-settings: 'tnum' 1, 'zero' 1, 'ss02' 1;
        }
        .f-mono-bold {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
          font-weight: 700;
          font-feature-settings: 'tnum' 1, 'zero' 1, 'ss02' 1;
        }
        
        /* 故障效果 */
        @keyframes glitch {
          0%, 100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          10% { transform: translate(-2px, 0); filter: hue-rotate(90deg); }
          20% { transform: translate(2px, 0); }
          30% { transform: translate(0, 2px); filter: hue-rotate(180deg); }
          40% { transform: translate(0, -2px); }
          50% { transform: translate(-1px, 1px); filter: hue-rotate(270deg); }
          60% { transform: translate(1px, -1px); }
        }
        .glitch { animation: glitch 3s infinite; }
        
        /* 掃描線 */
        .scanlines::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 212, 0.03) 0px,
            rgba(0, 255, 212, 0.03) 1px,
            transparent 1px,
            transparent 3px
          );
          pointer-events: none;
          z-index: 100;
        }
        
        /* 霓虹文字 - 分級發光 */
        .neon-cyan {
          color: #00ffd4;
          text-shadow: 
            0 0 4px rgba(0, 255, 212, 0.9),
            0 0 10px rgba(0, 255, 212, 0.7),
            0 0 20px rgba(0, 255, 212, 0.4);
        }
        .neon-cyan-strong {
          color: #00ffd4;
          text-shadow: 
            0 0 2px rgba(0, 255, 212, 1),
            0 0 8px rgba(0, 255, 212, 0.9),
            0 0 16px rgba(0, 255, 212, 0.7),
            0 0 30px rgba(0, 255, 212, 0.5);
        }
        .neon-pink {
          color: #ff00aa;
          text-shadow: 
            0 0 4px rgba(255, 0, 170, 0.9),
            0 0 10px rgba(255, 0, 170, 0.7),
            0 0 20px rgba(255, 0, 170, 0.4);
        }
        .neon-pink-strong {
          color: #ff00aa;
          text-shadow: 
            0 0 2px rgba(255, 0, 170, 1),
            0 0 8px rgba(255, 0, 170, 0.9),
            0 0 16px rgba(255, 0, 170, 0.7),
            0 0 30px rgba(255, 0, 170, 0.5);
        }
        .neon-yellow {
          color: #ffee00;
          text-shadow: 
            0 0 4px rgba(255, 238, 0, 0.9),
            0 0 10px rgba(255, 238, 0, 0.7);
        }
        .neon-purple {
          color: #a78bfa;
          text-shadow: 
            0 0 4px rgba(167, 139, 250, 0.9),
            0 0 10px rgba(167, 139, 250, 0.7);
        }
        
        /* 筆墨漢字特殊效果 */
        .ink-glow-cyan {
          color: #00ffd4;
          text-shadow: 
            0 0 3px rgba(0, 255, 212, 1),
            0 0 12px rgba(0, 255, 212, 0.7),
            0 0 24px rgba(0, 255, 212, 0.4),
            2px 2px 0 rgba(10, 6, 18, 0.8);
        }
        .ink-glow-pink {
          color: #ff00aa;
          text-shadow: 
            0 0 3px rgba(255, 0, 170, 1),
            0 0 12px rgba(255, 0, 170, 0.7),
            0 0 24px rgba(255, 0, 170, 0.4),
            2px 2px 0 rgba(10, 6, 18, 0.8);
        }
        .ink-glow-yellow {
          color: #ffee00;
          text-shadow: 
            0 0 3px rgba(255, 238, 0, 1),
            0 0 12px rgba(255, 238, 0, 0.7),
            0 0 24px rgba(255, 238, 0, 0.4),
            2px 2px 0 rgba(10, 6, 18, 0.8);
        }
        
        /* 終端機卡片 */
        .terminal-card {
          background: linear-gradient(180deg, rgba(20, 10, 35, 0.85), rgba(10, 6, 18, 0.9));
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 255, 212, 0.2);
          box-shadow: 
            0 0 20px rgba(0, 255, 212, 0.05),
            inset 0 1px 0 rgba(0, 255, 212, 0.1);
          position: relative;
        }
        .terminal-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00ffd4, transparent);
          opacity: 0.5;
        }
        
        .terminal-card-active {
          background: linear-gradient(180deg, rgba(40, 15, 55, 0.95), rgba(25, 8, 40, 0.95));
          border: 1px solid rgba(255, 0, 170, 0.5);
          box-shadow: 
            0 0 30px rgba(255, 0, 170, 0.2),
            0 0 60px rgba(255, 0, 170, 0.1),
            inset 0 0 30px rgba(255, 0, 170, 0.05);
        }
        
        .talisman {
          position: relative;
          background: linear-gradient(135deg, rgba(255, 0, 170, 0.1), rgba(0, 255, 212, 0.1));
          border: 1px solid rgba(255, 0, 170, 0.3);
          overflow: hidden;
        }
        .talisman::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255, 0, 170, 0.03) 10px,
            rgba(255, 0, 170, 0.03) 11px
          );
        }
        
        /* 切角邊框 */
        .cyber-border {
          clip-path: polygon(
            0 0,
            calc(100% - 12px) 0,
            100% 12px,
            100% 100%,
            12px 100%,
            0 calc(100% - 12px)
          );
        }
        
        .cyber-border-small {
          clip-path: polygon(
            0 0,
            calc(100% - 6px) 0,
            100% 6px,
            100% 100%,
            6px 100%,
            0 calc(100% - 6px)
          );
        }
        
        .btn-neon {
          background: linear-gradient(180deg, rgba(0, 255, 212, 0.1), rgba(0, 255, 212, 0.05));
          border: 1px solid rgba(0, 255, 212, 0.5);
          color: #00ffd4;
          text-shadow: 0 0 8px rgba(0, 255, 212, 0.6);
          transition: all 0.3s;
          letter-spacing: 0.15em;
        }
        .btn-neon:hover {
          background: linear-gradient(180deg, rgba(0, 255, 212, 0.2), rgba(0, 255, 212, 0.1));
          box-shadow: 0 0 20px rgba(0, 255, 212, 0.4), inset 0 0 10px rgba(0, 255, 212, 0.2);
        }
        
        .btn-neon-pink {
          background: linear-gradient(180deg, rgba(255, 0, 170, 0.1), rgba(255, 0, 170, 0.05));
          border: 1px solid rgba(255, 0, 170, 0.5);
          color: #ff00aa;
          text-shadow: 0 0 8px rgba(255, 0, 170, 0.6);
          transition: all 0.3s;
        }
        .btn-neon-pink:hover {
          background: linear-gradient(180deg, rgba(255, 0, 170, 0.2), rgba(255, 0, 170, 0.1));
          box-shadow: 0 0 20px rgba(255, 0, 170, 0.4);
        }
        
        @keyframes breathe-glow {
          0%, 100% { filter: drop-shadow(0 0 10px currentColor); }
          50% { filter: drop-shadow(0 0 30px currentColor); }
        }
        .breathe-glow { animation: breathe-glow 4s ease-in-out infinite; }
        
        @keyframes flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .flow-gradient {
          background-size: 200% 100%;
          animation: flow 3s linear infinite;
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-slow { animation: rotate-slow 60s linear infinite; }
        
        @keyframes level-up-burst {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(20deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .level-up-burst { animation: level-up-burst 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        @keyframes slide-glitch {
          0% { transform: translateY(-60px); opacity: 0; filter: blur(10px); }
          30% { transform: translateY(5px); opacity: 1; filter: blur(0); }
          50% { transform: translateX(-3px); }
          70% { transform: translateX(3px); }
          100% { transform: translateY(0); }
        }
        .slide-glitch { animation: slide-glitch 0.6s ease-out forwards; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.4s ease-out; }
        
        .cyber-checkbox {
          width: 28px;
          height: 28px;
          border: 1px solid #00ffd4;
          background: rgba(0, 255, 212, 0.05);
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
        }
        .cyber-checkbox::before {
          content: '';
          position: absolute;
          inset: -2px;
          border: 1px solid rgba(0, 255, 212, 0.3);
          opacity: 0;
          transition: all 0.3s;
        }
        .cyber-checkbox:hover::before { opacity: 1; }
        .cyber-checkbox.done {
          background: #00ffd4;
          box-shadow: 0 0 15px rgba(0, 255, 212, 0.6);
        }
        .cyber-checkbox.done::after {
          content: '✓';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0a0612;
          font-size: 16px;
          font-weight: 900;
        }
        
        .divider-cyber {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .divider-cyber::before, .divider-cyber::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 212, 0.4), transparent);
        }
        
        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .cursor-blink::after {
          content: '_';
          animation: cursor-blink 1s infinite;
        }
        
        @keyframes warning-pulse {
          0%, 100% { border-color: rgba(255, 0, 170, 0.3); }
          50% { border-color: rgba(255, 0, 170, 1); }
        }
        .warning-pulse { animation: warning-pulse 1.5s ease-in-out infinite; }
      `}</style>

      {/* 網格背景 */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 212, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 212, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* 霓虹光暈 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, #ff00aa, transparent 70%)',
          filter: 'blur(60px)'
        }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, #00ffd4, transparent 70%)',
          filter: 'blur(60px)'
        }} />
      </div>

      {/* 背景八卦 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04]">
        <svg width="800" height="800" viewBox="0 0 200 200" className="rotate-slow">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#00ffd4" strokeWidth="0.5"/>
          <circle cx="100" cy="100" r="70" fill="none" stroke="#00ffd4" strokeWidth="0.5"/>
          {baguaSymbols.map((s, i) => {
            const angle = (i * 45 - 90) * Math.PI / 180;
            const x = 100 + Math.cos(angle) * 80;
            const y = 100 + Math.sin(angle) * 80;
            return <text key={i} x={x} y={y} fontSize="10" fill="#00ffd4" textAnchor="middle" dominantBaseline="central">{s}</text>;
          })}
        </svg>
      </div>

      <div className="scanlines" />

      {/* 成就通知 */}
      {showAchievement && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md lg:max-w-lg z-[60] slide-glitch">
          <div className="terminal-card cyber-border p-4 flex items-center gap-3" style={{
            borderColor: showAchievement.color,
            boxShadow: `0 0 30px ${showAchievement.color}66`
          }}>
            <div className="shrink-0 w-14 h-14 flex items-center justify-center talisman cyber-border-small" style={{
              borderColor: showAchievement.color,
            }}>
              <span className="f-serif-black text-3xl" style={{
                color: showAchievement.color,
                textShadow: `0 0 12px ${showAchievement.color}, 0 0 24px ${showAchievement.color}88`
              }}>
                {showAchievement.kanji}
              </span>
            </div>
            <div className="flex-1">
              <div className="f-cyber text-[9px] tracking-[0.3em]" style={{ color: showAchievement.color }}>
                ▼ 境界突破 · ACHIEVEMENT
              </div>
              <div className="f-sans-black text-lg mt-0.5">
                {showAchievement.name}
              </div>
              <div className="f-sans text-[11px] mt-0.5 opacity-70">{showAchievement.desc}</div>
            </div>
            <div className="f-cyber text-[9px] px-2 py-1" style={{
              color: showAchievement.color,
              border: `1px solid ${showAchievement.color}`,
            }}>
              {rarityColors[showAchievement.rarity].label}
            </div>
          </div>
        </div>
      )}

      {/* 升級通知 */}
      {showLevelUp && (
        <div className="fixed top-20 left-0 right-0 z-[60] flex justify-center pointer-events-none">
          <div className="level-up-burst terminal-card cyber-border px-6 py-4 flex items-center gap-4" style={{
            borderColor: '#ffee00',
            background: 'linear-gradient(135deg, rgba(255, 238, 0, 0.15), rgba(255, 170, 0, 0.1))',
            boxShadow: '0 0 50px rgba(255, 238, 0, 0.5)'
          }}>
            <div className="f-serif-black text-7xl ink-glow-yellow">突</div>
            <div>
              <div className="f-cyber text-[10px] tracking-[0.3em] neon-yellow">LEVEL UP</div>
              <div className="f-sans-black text-2xl neon-yellow">
                境界突破
              </div>
              <div className="f-cyber text-xs mt-0.5" style={{ color: '#ffee00' }}>
                {currentTitle.title} · {currentTitle.en} · LV.{stats.level}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 頂部 HUD */}
      <div className="sticky top-0 z-40 relative" style={{
        background: 'linear-gradient(180deg, rgba(10, 6, 18, 0.95), rgba(10, 6, 18, 0.85))',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 255, 212, 0.2)'
      }}>
        <div className="px-4 sm:px-5 md:px-6 lg:px-8 pt-4 pb-3 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 talisman cyber-border-small flex items-center justify-center" style={{
                borderColor: '#ff00aa',
                boxShadow: '0 0 15px rgba(255, 0, 170, 0.4)'
              }}>
                <span className="f-serif-black text-3xl ink-glow-pink">道</span>
              </div>
              <div>
                <div className="f-cyber text-xl font-black tracking-widest neon-cyan-strong">
                  DAO.SYS
                </div>
                <div className="f-mono text-[10px] tracking-[0.15em] flex items-center gap-2 mt-0.5">
                  <span className="f-sans-black neon-pink" style={{ fontSize: '11px' }}>{currentTitle.title}</span>
                  <span className="neon-purple">LV.{stats.level}</span>
                  <span className="opacity-40">{glitchText.slice(0, 4)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="f-cyber text-2xl font-light tabular-nums neon-cyan-strong">
                {currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              {stats.streak > 0 && (
                <div className="f-cyber text-[10px] font-bold neon-pink cursor-blink flex items-center justify-end gap-1">
                  <span>▲</span>
                  <span>CHAIN.{String(stats.streak).padStart(3, '0')}</span>
                </div>
              )}
            </div>
          </div>

          {/* XP 條 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="f-cyber text-[10px] tracking-[0.2em] neon-cyan">
                ▸ <span className="f-sans-black" style={{ fontSize: '11px' }}>修為</span> · QI
              </span>
              <span className="f-mono text-[10px] tabular-nums neon-cyan">
                {stats.totalXP}/{nextLevelXP} [{xpPercent}%]
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden cyber-border-small" style={{ background: 'rgba(0, 255, 212, 0.1)', border: '1px solid rgba(0, 255, 212, 0.2)' }}>
              <div className="h-full transition-all duration-700 flow-gradient" style={{
                width: `${xpPercent}%`,
                background: 'linear-gradient(90deg, #00ffd4, #ff00aa, #ffee00, #00ffd4)',
                boxShadow: '0 0 10px rgba(0, 255, 212, 0.8)'
              }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 md:gap-2 md:max-w-2xl md:mx-auto">
            {[
              { id: 'today', label: '今日', en: 'SYS' },
              { id: 'breath', label: '吐納', en: 'QI' },
              { id: 'log', label: '心覺', en: 'LOG' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex-1 py-2 md:py-3 px-2 md:px-4 transition-all cyber-border-small"
                style={{
                  background: activeTab === t.id ? 'linear-gradient(180deg, rgba(0, 255, 212, 0.2), rgba(0, 255, 212, 0.05))' : 'rgba(20, 10, 35, 0.5)',
                  border: activeTab === t.id ? '1px solid rgba(0, 255, 212, 0.6)' : '1px solid rgba(0, 255, 212, 0.15)',
                  boxShadow: activeTab === t.id ? '0 0 10px rgba(0, 255, 212, 0.3)' : 'none'
                }}
              >
                <div className="f-sans-black text-base md:text-lg" style={{
                  color: activeTab === t.id ? '#00ffd4' : 'rgba(232, 223, 255, 0.6)',
                  textShadow: activeTab === t.id ? '0 0 8px rgba(0, 255, 212, 0.6)' : 'none'
                }}>{t.label}</div>
                <div className="f-cyber text-[8px] md:text-[10px] tracking-widest opacity-50 mt-0.5">{t.en}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 計時器 */}
      {timerActive && (
        <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 md:max-w-md lg:max-w-lg z-50 fade-in md:rounded-sm" style={{
          background: 'linear-gradient(180deg, rgba(10, 6, 18, 0.95), #0a0612)',
          borderTop: '1px solid #ff00aa',
          boxShadow: '0 -10px 30px rgba(255, 0, 170, 0.2)',
          padding: '16px 20px 20px'
        }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="f-cyber text-[9px] tracking-[0.3em] neon-pink">◉ RUNNING</div>
              <div className="f-sans-black text-base mt-0.5">{timerLabel}</div>
              <div className="f-cyber text-[9px] mt-0.5 neon-yellow">
                +{Math.floor(timerDuration / 60) * 5} QI
              </div>
            </div>
            <div className="f-cyber text-4xl font-light tabular-nums neon-pink-strong">
              {formatTime(timerSeconds)}
            </div>
          </div>
          <div className="h-0.5 mb-3" style={{ background: 'rgba(255, 0, 170, 0.15)' }}>
            <div className="h-full transition-all flow-gradient" style={{
              width: `${((timerDuration - timerSeconds) / timerDuration) * 100}%`,
              background: 'linear-gradient(90deg, #ff00aa, #ffee00)'
            }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTimerActive(false)} className="flex-1 py-2 text-sm f-cyber btn-neon cyber-border-small">
              ⏸ PAUSE
            </button>
            <button onClick={() => { setTimerActive(false); setTimerSeconds(0); }} className="px-6 py-2 text-sm f-cyber btn-neon-pink cyber-border-small">
              ⏹ STOP
            </button>
          </div>
        </div>
      )}

      {/* 今日 TAB */}
      {activeTab === 'today' && (
        <div className="px-4 sm:px-5 md:px-6 lg:px-8 py-5 pb-24 relative max-w-7xl mx-auto w-full">
          <div className="lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-6 space-y-5 lg:space-y-0">
            <div className="space-y-5">
          {/* 節氣卡片 */}
          <div className="terminal-card cyber-border p-5 relative overflow-hidden" style={{
            borderColor: `${currentTerm.color}66`,
            boxShadow: `0 0 20px ${currentTerm.color}22`
          }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              background: `radial-gradient(circle at 80% 20%, ${currentTerm.color}aa, transparent 60%)`
            }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-16 h-16 flex items-center justify-center cyber-border-small talisman" style={{
                    borderColor: currentTerm.color,
                    background: `linear-gradient(135deg, ${currentTerm.color}22, ${currentTerm.color}08)`
                  }}>
                    <span className="f-serif-black text-4xl" style={{
                      color: currentTerm.color,
                      textShadow: `0 0 12px ${currentTerm.color}, 0 0 24px ${currentTerm.color}66, 2px 2px 0 rgba(10, 6, 18, 0.8)`,
                      lineHeight: 1
                    }}>{currentTerm.element}</span>
                  </div>
                  <div>
                    <div className="f-cyber text-[9px] tracking-[0.3em]" style={{ color: currentTerm.color }}>
                      ◢ SOLAR.TERM
                    </div>
                    <div className="f-serif-black text-2xl mt-0.5" style={{
                      color: currentTerm.color,
                      textShadow: `0 0 8px ${currentTerm.color}88, 2px 2px 0 rgba(10, 6, 18, 0.8)`
                    }}>
                      {currentTerm.name}
                    </div>
                    <div className="f-cyber text-[9px] tracking-widest opacity-60 mt-0.5">
                      {currentTerm.en}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="f-sans-black text-sm" style={{ color: currentTerm.color }}>
                    {currentTerm.focus}
                  </div>
                  <div className="f-wenkai text-[10px] opacity-60 mt-0.5">
                    {{spring:'春', summer:'夏', longsummer:'長夏', autumn:'秋', winter:'冬'}[currentTerm.season]}季
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 mt-3">
                <div className="flex gap-2 p-2 cyber-border-small" style={{
                  background: `${currentTerm.color}08`, border: `1px solid ${currentTerm.color}22`
                }}>
                  <span className="f-cyber text-[9px] tracking-widest shrink-0" style={{ color: currentTerm.color }}>原則</span>
                  <span className="f-wenkai text-xs opacity-90">{currentTerm.principle}</span>
                </div>
                <div className="flex gap-2 p-2 cyber-border-small" style={{
                  background: `${currentTerm.color}08`, border: `1px solid ${currentTerm.color}22`
                }}>
                  <span className="f-cyber text-[9px] tracking-widest shrink-0" style={{ color: currentTerm.color }}>食材</span>
                  <span className="f-wenkai text-xs opacity-90">{currentTerm.foods}</span>
                </div>
                <div className="flex gap-2 p-2 cyber-border-small" style={{
                  background: 'rgba(255, 0, 170, 0.05)', border: '1px solid rgba(255, 0, 170, 0.2)'
                }}>
                  <span className="f-cyber text-[9px] tracking-widest shrink-0 neon-pink">避免</span>
                  <span className="f-wenkai text-xs opacity-90">{currentTerm.avoid}</span>
                </div>
              </div>

              <div className="h-px my-3" style={{ background: `linear-gradient(90deg, transparent, ${currentTerm.color}66, transparent)` }} />

              <div className="flex items-center justify-between">
                <div>
                  <div className="f-cyber text-[9px] tracking-[0.3em] opacity-60">TODAY.THEME</div>
                  <div className="f-sans-black text-base mt-0.5" style={{ color: currentTerm.color }}>
                    {['週日','週一','週二','週三','週四','週五','週六'][todayDayOfWeek]}・{todayMenu.theme}
                  </div>
                </div>
                <div className="f-wenkai text-xs opacity-60 italic">
                  {currentTerm.name === '夏至' || currentTerm.name === '秋分' || currentTerm.name === '冬至' ? '★ 關鍵節氣' : '依時而養'}
                </div>
              </div>
            </div>
          </div>

          {/* 三環 HUD */}
          <div className="terminal-card cyber-border p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="f-cyber text-[9px] tracking-[0.3em] neon-cyan">◢ BALANCE</div>
                <div className="f-sans-black text-xl mt-1">三元平衡</div>
                <div className="f-wenkai text-sm opacity-70 mt-0.5">陰陽津液・三氣同修</div>
              </div>
              <div className="text-right">
                <div className="f-cyber text-4xl font-black tabular-nums neon-cyan-strong">
                  {progress.done}
                </div>
                <div className="f-mono text-[10px] opacity-60">／ {progress.total}</div>
              </div>
            </div>

            <div className="flex items-center justify-center my-4">
              <div className="relative w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 breathe-glow">
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full rotate-slow opacity-20">
                  <circle cx="100" cy="100" r="95" fill="none" stroke="#00ffd4" strokeWidth="0.5" strokeDasharray="2,4"/>
                </svg>
                
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  {[
                    { key: 'yang', r: 85, color: '#ff00aa' },
                    { key: 'yin', r: 68, color: '#a78bfa' },
                    { key: 'fluid', r: 51, color: '#00ffd4' }
                  ].map(ring => {
                    const circ = 2 * Math.PI * ring.r;
                    const pct = rings[ring.key].total > 0 ? (rings[ring.key].done / rings[ring.key].total) : 0;
                    return (
                      <g key={ring.key}>
                        <circle cx="100" cy="100" r={ring.r} fill="none" stroke={ring.color} strokeWidth="11" strokeOpacity="0.1"/>
                        <circle cx="100" cy="100" r={ring.r} fill="none" stroke={ring.color} strokeWidth="11" strokeLinecap="round"
                          strokeDasharray={`${circ * pct} ${circ}`}
                          filter="url(#glow)"
                          style={{ transition: 'stroke-dasharray 1s ease-out' }}/>
                      </g>
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="f-cyber text-6xl font-black neon-cyan-strong">
                    {progress.percent}
                  </div>
                  <div className="f-cyber text-[10px] tracking-[0.3em] opacity-60">%</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'yang', color: '#ff00aa', label: '陽', en: 'YANG' },
                { key: 'yin', color: '#a78bfa', label: '陰', en: 'YIN' },
                { key: 'fluid', color: '#00ffd4', label: '津', en: 'JIN' }
              ].map(r => (
                <div key={r.key} className="text-center p-2 cyber-border-small" style={{
                  background: `${r.color}08`, border: `1px solid ${r.color}33`
                }}>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                    <span className="f-serif-black text-base" style={{ color: r.color, textShadow: `0 0 6px ${r.color}` }}>{r.label}</span>
                  </div>
                  <div className="f-cyber text-base font-bold tabular-nums">
                    {rings[r.key].done}/{rings[r.key].total}
                  </div>
                  <div className="f-cyber text-[8px] opacity-50 tracking-widest">{r.en}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 統計方格 */}
          <div className="grid grid-cols-4 gap-2 md:gap-3 lg:gap-4">
            {[
              { label: '連日', value: stats.streak, en: 'CHN', color: '#ff00aa' },
              { label: '總日', value: stats.totalDaysActive, en: 'TTL', color: '#ffaa00' },
              { label: '修為', value: stats.totalPracticeMinutes, en: 'MIN', color: '#ffee00' },
              { label: '息數', value: stats.totalBreathCycles, en: 'QI', color: '#00ffd4' },
            ].map((s, i) => (
              <div key={i} className="terminal-card cyber-border-small p-2 text-center" style={{ borderColor: `${s.color}40` }}>
                <div className="f-cyber text-2xl font-black tabular-nums" style={{ color: s.color, textShadow: `0 0 10px ${s.color}` }}>
                  {s.value}
                </div>
                <div className="f-sans-black text-[11px] mt-0.5">{s.label}</div>
                <div className="f-cyber text-[8px] opacity-40 tracking-widest">{s.en}</div>
              </div>
            ))}
          </div>

          {/* 七日柱狀 */}
          {stats.weeklyHistory && stats.weeklyHistory.length > 1 && (
            <div className="terminal-card cyber-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="f-cyber text-[9px] tracking-[0.3em] neon-cyan">◢ LOG.7D</div>
                  <div className="f-sans-black text-sm mt-0.5">七日記錄</div>
                </div>
                <div className="f-mono text-[9px] opacity-50">{glitchText.slice(0, 6)}</div>
              </div>
              <div className="flex items-end gap-1.5 h-24">
                {stats.weeklyHistory.slice(-7).map((day, i) => {
                  const d = new Date(day.date);
                  const dayName = ['日','一','二','三','四','五','六'][d.getDay()];
                  const color = day.percent >= 80 ? '#ff00aa' : day.percent >= 50 ? '#ffaa00' : '#00ffd4';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="f-cyber text-[9px] font-bold tabular-nums" style={{ color }}>
                        {day.percent}
                      </div>
                      <div className="w-full relative" style={{ 
                        height: `${Math.max(day.percent, 5)}%`,
                        minHeight: '4px',
                        background: `linear-gradient(180deg, ${color}, ${color}66)`,
                        boxShadow: `0 0 8px ${color}66`,
                        transition: 'height 0.6s ease-out'
                      }} />
                      <div className="f-serif-black text-[11px]">{dayName}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 當下 */}
          {currentSession && (
            <div className="terminal-card-active terminal-card cyber-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="f-serif-black text-6xl ink-glow-pink breathe-glow">
                    {currentSession.kanji}
                  </div>
                  <div>
                    <div className="f-cyber text-[9px] tracking-[0.3em] neon-pink cursor-blink">
                      ▶ RUNNING
                    </div>
                    <div className="f-sans-black text-lg mt-0.5">
                      {currentSession.title}
                    </div>
                    <div className="f-cyber text-[10px] opacity-70 mt-0.5">
                      {currentSession.code} · +{currentSession.xp} QI
                    </div>
                  </div>
                </div>
                <div className="f-cyber text-2xl tabular-nums neon-cyan-strong">
                  {currentSession.time}
                </div>
              </div>
            </div>
          )}
            </div>

            <div className="space-y-5">
          {/* 任務列 */}
          <div className="divider-cyber">
            <span className="f-cyber text-[10px] tracking-[0.4em] neon-cyan">
              ◢ <span className="f-sans-black" style={{ fontSize: '11px' }}>每日法門</span> · DAILY
            </span>
          </div>

          <div className="space-y-2">
            {schedule.map((s) => {
              const isDone = completed[s.id];
              const isExpanded = expanded === s.id;
              const isCurrent = currentSession?.id === s.id;
              const ringColor = s.ring === 'yang' ? '#ff00aa' : s.ring === 'yin' ? '#a78bfa' : '#00ffd4';

              return (
                <div key={s.id} className={`cyber-border relative transition-all ${isCurrent ? 'terminal-card-active' : 'terminal-card'} ${isDone ? 'opacity-50' : ''}`}
                  style={{ borderColor: isCurrent ? '#ff00aa' : `${ringColor}30` }}>
                  
                  {isCurrent && (
                    <div className="absolute -top-2 left-3 px-2 py-0.5 text-[9px] f-cyber tracking-widest z-10" style={{
                      background: '#ff00aa', color: '#0a0612', boxShadow: '0 0 10px rgba(255, 0, 170, 0.6)'
                    }}>
                      ◉ NOW
                    </div>
                  )}
                  
                  <div className="absolute top-0 bottom-0 left-0 w-1" style={{ 
                    background: ringColor, 
                    opacity: 0.8,
                    boxShadow: `0 0 8px ${ringColor}`
                  }} />
                  
                  <div className="p-4 pl-5 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : s.id)}>
                    {/* 時間 */}
                    <div className="shrink-0 flex flex-col items-center" style={{ minWidth: '42px' }}>
                      <div className="f-cyber text-xs tabular-nums neon-cyan font-bold">{s.time}</div>
                      <div className="w-px h-2 my-1" style={{ background: 'rgba(0, 255, 212, 0.3)' }} />
                      {s.duration > 0 && (
                        <div className="f-mono text-[9px] opacity-50">{s.duration}m</div>
                      )}
                    </div>

                    {/* 漢字 */}
                    <div className="shrink-0 w-14 flex flex-col items-center">
                      <div className="w-12 h-12 flex items-center justify-center relative cyber-border-small talisman" style={{
                        borderColor: `${ringColor}66`,
                      }}>
                        <span className="f-serif-black text-3xl" style={{
                          color: isDone ? ringColor : '#e8dfff',
                          textShadow: isDone ? `0 0 10px ${ringColor}, 0 0 20px ${ringColor}66` : 'none',
                          lineHeight: 1
                        }}>{s.kanji}</span>
                        {!isDone && (
                          <div className="absolute -bottom-1 -right-1 text-[8px] f-cyber px-1 tabular-nums font-bold" style={{
                            background: '#ffee00', color: '#0a0612', boxShadow: '0 0 6px rgba(255, 238, 0, 0.6)'
                          }}>
                            +{s.xp}
                          </div>
                        )}
                      </div>
                      <div className="f-cyber text-[8px] tracking-widest mt-1 opacity-60">{s.code}</div>
                    </div>

                    {/* 內容 */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="f-sans-black text-base">{s.title}</span>
                        {s.key && (
                          <span className="text-[9px] f-cyber px-1.5 py-0.5 font-bold" style={{
                            background: '#ffee00', color: '#0a0612', boxShadow: '0 0 6px rgba(255, 238, 0, 0.5)'
                          }}>KEY</span>
                        )}
                        {s.critical && (
                          <span className="text-[9px] f-cyber px-1.5 py-0.5 warning-pulse" style={{
                            background: '#ff00aa', color: '#0a0612', border: '1px solid #ff00aa'
                          }}>★</span>
                        )}
                      </div>
                      <div className="f-mono text-[10px] mb-1 opacity-50">{s.meridian}</div>
                      <div className="f-wenkai text-sm" style={{ color: '#b5a8d9' }}>{s.subtitle}</div>
                    </div>

                    <div onClick={(e) => { e.stopPropagation(); toggleComplete(s.id); }}
                      className={`cyber-checkbox shrink-0 ${isDone ? 'done' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pl-5 fade-in">
                      <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 255, 212, 0.3), transparent)' }} />
                      <div className="flex items-center gap-3 mb-3">
                        <span className="f-cyber text-[9px] tracking-[0.2em] neon-cyan">▸ META</span>
                        <span className="f-sans text-xs" style={{ color: ringColor }}>{s.meridian}</span>
                        <span className="f-cyber text-xs ml-auto neon-yellow font-bold">+{s.xp} QI</span>
                      </div>
                      <p className="f-wenkai text-[13px] leading-relaxed whitespace-pre-line mb-3" style={{ color: '#d0c5ee' }}>
                        {s.detail}
                      </p>
                      <div className="flex gap-2">
                        {s.timer && (
                          <button onClick={() => startTimer(s.timer, s.title)}
                            className="btn-neon flex-1 py-2.5 text-xs f-cyber cyber-border-small">
                            ▶ EXEC · {Math.floor(s.timer / 60)}m
                          </button>
                        )}
                        {s.hasBreath && (
                          <button onClick={() => { setActiveTab('breath'); setShowBreath(true); setBreathCount(0); }}
                            className="btn-neon-pink flex-1 py-2.5 text-xs f-cyber cyber-border-small">
                            ◐ BREATH
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 心法 */}
          <div className="divider-cyber mt-6">
            <span className="f-cyber text-[10px] tracking-[0.4em] neon-cyan">
              ◢ <span className="f-sans-black" style={{ fontSize: '11px' }}>心法</span> · CORE
            </span>
          </div>
          
          <div className="terminal-card cyber-border p-5 relative">
            <div className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center talisman cyber-border-small" style={{
              borderColor: '#ff00aa'
            }}>
              <span className="f-serif-black text-lg ink-glow-pink">傳</span>
            </div>
            <div className="f-cyber text-[10px] tracking-[0.3em] mb-3 neon-cyan">
              ◢ INIT.PHASE.01
            </div>
            <div className="space-y-2">
              {['起床吞津', '亥時前眠', '戒咖啡冰水'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="f-cyber text-xs neon-pink font-bold tabular-nums">0{i+1}.</span>
                  <span className="f-sans-black text-base">{item}</span>
                </div>
              ))}
            </div>
            <div className="h-px my-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 255, 212, 0.3), transparent)' }} />
            <p className="f-wenkai text-sm italic opacity-70">
              {'>'} 寧可少而精，勿多而亂。
            </p>
          </div>
            </div>
          </div>
        </div>
      )}

      {/* 吐納 TAB */}
      {activeTab === 'breath' && (
        <div className="px-4 sm:px-5 md:px-6 lg:px-8 py-5 pb-24 max-w-7xl mx-auto w-full">
          <div className="text-center mb-2">
            <div className="f-cyber text-[10px] tracking-[0.4em] neon-cyan">QI.BREATHING.PROTOCOL</div>
            <h2 className="f-serif-black text-5xl md:text-6xl lg:text-7xl tracking-widest mt-3 ink-glow-pink">上古煉氣</h2>
            <div className="f-wenkai text-sm mt-3 italic opacity-70">
              {'>'} 陰虛者淺試即可・不到極限
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5 mb-4">
            <div className="terminal-card cyber-border-small p-3 text-center">
              <div className="f-cyber text-[9px] tracking-[0.3em] neon-cyan">CURRENT</div>
              <div className="f-cyber text-4xl font-black tabular-nums mt-1 neon-cyan-strong">
                {String(breathCount).padStart(3, '0')}
              </div>
            </div>
            <div className="terminal-card cyber-border-small p-3 text-center">
              <div className="f-cyber text-[9px] tracking-[0.3em] neon-pink">TOTAL</div>
              <div className="f-cyber text-4xl font-black tabular-nums mt-1 neon-pink-strong">
                {String(stats.totalBreathCycles).padStart(4, '0')}
              </div>
            </div>
          </div>

          <div className="relative h-96 md:h-[28rem] lg:h-[32rem] flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] rounded-full transition-all duration-[4000ms] ease-in-out" style={{
                background: showBreath ? `radial-gradient(circle, ${breathLabels[breathPhase].color}55 0%, transparent 70%)` : 'radial-gradient(circle, rgba(0, 255, 212, 0.15) 0%, transparent 70%)',
                transform: showBreath ? `scale(${breathLabels[breathPhase].scale})` : 'scale(1)',
                filter: 'blur(20px)'
              }} />
            </div>

            <div className="absolute inset-0 flex items-center justify-center rotate-slow opacity-40">
              <svg width="340" height="340" viewBox="0 0 200 200">
                {baguaSymbols.map((s, i) => {
                  const angle = (i * 45 - 90) * Math.PI / 180;
                  const x = 100 + Math.cos(angle) * 88;
                  const y = 100 + Math.sin(angle) * 88;
                  return <text key={i} x={x} y={y} fontSize="10" fill="#00ffd4" textAnchor="middle" dominantBaseline="central" style={{ filter: 'drop-shadow(0 0 3px #00ffd4)' }}>{s}</text>;
                })}
              </svg>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="280" height="280" viewBox="0 0 200 200" className="transition-transform duration-[4000ms] ease-in-out"
                style={{ transform: showBreath ? `scale(${breathLabels[breathPhase].scale})` : 'scale(1)' }}>
                <circle cx="100" cy="100" r="90" fill="none"
                  stroke={showBreath ? breathLabels[breathPhase].color : '#00ffd4'}
                  strokeWidth="2" opacity="0.8"
                  style={{ filter: `drop-shadow(0 0 8px ${showBreath ? breathLabels[breathPhase].color : '#00ffd4'})` }}/>
                <circle cx="100" cy="100" r="75" fill="none"
                  stroke={showBreath ? breathLabels[breathPhase].color : '#00ffd4'}
                  strokeWidth="1" opacity="0.4" strokeDasharray="3,3"/>
                <circle cx="100" cy="100" r="60" fill="none"
                  stroke={showBreath ? breathLabels[breathPhase].color : '#00ffd4'}
                  strokeWidth="1" opacity="0.2"/>
              </svg>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="f-serif-black text-8xl md:text-9xl mb-2" style={{
                color: showBreath ? breathLabels[breathPhase].color : '#00ffd4',
                textShadow: `0 0 20px ${showBreath ? breathLabels[breathPhase].color : '#00ffd4'}, 0 0 40px ${showBreath ? breathLabels[breathPhase].color : '#00ffd4'}88, 2px 2px 0 rgba(10, 6, 18, 0.8)`,
                lineHeight: 1
              }}>
                {showBreath ? breathLabels[breathPhase].cn : '氣'}
              </div>
              <div className="f-cyber text-sm tracking-[0.4em] font-bold" style={{
                color: showBreath ? breathLabels[breathPhase].color : '#00ffd4',
                textShadow: `0 0 8px ${showBreath ? breathLabels[breathPhase].color : '#00ffd4'}`
              }}>
                {showBreath ? breathLabels[breathPhase].en : 'IDLE'}
              </div>
            </div>
          </div>

          <button onClick={() => { setShowBreath(!showBreath); if (!showBreath) setBreathCount(0); }}
            className={`w-full py-4 f-cyber tracking-[0.3em] cyber-border-small text-sm font-bold ${showBreath ? 'btn-neon-pink' : 'btn-neon'}`}>
            {showBreath ? '◐ TERMINATE' : '▶ INITIATE.SEQUENCE'}
          </button>

          <div className="mt-6 terminal-card cyber-border p-4">
            <div className="f-cyber text-[10px] tracking-[0.3em] mb-3 neon-cyan">
              ◢ <span className="f-sans-black" style={{ fontSize: '11px' }}>四相循環</span> · 4.PHASES
            </div>
            <div className="space-y-2">
              {[
                { cn: '吸', en: 'INHALE', detail: '四秒・八分滿', color: '#00ffd4' },
                { cn: '沉', en: 'SINK', detail: '四秒・沉至鎖骨', color: '#ffaa00' },
                { cn: '吐', en: 'EXHALE', detail: '四秒・緩緩吐', color: '#ff00aa' },
                { cn: '空', en: 'VOID', detail: '四秒・自然停', color: '#a78bfa' },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 cyber-border-small" style={{
                  background: `${p.color}08`, border: `1px solid ${p.color}22`
                }}>
                  <div className="f-serif-black text-4xl w-12 h-12 flex items-center justify-center" style={{
                    color: p.color,
                    textShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}66`,
                    lineHeight: 1
                  }}>{p.cn}</div>
                  <div className="flex-1">
                    <div className="f-sans-black text-sm">第{['一','二','三','四'][i]}相 · {p.cn}</div>
                    <div className="f-cyber text-[9px] opacity-60 tracking-widest">{p.en}</div>
                  </div>
                  <div className="f-wenkai text-xs opacity-80">{p.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 上古傳承 */}
          <div className="mt-6 terminal-card cyber-border p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              background: 'radial-gradient(circle at 80% 20%, rgba(255, 0, 170, 0.6), transparent 50%)'
            }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="f-cyber text-[10px] tracking-[0.3em] neon-pink">
                  ◢ <span className="f-sans-black" style={{ fontSize: '11px' }}>上古傳承</span> · LINEAGE.LOG
                </div>
                <div className="f-mono text-[9px] opacity-40">{glitchText.slice(0, 6)}</div>
              </div>
              
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-12 h-12 flex items-center justify-center talisman cyber-border-small" style={{
                  borderColor: '#ff00aa'
                }}>
                  <span className="f-serif-black text-3xl ink-glow-pink">炁</span>
                </div>
                <div className="flex-1">
                  <div className="f-sans-black text-lg">上古煉氣呼吸法</div>
                  <div className="f-wenkai text-xs opacity-70 mt-0.5">
                    出自《黃帝內經·素問篇》上古天真論「呼吸精氣，獨立守神」一語，返還先天一氣為要義。
                  </div>
                </div>
              </div>

              <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 0, 170, 0.3), transparent)' }} />

              <div className="f-cyber text-[10px] tracking-[0.3em] mb-3 neon-cyan">
                ▸ 三大要旨 · CORE.PRINCIPLES
              </div>
              
              <div className="space-y-3">
                {[
                  { 
                    num: '01', kanji: '返', title: '返先天一氣',
                    detail: '後天呼吸皆入肺，浮於胸膈；上古煉氣則直貫丹田，返歸先天一氣。一氣既充，五臟自調，心方能安然喜樂。'
                  },
                  { 
                    num: '02', kanji: '凝', title: '凝神入炁穴',
                    detail: '不主張意守觀察等人為之修行，只以呼吸方法本身為要。氣到則神自凝，衛氣充沛肩膀剛鬆，身體可健康長壽百病不生。'
                  },
                  { 
                    num: '03', kanji: '順', title: '順其自然',
                    detail: '上古煉氣為自然法，無須嚴格遵循步驟，將心念放在呼吸本身，無需額外觀想。循序漸進，以突破自我為根本。'
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 cyber-border-small" style={{
                    background: 'rgba(255, 0, 170, 0.04)', border: '1px solid rgba(255, 0, 170, 0.15)'
                  }}>
                    <div className="f-cyber text-xs neon-pink font-bold tabular-nums shrink-0">{item.num}</div>
                    <div className="f-serif-black text-3xl shrink-0 ink-glow-pink" style={{ lineHeight: 1 }}>{item.kanji}</div>
                    <div className="flex-1">
                      <div className="f-sans-black text-sm mb-1">{item.title}</div>
                      <div className="f-wenkai text-xs leading-relaxed opacity-80">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 古法 vs 周天 對比 */}
          <div className="mt-4 terminal-card cyber-border p-5">
            <div className="f-cyber text-[10px] tracking-[0.3em] mb-4 neon-cyan">
              ◢ <span className="f-sans-black" style={{ fontSize: '11px' }}>古法・周天</span> · COMPARE
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="cyber-border-small p-3 text-center" style={{
                background: 'rgba(0, 255, 212, 0.05)', border: '1px solid rgba(0, 255, 212, 0.3)'
              }}>
                <div className="f-serif-black text-4xl ink-glow-cyan mb-2" style={{ lineHeight: 1 }}>古</div>
                <div className="f-sans-black text-sm">上古煉氣法</div>
                <div className="f-cyber text-[9px] tracking-widest opacity-60 mt-1">ANCIENT.METHOD</div>
              </div>
              <div className="cyber-border-small p-3 text-center" style={{
                background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.3)'
              }}>
                <div className="f-serif-black text-4xl mb-2" style={{ 
                  color: '#a78bfa',
                  textShadow: '0 0 10px rgba(167, 139, 250, 0.8), 0 0 20px rgba(167, 139, 250, 0.5)',
                  lineHeight: 1 
                }}>周</div>
                <div className="f-sans-black text-sm">小周天功</div>
                <div className="f-cyber text-[9px] tracking-widest opacity-60 mt-1">ZHOU.TIAN</div>
              </div>
            </div>

            <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
              {[
                { 
                  aspect: '修行根本', en: 'ROOT',
                  ancient: '返先天一氣，自然而然', 
                  zhou: '意守丹田，運氣走任督'
                },
                { 
                  aspect: '心法要訣', en: 'METHOD',
                  ancient: '專注呼吸方法本身', 
                  zhou: '意念導引，觀想走經'
                },
                { 
                  aspect: '氣機路徑', en: 'PATH',
                  ancient: '氣沉丹田，無特定路線', 
                  zhou: '尾閭→夾脊→玉枕→任脈'
                },
                { 
                  aspect: '風險', en: 'RISK',
                  ancient: '淺試即可，不到極限', 
                  zhou: '意念過重易走火入魔'
                },
                { 
                  aspect: '入門難度', en: 'ENTRY',
                  ancient: '低·自然法不需導引', 
                  zhou: '高·需明師指點三關'
                },
                { 
                  aspect: '適合族群', en: 'USER',
                  ancient: '一般養生、初學者', 
                  zhou: '已築基、有師承者'
                },
              ].map((row, i) => (
                <div key={i} className="cyber-border-small p-3" style={{
                  background: 'rgba(20, 10, 35, 0.4)', border: '1px solid rgba(0, 255, 212, 0.1)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="f-sans-black text-xs neon-cyan">{row.aspect}</span>
                    <span className="f-cyber text-[8px] tracking-widest opacity-40">{row.en}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="f-wenkai text-xs" style={{ color: '#00ffd4' }}>
                      <span className="opacity-60 mr-1 f-cyber">◯</span>
                      {row.ancient}
                    </div>
                    <div className="f-wenkai text-xs" style={{ color: '#a78bfa' }}>
                      <span className="opacity-60 mr-1 f-cyber">◐</span>
                      {row.zhou}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 255, 212, 0.3), transparent)' }} />

            <div className="p-3 cyber-border-small" style={{
              background: 'rgba(255, 238, 0, 0.05)', border: '1px solid rgba(255, 238, 0, 0.25)'
            }}>
              <div className="f-cyber text-[9px] tracking-[0.3em] mb-2 neon-yellow">▸ 結論 · VERDICT</div>
              <p className="f-wenkai text-xs leading-relaxed" style={{ color: '#e8dfff' }}>
                上古煉氣法以「返璞歸真」為要義，不主張意守觀察，不追求氣機走向，只管呼吸本身。此法勝在安全自然，陰虛者、初學者皆可修持。周天功法精深玄妙，然非明師親授切勿妄練，否則易生偏差。
                <span className="neon-yellow">修行之道，寧簡而正，勿繁而亂。</span>
              </p>
            </div>
          </div>

          {/* 五大功效 */}
          <div className="mt-4 terminal-card cyber-border p-5">
            <div className="f-cyber text-[10px] tracking-[0.3em] mb-4 neon-cyan">
              ◢ <span className="f-sans-black" style={{ fontSize: '11px' }}>煉氣之利</span> · BENEFITS
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {[
                { kanji: '健', title: '百病不生', en: 'HEALTH', color: '#00ffd4',
                  desc: '營氣充沛五臟調和' },
                { kanji: '安', title: '心安神寧', en: 'CALM', color: '#a78bfa',
                  desc: '衛氣充沛喜樂自生' },
                { kanji: '壽', title: '長壽百年', en: 'LONG', color: '#ffee00',
                  desc: '先天一氣返本還原' },
                { kanji: '清', title: '排毒療疾', en: 'DETOX', color: '#ff00aa',
                  desc: '體內濕毒汙濁逐步排出' },
                { kanji: '明', title: '神智清明', en: 'CLEAR', color: '#ffaa00',
                  desc: '呼吸深長思慮自清' },
                { kanji: '剛', title: '筋骨剛強', en: 'STRONG', color: '#00ffd4',
                  desc: '肺為相君腎為臣' },
              ].map((b, i) => (
                <div key={i} className="p-3 cyber-border-small" style={{
                  background: `${b.color}08`, border: `1px solid ${b.color}33`
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="f-serif-black text-3xl" style={{
                      color: b.color,
                      textShadow: `0 0 8px ${b.color}, 0 0 16px ${b.color}66`,
                      lineHeight: 1
                    }}>{b.kanji}</span>
                    <div>
                      <div className="f-sans-black text-xs" style={{ color: b.color }}>{b.title}</div>
                      <div className="f-cyber text-[8px] opacity-50 tracking-widest">{b.en}</div>
                    </div>
                  </div>
                  <div className="f-wenkai text-[11px] opacity-80 leading-tight">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 修行階段 */}
          <div className="mt-4 terminal-card cyber-border p-5">
            <div className="f-cyber text-[10px] tracking-[0.3em] mb-4 neon-cyan">
              ◢ <span className="f-sans-black" style={{ fontSize: '11px' }}>修行效驗</span> · PROGRESS
            </div>
            <div className="f-wenkai text-xs opacity-70 mb-4">
              {'>'} 上古煉氣初期效驗為療疾排毒，體內濕毒以及汙濁之氣會逐步排出，皆數正常現象
            </div>

            <div className="relative pl-6 space-y-4">
              <div className="absolute top-2 bottom-2 left-[11px] w-px" style={{
                background: 'linear-gradient(180deg, #00ffd4, #ffaa00, #ff00aa, #ffee00)'
              }} />
              
              {[
                { stage: 'I', phase: '初階', sign: '打嗝・暖嗽・放屁・出汗', desc: '體內濕毒汙穢之氣排出', color: '#00ffd4' },
                { stage: 'II', phase: '中階', sign: '津液湧現・口甘如蜜', desc: '脾胃得養，津液自生', color: '#ffaa00' },
                { stage: 'III', phase: '進階', sign: '丹田溫暖・小腹如爐', desc: '先天一氣開始凝聚', color: '#ff00aa' },
                { stage: 'IV', phase: '大成', sign: '骨節清脆・毛髮潤澤', desc: '五臟調和百病不生', color: '#ffee00' },
              ].map((s, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[22px] w-6 h-6 flex items-center justify-center cyber-border-small f-cyber text-[9px] font-bold" style={{
                    background: '#0a0612', color: s.color, border: `1px solid ${s.color}`,
                    boxShadow: `0 0 8px ${s.color}66`
                  }}>{s.stage}</div>
                  <div className="ml-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="f-sans-black text-sm" style={{ color: s.color }}>{s.phase}</span>
                      <span className="f-cyber text-[9px] opacity-50 tracking-widest">PHASE.{s.stage}</span>
                    </div>
                    <div className="f-wenkai text-xs mb-1" style={{ color: s.color, opacity: 0.9 }}>
                      ◢ {s.sign}
                    </div>
                    <div className="f-wenkai text-[11px] opacity-70">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 cyber-border p-4 warning-pulse" style={{
            background: 'rgba(255, 0, 170, 0.05)', border: '1px solid rgba(255, 0, 170, 0.3)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center f-serif-black text-xl" style={{
                background: '#ff00aa', color: '#0a0612'
              }}>注</div>
              <div className="f-sans-black text-base neon-pink">陰虛者注意 · WARNING</div>
            </div>
            <div className="space-y-1.5 mt-3">
              {['絕對不憋氣到極限', '第一次吸氣不要太滿', '心煩、口更乾立刻停止', '月經、感冒、疲勞時暫停'].map((item, i) => (
                <div key={i} className="flex items-start gap-2 f-wenkai text-sm" style={{ color: '#ff9ed5' }}>
                  <span className="f-cyber" style={{ color: '#ff00aa' }}>{'>'}</span><span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 心覺 TAB */}
      {activeTab === 'log' && (
        <div className="px-4 sm:px-5 md:px-6 lg:px-8 py-5 pb-24 space-y-5 max-w-7xl mx-auto w-full">
          <div>
            <div className="f-cyber text-[10px] tracking-[0.4em] neon-cyan">DAILY.OBSERVE.LOG</div>
            <h2 className="f-serif-black text-5xl md:text-6xl lg:text-7xl tracking-widest mt-3 ink-glow-pink">心覺</h2>
            <div className="f-wenkai text-sm mt-3 italic opacity-70">
              {'>'} 每夜一刻，記下身心之變
            </div>
          </div>

          {[
            { key: 'drymouth', kanji: '渴', en: 'THIRST', label: '半夜口乾',
              options: [{ v: 0, l: '無', d: '一覺到天亮' },{ v: 1, l: '微', d: '醒來潤一下' },{ v: 2, l: '中', d: '需要喝水' },{ v: 3, l: '甚', d: '大量喝水仍乾' }] },
            { key: 'energy', kanji: '氣', en: 'ENERGY', label: '白天精神',
              options: [{ v: 3, l: '盈', d: '整天精神好' },{ v: 2, l: '可', d: '偶爾疲勞' },{ v: 1, l: '倦', d: '常需咖啡' },{ v: 0, l: '竭', d: '一直想睡' }] },
            { key: 'sleep', kanji: '眠', en: 'SLEEP', label: '睡眠品質',
              options: [{ v: 3, l: '深', d: '一覺到天亮' },{ v: 2, l: '可', d: '偶爾醒來' },{ v: 1, l: '淺', d: '多夢易醒' },{ v: 0, l: '失', d: '難入睡早醒' }] }
          ].map(item => (
            <div key={item.key} className="terminal-card cyber-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 flex items-center justify-center talisman cyber-border-small" style={{
                  borderColor: '#00ffd4'
                }}>
                  <span className="f-serif-black text-3xl ink-glow-cyan">{item.kanji}</span>
                </div>
                <div>
                  <div className="f-sans-black text-lg">{item.label}</div>
                  <div className="f-cyber text-[10px] tracking-widest opacity-60">{item.en}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 md:gap-3 lg:gap-4">
                {item.options.map(opt => {
                  const isSelected = todayLog[item.key] === opt.v;
                  return (
                    <button key={opt.v} onClick={() => setTodayLog(prev => ({ ...prev, [item.key]: opt.v }))}
                      className="p-3 cyber-border-small transition-all relative" style={{
                        background: isSelected ? 'linear-gradient(135deg, rgba(0, 255, 212, 0.2), rgba(0, 255, 212, 0.05))' : 'rgba(20, 10, 35, 0.4)',
                        border: isSelected ? '1px solid #00ffd4' : '1px solid rgba(0, 255, 212, 0.15)',
                        boxShadow: isSelected ? '0 0 12px rgba(0, 255, 212, 0.4)' : 'none'
                      }}>
                      <div className="f-serif-black text-3xl mb-1" style={{
                        color: isSelected ? '#00ffd4' : '#e8dfff',
                        textShadow: isSelected ? '0 0 8px rgba(0, 255, 212, 0.8)' : 'none',
                        lineHeight: 1
                      }}>{opt.l}</div>
                      <div className="f-wenkai text-[10px] opacity-70 mt-1">{opt.d}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="terminal-card cyber-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 flex items-center justify-center talisman cyber-border-small" style={{ borderColor: '#00ffd4' }}>
                <span className="f-serif-black text-3xl ink-glow-cyan">舌</span>
              </div>
              <div>
                <div className="f-sans-black text-lg">舌象・備註</div>
                <div className="f-cyber text-[10px] tracking-widest opacity-60">TONGUE.DIAG</div>
              </div>
            </div>
            <textarea value={todayLog.notes} onChange={(e) => setTodayLog(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="> 舌淡紅薄白苔、無齒痕、邊緣略紅..."
              className="w-full p-3 text-sm resize-none focus:outline-none cyber-border-small f-wenkai" style={{
                background: 'rgba(10, 6, 18, 0.6)', border: '1px solid rgba(0, 255, 212, 0.2)',
                color: '#e8dfff'
              }} rows={3} />
          </div>

          <div className="cyber-border p-5 relative" style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 212, 0.05), rgba(167, 139, 250, 0.05))',
            border: '1px solid rgba(0, 255, 212, 0.3)'
          }}>
            <div className="f-cyber text-[10px] tracking-[0.3em] mb-2 neon-cyan">◢ 3.MONTH.OBSERVATION</div>
            <p className="f-wenkai text-sm leading-relaxed mb-2" style={{ color: '#d0c5ee' }}>
              陰虛調理慢工出細活。每週對照三指標，三月若無改善建議找中醫師把脈辨證。
            </p>
            <div className="h-px my-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 255, 212, 0.3), transparent)' }} />
            <p className="f-wenkai text-sm italic neon-cyan">
              {'>'} 緩而不殆，確而行之
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
