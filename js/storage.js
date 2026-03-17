/* =========================================================
   storage.js — Persistence layer for Encapsulate
   localStorage  → progress, settings, review data
   sessionStorage → API key ONLY
   ========================================================= */

const Storage = (() => {
  const PREFIX = 'enc_';
  const VERSION = '1.0.0';

  /* ---------- helpers ---------- */
  const _key = (k) => PREFIX + k;

  const _get = (store, key) => {
    try {
      const raw = store.getItem(_key(key));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const _set = (store, key, val) => {
    try {
      store.setItem(_key(key), JSON.stringify(val));
      return true;
    } catch { return false; }
  };

  const _remove = (store, key) => {
    try { store.removeItem(_key(key)); } catch { /* noop */ }
  };

  /* ---------- localStorage wrappers ---------- */
  const get     = (key)      => _get(localStorage, key);
  const set     = (key, val) => _set(localStorage, key, val);
  const remove  = (key)      => _remove(localStorage, key);

  /* ---------- sessionStorage (API key only) ---------- */
  const getApiKey = () => {
    try { return sessionStorage.getItem(_key('api_key')) || ''; }
    catch { return ''; }
  };
  const setApiKey = (k) => {
    try { sessionStorage.setItem(_key('api_key'), k); } catch { /* noop */ }
  };
  const clearApiKey = () => {
    try { sessionStorage.removeItem(_key('api_key')); } catch { /* noop */ }
  };

  /* ---------- default state ---------- */
  const DEFAULT_PROGRESS = {
    version: VERSION,
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    completedLessons: [],
    completedQuizzes: [],
    completedDrills: [],
    masteryMap: {},       // { su1: 0.0 … su6: 0.0 }
    weakTopics: [],
    wrongAnswers: [],
    bookmarks: [],
    notes: [],
    reviewHistory: [],
    attempts: {},
    unlockedBadges: [],
    lastVisited: null,    // { type, id }
    guidedIndex: 0        // position in guided path
  };

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    fontSize: 'medium',
    strictness: 'tutor',      // tutor | guided | exam | brutal
    aiMarking: true,
    reducedMotion: false,
    mode: 'guided'             // guided | explore
  };

  /* ---------- init (first run) ---------- */
  const init = () => {
    if (!get('progress')) set('progress', { ...DEFAULT_PROGRESS });
    if (!get('settings')) set('settings', { ...DEFAULT_SETTINGS });
  };

  /* ---------- convenience ---------- */
  const getProgress = ()      => get('progress') || { ...DEFAULT_PROGRESS };
  const setProgress = (p)     => set('progress', p);
  const getSettings = ()      => get('settings') || { ...DEFAULT_SETTINGS };
  const setSettings = (s)     => set('settings', s);

  const updateProgress = (fn) => {
    const p = getProgress();
    fn(p);
    setProgress(p);
    return p;
  };

  const updateSettings = (fn) => {
    const s = getSettings();
    fn(s);
    setSettings(s);
    return s;
  };

  /* ---------- XP / level helpers ---------- */
  const XP_PER_LEVEL = 100;

  const addXP = (amount) => {
    return updateProgress(p => {
      p.xp += amount;
      p.level = Math.floor(p.xp / XP_PER_LEVEL) + 1;
    });
  };

  /* ---------- streak ---------- */
  const updateStreak = () => {
    return updateProgress(p => {
      const today = new Date().toDateString();
      if (p.lastActiveDate === today) return;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      p.streak = (p.lastActiveDate === yesterday) ? p.streak + 1 : 1;
      p.lastActiveDate = today;
    });
  };

  /* ---------- export / import ---------- */
  const exportData = () => {
    // Gather all lesson positions
    const lessonPositions = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX + 'lesson_pos_') || key.startsWith(PREFIX + 'code_')) {
        lessonPositions[key.replace(PREFIX, '')] = _get(localStorage, key.replace(PREFIX, ''));
      }
    }

    return {
      version: VERSION,
      exported: new Date().toISOString(),
      progress: getProgress(),
      settings: getSettings(),
      lessonPositions
    };
  };

  const importData = (json) => {
    // Shape validation
    if (!json || typeof json !== 'object') throw new Error('Not a valid JSON object');
    if (!json.progress || typeof json.progress !== 'object') throw new Error('Missing or invalid progress data');

    // Validate critical fields exist (merge with defaults for any missing)
    const merged = { ...DEFAULT_PROGRESS };
    for (const key of Object.keys(DEFAULT_PROGRESS)) {
      if (json.progress[key] !== undefined) {
        merged[key] = json.progress[key];
      }
    }
    // Preserve any extra fields from newer versions
    for (const key of Object.keys(json.progress)) {
      if (!(key in merged)) merged[key] = json.progress[key];
    }

    // Validate types of critical arrays
    if (!Array.isArray(merged.completedLessons)) merged.completedLessons = [];
    if (!Array.isArray(merged.completedQuizzes)) merged.completedQuizzes = [];
    if (!Array.isArray(merged.completedDrills)) merged.completedDrills = [];
    if (!Array.isArray(merged.weakTopics)) merged.weakTopics = [];
    if (!Array.isArray(merged.wrongAnswers)) merged.wrongAnswers = [];
    if (!Array.isArray(merged.reviewHistory)) merged.reviewHistory = [];
    if (typeof merged.masteryMap !== 'object' || merged.masteryMap === null) merged.masteryMap = {};
    if (typeof merged.attempts !== 'object' || merged.attempts === null) merged.attempts = {};
    if (typeof merged.xp !== 'number') merged.xp = 0;
    if (typeof merged.level !== 'number') merged.level = Math.floor(merged.xp / XP_PER_LEVEL) + 1;

    setProgress(merged);

    // Import settings (excluding API key)
    if (json.settings && typeof json.settings === 'object') {
      const safeSettings = { ...DEFAULT_SETTINGS };
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (json.settings[key] !== undefined) safeSettings[key] = json.settings[key];
      }
      setSettings(safeSettings);
    }

    // Restore lesson positions and code drafts
    if (json.lessonPositions && typeof json.lessonPositions === 'object') {
      for (const [key, val] of Object.entries(json.lessonPositions)) {
        set(key, val);
      }
    }

    return true;
  };

  /* ---------- full reset ---------- */
  const resetAll = () => {
    set('progress', { ...DEFAULT_PROGRESS });
    set('settings', { ...DEFAULT_SETTINGS });
    clearApiKey();
  };

  /* ---------- public API ---------- */
  return {
    init, get, set, remove,
    getApiKey, setApiKey, clearApiKey,
    getProgress, setProgress, updateProgress,
    getSettings, setSettings, updateSettings,
    addXP, updateStreak,
    exportData, importData, resetAll,
    DEFAULT_PROGRESS, DEFAULT_SETTINGS, VERSION
  };
})();
