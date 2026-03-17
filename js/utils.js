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

  /* ---------- Markdown to HTML (safe) ---------- */
  /* Extracts code blocks BEFORE escaping so code stays clean */
  const markdownToHTML = (text) => {
    if (!text) return '';

    // 1. Extract fenced code blocks into placeholders
    const codeBlocks = [];
    let processed = text.replace(/```python\n([\s\S]*?)```/g, (_, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: 'python', code: code.trim() });
      return `\x00CODEBLOCK_${idx}\x00`;
    });
    processed = processed.replace(/```([\s\S]*?)```/g, (_, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: '', code: code.trim() });
      return `\x00CODEBLOCK_${idx}\x00`;
    });

    // 2. Extract inline code into placeholders
    const inlineCodes = [];
    processed = processed.replace(/`([^`]+)`/g, (_, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(code);
      return `\x00INLINE_${idx}\x00`;
    });

    // 3. Now escape the prose (code is safely in placeholders)
    let html = escapeHTML(processed);

    // 4. Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 5. Paragraphs and line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';

    // 6. Restore code blocks (content was never escaped)
    for (let i = 0; i < codeBlocks.length; i++) {
      const { code } = codeBlocks[i];
      const placeholder = `\x00CODEBLOCK_${i}\x00`;
      // The placeholder may have been wrapped in <p>/<br> tags — clean that up
      const escapedPlaceholder = escapeHTML(placeholder);
      const codeHTML = `<pre class="code-block"><code>${escapeHTML(code)}</code></pre>`;
      html = html.split(escapedPlaceholder).join(codeHTML);
    }

    // 7. Restore inline code
    for (let i = 0; i < inlineCodes.length; i++) {
      const placeholder = `\x00INLINE_${i}\x00`;
      const escapedPlaceholder = escapeHTML(placeholder);
      const codeHTML = `<code class="inline-code">${escapeHTML(inlineCodes[i])}</code>`;
      html = html.split(escapedPlaceholder).join(codeHTML);
    }

    // 8. Clean up empty paragraph tags around code blocks
    html = html.replace(/<p>\s*(<pre[^>]*>)/g, '$1');
    html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
    html = html.replace(/<br>\s*(<pre[^>]*>)/g, '$1');
    html = html.replace(/(<\/pre>)\s*<br>/g, '$1');

    return html;
  };

  return { $, $$, el, toast, formatXP, levelFromXP, xpInLevel, isToday, daysAgo, STRICTNESS, debounce, escapeHTML, markdownToHTML };
})();
