/* =========================================================
   mock-engine.js — Mock Exam Arena for Encapsulate
   Modes: quick (10 random), timed (15 in 20min), full (all), weak topics
   ========================================================= */

const MockEngine = (() => {
  const { $, escapeHTML, toast } = Utils;

  let _questions = [];
  let _currentIdx = 0;
  let _answers = [];
  let _mode = 'quick';
  let _timerInterval = null;
  let _timeLeft = 0;
  let _startTime = 0;

  const MODES = {
    quick: { label: 'Quick Fire', count: 10, timeLimit: 0 },
    timed: { label: 'Timed Mock', count: 15, timeLimit: 20 * 60 },
    full:  { label: 'Full Mock',  count: 999, timeLimit: 0 },
    weak:  { label: 'Weak Topics', count: 15, timeLimit: 0 }
  };

  /* ---------- load all quiz banks ---------- */
  const loadAllQuestions = async () => {
    const unitIds = ['su1','su2','su3','su4','su5','su6'];
    const all = [];
    for (const id of unitIds) {
      try {
        const resp = await fetch(`./data/quizzes/${id}_quiz.json`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.questions) {
            for (const q of data.questions) {
              all.push({ ...q, unitId: id });
            }
          }
        }
      } catch { /* skip */ }
    }
    return all;
  };

  /* ---------- shuffle array ---------- */
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- start a mock ---------- */
  const start = async (mode) => {
    const main = $('#main-content');
    main.innerHTML = '<div class="loading">Building your mock exam...</div>';

    _mode = mode;
    const config = MODES[mode] || MODES.quick;

    const allQ = await loadAllQuestions();
    if (allQ.length === 0) {
      main.innerHTML = `<div class="empty-state"><span class="empty-state__icon">📝</span><h1 class="empty-state__title">No questions available</h1><p class="empty-state__desc">Complete some quizzes first.</p><button class="btn btn--secondary" onclick="Router.navigate('/mock')">← Back</button></div>`;
      return;
    }

    // Pick questions based on mode
    if (mode === 'weak') {
      const p = Storage.getProgress();
      const weakConcepts = new Set((p.weakTopics || []).map(t => t.concept.toLowerCase()));
      if (weakConcepts.size === 0) {
        main.innerHTML = `<div class="empty-state"><span class="empty-state__icon">🎯</span><h1 class="empty-state__title">No weak topics yet</h1><p class="empty-state__desc">Take some quizzes first so we know what to focus on.</p><button class="btn btn--secondary" onclick="Router.navigate('/mock')">← Back</button></div>`;
        return;
      }
      const weakQ = allQ.filter(q => weakConcepts.has(q.concept.toLowerCase()));
      const filler = allQ.filter(q => !weakConcepts.has(q.concept.toLowerCase()));
      _questions = shuffle([...weakQ, ...shuffle(filler).slice(0, Math.max(0, config.count - weakQ.length))]).slice(0, config.count);
    } else {
      _questions = shuffle(allQ).slice(0, Math.min(config.count, allQ.length));
    }

    _currentIdx = 0;
    _answers = new Array(_questions.length).fill(null);
    _startTime = Date.now();

    // Start timer if timed mode
    if (config.timeLimit > 0) {
      _timeLeft = config.timeLimit;
      clearInterval(_timerInterval);
      _timerInterval = setInterval(() => {
        _timeLeft--;
        const timerEl = $('#mock-timer');
        if (timerEl) timerEl.textContent = formatTime(_timeLeft);
        if (_timeLeft <= 0) {
          clearInterval(_timerInterval);
          showResults();
        }
      }, 1000);
    }

    renderQuestion();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /* ---------- render question ---------- */
  const renderQuestion = () => {
    const main = $('#main-content');
    const q = _questions[_currentIdx];
    const total = _questions.length;
    const pct = Math.round(((_currentIdx + 1) / total) * 100);
    const answered = _answers[_currentIdx] !== null;
    const config = MODES[_mode];

    main.innerHTML = `
      <div class="quiz-view">
        <div class="mock-bar">
          <button class="btn btn--ghost btn--small" onclick="MockEngine.confirmQuit()">✕ Quit</button>
          <span class="mock-bar__label">${config.label}</span>
          <span class="mock-bar__counter">${_currentIdx + 1} / ${total}</span>
          ${config.timeLimit > 0 ? `<span class="mock-bar__timer ${_timeLeft < 120 ? 'mock-bar__timer--warn' : ''}" id="mock-timer">${formatTime(_timeLeft)}</span>` : ''}
        </div>

        <div class="lesson-progress"><div class="lesson-progress__fill" style="width:${pct}%"></div></div>

        <div class="quiz-card">
          <div class="mock-q-meta">
            <span class="mock-q-meta__unit" style="--unit-color:${getUnitColor(q.unitId)}">${(q.unitId || '').toUpperCase()}</span>
            <span class="mock-q-meta__concept">${escapeHTML(q.concept)}</span>
          </div>
          <div class="quiz-card__prompt">${Utils.markdownToHTML(q.prompt.replace(/\\n/g, '\n'))}</div>

          <div class="checkpoint__choices" id="mock-choices">
            ${q.choices.map((c, i) => `
              <button class="choice-btn ${answered ? (i === q.answer ? 'choice-btn--correct' : (i === _answers[_currentIdx] ? 'choice-btn--wrong' : 'choice-btn--dim')) : ''}"
                      data-index="${i}" ${answered ? 'disabled' : ''}>
                <span class="choice-btn__letter">${String.fromCharCode(65 + i)}</span>
                <span class="choice-btn__text">${escapeHTML(c).replace(/\\n/g, '<br>')}</span>
              </button>
            `).join('')}
          </div>

          ${answered ? `
            <div class="checkpoint__feedback ${_answers[_currentIdx] === q.answer ? 'checkpoint__feedback--correct' : 'checkpoint__feedback--wrong'}">
              ${_answers[_currentIdx] === q.answer ? '✓ Correct!' : '✗ Not quite.'}
              <p>${escapeHTML(q.explanation)}</p>
            </div>
          ` : ''}
        </div>

        <div class="lesson-nav">
          <button class="btn btn--secondary" id="mock-prev" ${_currentIdx === 0 ? 'disabled' : ''}>← Prev</button>
          ${_currentIdx === total - 1 ? `
            <button class="btn btn--primary" id="mock-finish" ${!allAnswered() ? 'disabled' : ''}>Finish exam</button>
          ` : `
            <button class="btn btn--primary" id="mock-next">Next →</button>
          `}
        </div>
      </div>
    `;

    bindEvents();
  };

  const allAnswered = () => _answers.every(a => a !== null);

  const getUnitColor = (unitId) => {
    const map = { su1:'#6C63FF', su2:'#00C9A7', su3:'#FF6B6B', su4:'#FFA94D', su5:'#748FFC', su6:'#F06595' };
    return map[unitId] || 'var(--accent)';
  };

  /* ---------- bind events ---------- */
  const bindEvents = () => {
    document.querySelectorAll('#mock-choices .choice-btn').forEach(btn => {
      btn.onclick = () => {
        _answers[_currentIdx] = parseInt(btn.dataset.index);
        renderQuestion();
      };
    });

    const prev = $('#mock-prev');
    const next = $('#mock-next');
    const finish = $('#mock-finish');

    if (prev) prev.onclick = () => { if (_currentIdx > 0) { _currentIdx--; renderQuestion(); window.scrollTo(0,0); } };
    if (next) next.onclick = () => { if (_currentIdx < _questions.length - 1) { _currentIdx++; renderQuestion(); window.scrollTo(0,0); } };
    if (finish) finish.onclick = () => showResults();
  };

  /* ---------- quit ---------- */
  const confirmQuit = () => {
    if (confirm('Quit the mock exam? Your progress will not be saved.')) {
      clearInterval(_timerInterval);
      Router.navigate('/mock');
    }
  };

  /* ---------- results ---------- */
  const showResults = () => {
    clearInterval(_timerInterval);
    const main = $('#main-content');
    const total = _questions.length;
    const correct = _answers.filter((a, i) => a === _questions[i].answer).length;
    const pct = Math.round((correct / total) * 100);
    const elapsed = Math.round((Date.now() - _startTime) / 1000);

    // Track weak topics for wrong answers
    _answers.forEach((a, i) => {
      if (a !== _questions[i].answer) {
        QuizEngine.trackWeakTopic(_questions[i].concept, _questions[i].unitId || 'mock');
      }
    });

    // XP
    Gamification.awardXP(correct * 5 + (pct >= 80 ? 20 : 0), `Mock: ${correct}/${total}`);
    Gamification.refreshHeader();

    // Per-unit breakdown
    const unitBreakdown = {};
    _questions.forEach((q, i) => {
      const uid = q.unitId || 'unknown';
      if (!unitBreakdown[uid]) unitBreakdown[uid] = { correct: 0, total: 0 };
      unitBreakdown[uid].total++;
      if (_answers[i] === q.answer) unitBreakdown[uid].correct++;
    });

    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '🤔' : '💪';
    const msg = pct >= 80 ? 'Excellent! You are exam ready.' : pct >= 60 ? 'Good effort. A few areas to revisit.' : pct >= 40 ? 'Getting there. Focus on the weak units below.' : 'Keep practising. Review the topics you missed.';

    main.innerHTML = `
      <div class="quiz-results" style="max-width:700px">
        <div class="results-hero">
          <span class="results-hero__emoji">${emoji}</span>
          <h1 class="results-hero__score">${correct} / ${total}</h1>
          <p class="results-hero__pct">${pct}%</p>
          <p class="results-hero__msg">${msg}</p>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-top:0.3rem">Time: ${formatTime(elapsed)}</p>
        </div>

        <!-- Per-unit breakdown -->
        <div class="mock-breakdown">
          <h3 class="section-title">Breakdown by unit</h3>
          ${Object.entries(unitBreakdown).map(([uid, data]) => {
            const unitPct = Math.round((data.correct / data.total) * 100);
            return `
              <div class="mock-breakdown__row">
                <span class="mock-breakdown__unit" style="--unit-color:${getUnitColor(uid)}">${uid.toUpperCase()}</span>
                <div class="mock-breakdown__bar"><div class="mock-breakdown__fill" style="width:${unitPct}%;background:${getUnitColor(uid)}"></div></div>
                <span class="mock-breakdown__score">${data.correct}/${data.total}</span>
              </div>`;
          }).join('')}
        </div>

        <div class="results-actions">
          <button class="btn btn--primary" onclick="MockEngine.start('${_mode}')">Try again</button>
          <button class="btn btn--secondary" onclick="Router.navigate('/mock')">Back to arena</button>
          <button class="btn btn--secondary" onclick="Router.navigate('/review')">Review weak topics</button>
        </div>
      </div>
    `;
  };

  return { start, confirmQuit };
})();
