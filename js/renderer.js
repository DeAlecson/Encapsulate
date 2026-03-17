/* =========================================================
   renderer.js — Page renderers for each route
   Phase 1: dashboard, study-units list, placeholder pages
   ========================================================= */

const Renderer = (() => {
  const { $, el, STRICTNESS } = Utils;

  const main = () => $('#main-content');

  /* ---------- set active nav ---------- */
  const setActiveNav = (route) => {
    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.toggle('nav__link--active', link.dataset.route === route);
    });
  };

  /* ==================== DASHBOARD ==================== */
  const dashboard = () => {
    setActiveNav('/');
    const p = Storage.getProgress();
    const s = Storage.getSettings();
    const strictLabel = STRICTNESS[s.strictness]?.label || 'Tutor';
    const hasKey = !!Storage.getApiKey();

    const completedCount = p.completedLessons.length;
    const totalUnits = 6;
    const pct = Math.round((Object.values(p.masteryMap).reduce((a, b) => a + b, 0) / (totalUnits * 100)) * 100) || 0;

    main().innerHTML = `
      <div class="dashboard">
        <header class="dashboard__hero">
          <h1 class="dashboard__title">Welcome back</h1>
          <p class="dashboard__sub">
            ${p.streak > 0 ? `🔥 ${p.streak} day streak — keep it going!` : 'Start a session to build your streak!'}
          </p>
        </header>

        <div class="stat-grid">
          <div class="stat-card">
            <span class="stat-card__value">${p.level}</span>
            <span class="stat-card__label">Level</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${Utils.formatXP(p.xp)}</span>
            <span class="stat-card__label">XP</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${p.streak}</span>
            <span class="stat-card__label">Day Streak</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${pct}%</span>
            <span class="stat-card__label">Mastery</span>
          </div>
        </div>

        <!-- Quick actions -->
        <section class="dashboard__section">
          <h2 class="section-title">Quick Actions</h2>
          <div class="action-grid">
            ${p.lastVisited ? `
              <button class="action-card action-card--primary" onclick="Router.navigate('/units/${p.lastVisited.id}')">
                ▶ Resume where you left off
              </button>
            ` : ''}
            <button class="action-card" onclick="Router.navigate('/units')">
              📚 Study Units
            </button>
            <button class="action-card" onclick="Router.navigate('/quiz')">
              ❓ Theory Quiz
            </button>
            <button class="action-card" onclick="Router.navigate('/practice')">
              💻 Code Practice
            </button>
            <button class="action-card" onclick="Router.navigate('/mock')">
              🏆 Mock Exam
            </button>
            <button class="action-card" onclick="Router.navigate('/review')">
              📖 Review Vault
            </button>
          </div>
        </section>

        <!-- Status bar -->
        <section class="dashboard__section">
          <h2 class="section-title">Status</h2>
          <div class="status-strip">
            <span class="status-chip">${strictLabel} mode</span>
            <span class="status-chip">${s.mode === 'guided' ? '🗺️ Guided' : '🔍 Explore'}</span>
            <span class="status-chip ${hasKey ? 'status-chip--green' : 'status-chip--dim'}">
              ${hasKey ? '● AI active' : '○ AI off'}
            </span>
          </div>
        </section>

        <!-- Progress overview -->
        <section class="dashboard__section">
          <h2 class="section-title">Unit Progress</h2>
          <div class="unit-progress-list">
            ${renderUnitProgressCards(p)}
          </div>
        </section>
      </div>
    `;
  };

  const UNITS = [
    { id: 'su1', name: 'Classes & Objects', icon: '🧱', color: '#6C63FF' },
    { id: 'su2', name: 'Composition & Collection', icon: '🔗', color: '#00C9A7' },
    { id: 'su3', name: 'Inheritance', icon: '🌳', color: '#FF6B6B' },
    { id: 'su4', name: 'Exception Handling', icon: '🛡️', color: '#FFA94D' },
    { id: 'su5', name: 'Python GUI', icon: '🖥️', color: '#748FFC' },
    { id: 'su6', name: 'SOLID & Design', icon: '🏗️', color: '#F06595' }
  ];

  const renderUnitProgressCards = (p) => {
    return UNITS.map(u => {
      const mastery = p.masteryMap[u.id] || 0;
      return `
        <div class="unit-card" onclick="Router.navigate('/units/${u.id}')" style="--unit-color:${u.color}">
          <span class="unit-card__icon">${u.icon}</span>
          <div class="unit-card__info">
            <span class="unit-card__name">${u.name}</span>
            <div class="unit-card__bar">
              <div class="unit-card__fill" style="width:${mastery}%"></div>
            </div>
          </div>
          <span class="unit-card__pct">${mastery}%</span>
        </div>
      `;
    }).join('');
  };

  /* ==================== UNITS LIST ==================== */
  const unitsList = () => {
    setActiveNav('/units');
    const p = Storage.getProgress();

    main().innerHTML = `
      <div class="page-container">
        <header class="page-header">
          <h1 class="page-title">Study Units</h1>
          <p class="page-sub">6 units covering everything in ICT162</p>
        </header>
        <div class="unit-grid">
          ${UNITS.map(u => {
            const mastery = p.masteryMap[u.id] || 0;
            return `
              <button class="unit-tile" onclick="Router.navigate('/units/${u.id}')" style="--unit-color:${u.color}">
                <span class="unit-tile__icon">${u.icon}</span>
                <h3 class="unit-tile__title">${u.name}</h3>
                <div class="unit-tile__bar">
                  <div class="unit-tile__fill" style="width:${mastery}%"></div>
                </div>
                <span class="unit-tile__pct">${mastery}%</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  /* ==================== PLACEHOLDER PAGES ==================== */
  const placeholder = (title, icon, desc) => {
    return () => {
      main().innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">${icon}</span>
          <h1 class="empty-state__title">${title}</h1>
          <p class="empty-state__desc">${desc}</p>
          <button class="btn btn--secondary" onclick="Router.navigate('/')">← Dashboard</button>
        </div>
      `;
    };
  };

  const unitDetail = (params) => {
    const unitId = params[0];
    const unit = UNITS.find(u => u.id === unitId);
    setActiveNav('/units');

    if (!unit) {
      main().innerHTML = `<div class="placeholder-page"><h1>Unit not found</h1></div>`;
      return;
    }

    const p = Storage.getProgress();
    const mastery = p.masteryMap[unitId] || 0;
    const lessonDone = p.completedLessons.includes(unitId);
    const quizDone = p.completedQuizzes.includes(unitId + '_quiz');
    const savedPos = Storage.get('lesson_pos_' + unitId);
    const hasProgress = savedPos !== null && savedPos > 0;

    main().innerHTML = `
      <div class="page-container">
        <header class="page-header" style="--unit-color:${unit.color}">
          <button class="btn btn--ghost btn--small" onclick="Router.navigate('/units')">← Back to units</button>
          <h1 class="page-title">${unit.icon} ${unit.name}</h1>
          <p class="page-sub">${UNIT_DESCRIPTIONS[unitId] || 'Lessons, quizzes, and drills for this unit'}</p>
        </header>

        <!-- Mastery bar -->
        <div class="unit-hub-mastery">
          <div class="unit-hub-mastery__bar">
            <div class="unit-hub-mastery__fill" style="width:${mastery}%;background:${unit.color}"></div>
          </div>
          <span class="unit-hub-mastery__label">${mastery}% mastery</span>
        </div>

        <!-- Action cards -->
        <div class="unit-hub-grid">
          <button class="unit-hub-card" onclick="LessonEngine.renderLesson('${unitId}')">
            <span class="unit-hub-card__icon">📖</span>
            <div class="unit-hub-card__info">
              <strong>${hasProgress && !lessonDone ? 'Resume lesson' : lessonDone ? 'Revisit lesson' : 'Start lesson'}</strong>
              <span>Learn the core concepts step by step</span>
            </div>
            ${lessonDone ? '<span class="unit-hub-card__badge">✓ Done</span>' : ''}
          </button>

          <button class="unit-hub-card" onclick="QuizEngine.startUnitQuiz('${unitId}')">
            <span class="unit-hub-card__icon">❓</span>
            <div class="unit-hub-card__info">
              <strong>${quizDone ? 'Retry quiz' : 'Take quiz'}</strong>
              <span>Test your understanding with MCQs</span>
            </div>
            ${quizDone ? '<span class="unit-hub-card__badge">✓ Done</span>' : ''}
          </button>

          <button class="unit-hub-card" onclick="PracticeEngine.startDrills('${unitId}')">
            <span class="unit-hub-card__icon">💻</span>
            <div class="unit-hub-card__info">
              <strong>Code drills</strong>
              <span>Write classes, methods, and debug code</span>
            </div>
            ${(p.completedDrills || []).filter(d => d.startsWith(unitId)).length > 0 ? '<span class="unit-hub-card__badge">' + (p.completedDrills || []).filter(d => d.startsWith(unitId)).length + ' done</span>' : ''}
          </button>
        </div>

        <!-- Weak topics for this unit -->
        ${renderWeakTopicsForUnit(unitId)}
      </div>
    `;
  };

  const UNIT_DESCRIPTIONS = {
    welcome: 'How Encapsulate works and what you will learn',
    su1: 'Classes, objects, constructors, properties, setters, __str__, class variables',
    su2: 'Composition (has-a), lists of objects, dictionaries, search/add/remove',
    su3: 'Inheritance (is-a), super(), overriding, abstract classes, polymorphism',
    su4: 'try/except, raising exceptions, custom exceptions, propagation',
    su5: 'tkinter widgets, layout, buttons, callbacks, form validation',
    su6: 'SOLID principles, cohesion, coupling, design thinking'
  };

  const renderWeakTopicsForUnit = (unitId) => {
    const p = Storage.getProgress();
    const weak = p.weakTopics.filter(t => t.unitId === unitId);
    if (weak.length === 0) return '';

    return `
      <section class="unit-hub-section">
        <h3 class="section-title">Areas to review</h3>
        <div class="weak-list">
          ${weak.map(t => `
            <div class="weak-chip">
              <span class="weak-chip__count">${t.count}x</span>
              ${Utils.escapeHTML(t.concept)}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  };

  /* ==================== SKILL MAP ==================== */
  const skillMap = () => {
    setActiveNav('/units');
    const p = Storage.getProgress();

    main().innerHTML = `
      <div class="page-container">
        <header class="page-header">
          <h1 class="page-title">Skill Map</h1>
          <p class="page-sub">Your learning journey through ICT162</p>
        </header>
        <div class="skill-map">
          ${UNITS.map((u, i) => {
            const mastery = p.masteryMap[u.id] || 0;
            const done = p.completedLessons.includes(u.id);
            const active = !done && (i === 0 || p.completedLessons.includes(UNITS[i-1]?.id));
            return `
              <div class="skill-node ${done ? 'skill-node--done' : active ? 'skill-node--active' : 'skill-node--locked'}"
                   onclick="${done || active ? `Router.navigate('/units/${u.id}')` : ''}"
                   style="--unit-color:${u.color}">
                <div class="skill-node__icon">${u.icon}</div>
                <div class="skill-node__name">${u.name}</div>
                <div class="skill-node__status">${done ? '✓ Complete' : active ? 'Ready' : '🔒 Locked'}</div>
                ${i < UNITS.length - 1 ? '<div class="skill-node__connector"></div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  /* ==================== REVIEW VAULT ==================== */
  const reviewVault = () => {
    setActiveNav('/review');
    const p = Storage.getProgress();

    const wrongCount = p.wrongAnswers.length;
    const weakCount = p.weakTopics.length;

    main().innerHTML = `
      <div class="page-container">
        <header class="page-header">
          <h1 class="page-title">📖 Review Vault</h1>
          <p class="page-sub">Track your mistakes and weak areas</p>
        </header>

        <div class="stat-grid" style="margin-bottom:1.5rem">
          <div class="stat-card">
            <span class="stat-card__value">${wrongCount}</span>
            <span class="stat-card__label">Wrong answers</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${weakCount}</span>
            <span class="stat-card__label">Weak topics</span>
          </div>
        </div>

        ${weakCount > 0 ? `
          <section class="dashboard__section">
            <h2 class="section-title">Weak Topics</h2>
            <div class="weak-list">
              ${p.weakTopics.map(t => `
                <div class="weak-chip" onclick="Router.navigate('/units/${t.unitId}')">
                  <span class="weak-chip__count">${t.count}x wrong</span>
                  ${Utils.escapeHTML(t.concept)}
                  <span class="weak-chip__unit">${t.unitId.toUpperCase()}</span>
                </div>
              `).join('')}
            </div>
          </section>
        ` : '<p class="text-muted" style="text-align:center;padding:2rem">No weak topics yet. Take some quizzes to get started!</p>'}

        ${wrongCount > 0 ? `
          <section class="dashboard__section">
            <h2 class="section-title">Recent wrong answers</h2>
            <div class="wrong-list">
              ${p.wrongAnswers.slice(-10).reverse().map(w => `
                <div class="wrong-item" onclick="Router.navigate('/units/${w.unitId}')">
                  <span class="wrong-item__concept">${Utils.escapeHTML(w.concept)}</span>
                  <span class="wrong-item__unit">${w.unitId.toUpperCase()}</span>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Feedback history (Phase 4) -->
        ${renderFeedbackHistory()}
      </div>
    `;
  };

  const renderFeedbackHistory = () => {
    const history = (typeof MarkingService !== 'undefined') ? MarkingService.getFeedbackHistory() : [];
    if (history.length === 0) return '';

    return `
      <section class="dashboard__section">
        <h2 class="section-title">Marking History</h2>
        <div class="history-list">
          ${history.slice(0, 15).map(h => {
            const v = h.result?.verdict || 'unknown';
            const src = h.result?.source === 'ai' ? '🤖 AI' : '📋 Offline';
            const time = new Date(h.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            return `
              <div class="history-item">
                <div class="history-item__top">
                  <span class="history-item__concept">${Utils.escapeHTML(h.concept || h.type)}</span>
                  <span class="history-item__verdict history-item__verdict--${v}">${v.replace('_', ' ')}</span>
                </div>
                <div class="history-item__meta">
                  <span>${src}</span>
                  <span>${h.strictness || 'tutor'}</span>
                  <span>${time}</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  };

  /* ==================== AI STUDIO ==================== */
  const aiStudio = () => {
    setActiveNav('/ai');
    const hasKey = !!Storage.getApiKey();
    const strictness = Storage.getSettings().strictness || 'tutor';

    main().innerHTML = `
      <div class="page-container" style="max-width:800px">
        <header class="page-header">
          <h1 class="page-title">🤖 AI Marking Studio</h1>
          <p class="page-sub">Get AI feedback on free-response answers and code</p>
        </header>

        <div class="api-status-panel" style="margin-bottom:1.25rem">
          <div class="api-status ${hasKey ? (navigator.onLine ? 'api-status--ready' : 'api-status--offline') : 'api-status--none'}">
            ${hasKey ? (navigator.onLine ? '● AI marking ready' : '◐ Offline — will use fallback') : '○ No API key — <a href="#" onclick="Settings.open();return false">set one in settings</a>'}
          </div>
        </div>

        <!-- Free-form code submission -->
        <section class="settings-group">
          <h3 class="settings-group__title">Submit Code for Review</h3>
          <div class="settings-row">
            <label class="settings-label">What concept is this about?</label>
            <input type="text" id="studio-concept" class="settings-input" placeholder="e.g. constructor, inheritance, exception handling" />
          </div>
          <div class="settings-row">
            <label class="settings-label">Question / task description</label>
            <textarea id="studio-question" class="code-editor" style="min-height:80px;font-family:var(--font-body);white-space:pre-wrap" placeholder="Paste or describe the question here..."></textarea>
          </div>
          <div class="settings-row">
            <label class="settings-label">Your answer</label>
            <textarea id="studio-answer" class="code-editor" style="min-height:140px" spellcheck="false" placeholder="Paste your code or written answer here..."></textarea>
          </div>
          <div class="settings-row">
            <label class="settings-label">Model answer (optional)</label>
            <textarea id="studio-model" class="code-editor" style="min-height:80px" spellcheck="false" placeholder="Paste model answer if you have one..."></textarea>
          </div>
          <div class="settings-row__actions">
            <button class="btn btn--primary" id="studio-submit">▶ Mark my answer</button>
            <span style="font-size:0.78rem;color:var(--text-muted)">Mode: ${Utils.STRICTNESS[strictness]?.icon || ''} ${Utils.STRICTNESS[strictness]?.label || strictness}</span>
          </div>
        </section>

        <div id="studio-feedback"></div>
      </div>
    `;

    // Bind submit
    const submitBtn = $('#studio-submit');
    if (submitBtn) submitBtn.onclick = async () => {
      const concept = $('#studio-concept')?.value?.trim() || 'general';
      const question = $('#studio-question')?.value?.trim();
      const answer = $('#studio-answer')?.value?.trim();
      const model = $('#studio-model')?.value?.trim();

      if (!answer) { Utils.toast('Write an answer first', 'warn'); return; }

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Marking...';
      const fbPanel = $('#studio-feedback');
      if (fbPanel) fbPanel.innerHTML = '<div class="marking-loading"><div class="marking-spinner"></div><span>Reviewing your answer...</span></div>';

      const questionObj = {
        concept,
        prompt: question || 'Free-form submission',
        expectedKeyPoints: [],
        id: 'studio_' + Date.now()
      };

      // Determine if this looks like code or theory
      const looksLikeCode = answer.includes('class ') || answer.includes('def ') || answer.includes('self.') || answer.includes('import ');

      let result;
      if (looksLikeCode) {
        const task = {
          ...questionObj,
          type: 'write_class',
          difficulty: 3,
          starterCode: '',
          modelAnswer: model || '',
          expectedKeyPoints: [],
          commonMistakes: [],
          checks: [],
          unitId: ''
        };
        result = await MarkingService.markCode(task, answer);
      } else {
        result = await MarkingService.markTheory(questionObj, answer, model);
      }

      if (fbPanel) fbPanel.innerHTML = renderStudioFeedback(result);
      submitBtn.disabled = false;
      submitBtn.textContent = '▶ Mark my answer';
    };
  };

  const renderStudioFeedback = (result) => {
    const isAI = result.source === 'ai';
    const v = result.verdict || 'incorrect';
    const colorMap = { correct: 'green', partially_correct: 'amber', incorrect: 'red' };
    const color = colorMap[v] || 'red';

    return `
      <div class="feedback-card feedback-card--${color}" style="margin-top:1rem">
        <div class="feedback-header">
          <span class="feedback-header__icon">${v === 'correct' ? '✅' : v === 'partially_correct' ? '🟡' : '❌'}</span>
          <span class="feedback-header__msg">${Utils.escapeHTML(result.encouragement || v.replace('_', ' '))}</span>
          <span class="feedback-header__score">Score: ${result.score}/100</span>
        </div>
        <div class="feedback-source">
          ${isAI ? '<span class="source-badge source-badge--ai">🤖 AI Marked</span>' : '<span class="source-badge source-badge--offline">📋 Offline Review</span>'}
        </div>
        ${result.strengths?.length ? `<div class="feedback-section feedback-section--pass"><strong>✓ Strengths:</strong><ul>${result.strengths.map(s => `<li>${Utils.escapeHTML(s)}</li>`).join('')}</ul></div>` : ''}
        ${result.mistakes?.length ? `<div class="feedback-section feedback-section--fail"><strong>✗ To improve:</strong><ul>${result.mistakes.map(m => `<li>${Utils.escapeHTML(m)}</li>`).join('')}</ul></div>` : ''}
        ${result.hints?.length ? `<div class="feedback-section feedback-section--tip"><strong>💡 Hint:</strong> ${Utils.escapeHTML(result.hints[0])}</div>` : ''}
        ${result.corrected_answer ? `<div class="feedback-section"><strong>Improved version:</strong><pre class="code-block"><code>${Utils.escapeHTML(result.corrected_answer)}</code></pre></div>` : ''}
        ${result.next_step ? `<div class="feedback-section"><strong>Next step:</strong> ${Utils.escapeHTML(result.next_step)}</div>` : ''}
      </div>`;
  };

  return {
    dashboard,
    unitsList,
    unitDetail,
    skillMap,
    reviewVault,
    quiz: () => {
      setActiveNav('/quiz');
      const p = Storage.getProgress();
      main().innerHTML = `
        <div class="page-container">
          <header class="page-header">
            <h1 class="page-title">❓ Theory Quiz Arena</h1>
            <p class="page-sub">Test your understanding across all topics</p>
          </header>
          <div class="unit-grid">
            ${UNITS.filter(u => u.id !== 'welcome').map(u => {
              const done = (p.completedQuizzes || []).includes(u.id + '_quiz');
              return `
                <button class="unit-tile" onclick="QuizEngine.startUnitQuiz('${u.id}')" style="--unit-color:${u.color}">
                  <span class="unit-tile__icon">${u.icon}</span>
                  <h3 class="unit-tile__title">${u.name}</h3>
                  <span class="unit-tile__pct">${done ? '✓ Done' : 'Take quiz'}</span>
                </button>`;
            }).join('')}
          </div>
        </div>`;
    },
    practice: () => PracticeEngine.startHub(),
    mock:     placeholder('Mock Exam Arena', '🏆', 'Timed and untimed exam practice coming soon'),
    aiStudio,
    UNITS
  };
})();
