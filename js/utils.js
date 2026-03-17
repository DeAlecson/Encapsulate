/* =========================================================
   utils.js — Shared helpers for Encapsulate
   ========================================================= */

const Utils = (() => {
  /* ---------- DOM helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    }
    return node;
  };

  /* ---------- Toast ---------- */
  let toastTimer = null;
  const toast = (msg, type = 'info', duration = 3000) => {
    const container = $('#toast-container');
    if (!container) return;
    container.textContent = msg;
    container.className = `toast toast--${type} toast--visible`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      container.classList.remove('toast--visible');
    }, duration);
  };

  /* ---------- XP formatting ---------- */
  const formatXP = (xp) => {
    if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
    return xp.toString();
  };

  const levelFromXP = (xp) => Math.floor(xp / 100) + 1;
  const xpInLevel = (xp) => xp % 100;

  /* ---------- Date helpers ---------- */
  const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();
  const daysAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 86400000);
  };

  /* ---------- Strictness labels ---------- */
  const STRICTNESS = {
    tutor:  { label: 'Tutor',  icon: '🎓', desc: 'Forgiving, explains step by step' },
    guided: { label: 'Guided', icon: '🧭', desc: 'Helpful but expects more accuracy' },
    exam:   { label: 'Exam',   icon: '📝', desc: 'Stricter, closer to real marking' },
    brutal: { label: 'Brutal', icon: '💀', desc: 'Concise, strict, no mercy' }
  };

  /* ---------- Debounce ---------- */
  const debounce = (fn, ms = 300) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  /* ---------- Escape HTML ---------- */
  const escapeHTML = (str) => {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  return { $, $$, el, toast, formatXP, levelFromXP, xpInLevel, isToday, daysAgo, STRICTNESS, debounce, escapeHTML };
})();
