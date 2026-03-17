/* =========================================================
   practice-engine.js — Coding exercise engine for Encapsulate
   Phase 3: offline code evaluation, split-pane, hints, strictness
   ========================================================= */

const PracticeEngine = (() => {
  const { $, escapeHTML, toast, STRICTNESS } = Utils;

  let _tasks = null;
  let _currentIdx = 0;
  let _unitId = null;
  let _hintsRevealed = 0;
  let _submitted = false;
  let _lastResult = null;

  /* ---------- load coding tasks JSON ---------- */
  const loadTasks = async (unitId) => {
    try {
      const resp = await fetch(`./data/coding/${unitId}_coding.json`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  };

  /* ---------- start drills for a unit ---------- */
  const startDrills = async (unitId) => {
    const main = $('#main-content');
    main.innerHTML = '<div class="loading">Loading code drills...</div>';

    const data = await loadTasks(unitId);
    if (!data || !data.tasks || data.tasks.length === 0) {
      main.innerHTML = `
        <div class="placeholder-page">
          <span class="placeholder-page__icon">💻</span>
          <h1 class="placeholder-page__title">No coding drills yet</h1>
          <p class="placeholder-page__desc">Code exercises for this unit are coming soon.</p>
          <button class="btn btn--secondary" onclick="Router.navigate('/units/${unitId}')">← Back</button>
        </div>`;
      return;
    }

    _tasks = data.tasks;
    _unitId = unitId;
    _currentIdx = 0;
    _hintsRevealed = 0;
    _submitted = false;
    _lastResult = null;

    renderTask();
  };

  /* ---------- start practice hub (all units) ---------- */
  const startHub = () => {
    const main = $('#main-content');
    const p = Storage.getProgress();
    const UNITS = Renderer.UNITS;

    main.innerHTML = `
      <div class="page-container">
        <header class="page-header">
          <h1 class="page-title">💻 Code Practice Lab</h1>
          <p class="page-sub">Write classes, methods, and debug code from ICT162</p>
        </header>
        <div class="unit-grid">
          ${UNITS.filter(u => u.id !== 'welcome' && u.id.startsWith('su')).map(u => {
            const drillsDone = (p.completedDrills || []).filter(d => d.startsWith(u.id)).length;
            return `
              <button class="unit-tile" onclick="PracticeEngine.startDrills('${u.id}')" style="--unit-color:${u.color}">
                <span class="unit-tile__icon">${u.icon}</span>
                <h3 class="unit-tile__title">${u.name}</h3>
                <span class="unit-tile__pct">${drillsDone} done</span>
              </button>`;
          }).join('')}
        </div>
      </div>`;
  };

  /* ===================================================================
     RENDER: split-pane CodeAcademy layout
     =================================================================== */
  const renderTask = () => {
    const main = $('#main-content');
    if (!_tasks) return;

    const task = _tasks[_currentIdx];
    const total = _tasks.length;
    const pct = Math.round(((_currentIdx + 1) / total) * 100);
    const settings = Storage.getSettings();
    const strictness = settings.strictness || 'tutor';

    // Restore saved code or use starter
    const savedCode = Storage.get(`code_${task.id}`) || task.starterCode;
    const attemptCount = getAttemptCount(task.id);

    main.innerHTML = `
      <div class="practice-view">
        <!-- Top bar -->
        <div class="practice-bar">
          <button class="btn btn--ghost btn--small" onclick="Router.navigate('/units/${_unitId}')">← Back</button>
          <span class="practice-bar__title">${task.type === 'write_class' ? '🏗️ Write Class' : task.type === 'write_method' ? '🔧 Write Method' : task.type === 'code_completion' ? '✏️ Complete Code' : '💻 Code Drill'}</span>
          <span class="practice-bar__counter">${_currentIdx + 1} / ${total}</span>
        </div>
        <div class="lesson-progress"><div class="lesson-progress__fill" style="width:${pct}%"></div></div>

        <!-- Split pane -->
        <div class="split-pane">
          <!-- LEFT: prompt panel -->
          <div class="split-pane__left">
            <div class="prompt-panel">
              <span class="section-badge section-badge--worked_example">Concept: ${escapeHTML(task.concept)}</span>
              <span class="prompt-difficulty">Difficulty: ${'★'.repeat(task.difficulty)}${'☆'.repeat(5 - task.difficulty)}</span>
              <div class="prompt-body">${formatPromptMD(task.prompt)}</div>

              ${attemptCount > 0 ? `<p class="prompt-attempts">Attempts: ${attemptCount}</p>` : ''}

              <!-- Hint ladder -->
              <div class="hint-section">
                <button class="btn btn--ghost btn--small" id="hint-btn" ${_hintsRevealed >= (task.hintLadder || []).length ? 'disabled' : ''}>
                  💡 ${_hintsRevealed === 0 ? 'Get a hint' : `Hint ${_hintsRevealed} / ${(task.hintLadder || []).length}`}
                </button>
                <div class="hint-list" id="hint-list">
                  ${(task.hintLadder || []).slice(0, _hintsRevealed).map((h, i) => `
                    <div class="hint-card">
                      <span class="hint-card__num">Hint ${i + 1}</span>
                      ${escapeHTML(h)}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: editor panel -->
          <div class="split-pane__right">
            <div class="editor-panel">
              <div class="editor-header">
                <span class="editor-header__label">Your code</span>
                <span class="editor-header__mode">${STRICTNESS[strictness]?.icon || ''} ${STRICTNESS[strictness]?.label || strictness}</span>
              </div>
              <div class="editor-wrapper">
                <div class="line-numbers" id="line-numbers"></div>
                <textarea class="code-editor" id="code-editor" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">${escapeHTML(savedCode)}</textarea>
              </div>

              <!-- Action buttons -->
              <div class="editor-actions">
                <button class="btn btn--primary" id="submit-btn" ${_submitted ? 'disabled' : ''}>
                  ${_submitted ? '✓ Submitted' : '▶ Check my code'}
                </button>
                <button class="btn btn--secondary" id="model-btn">Show model answer</button>
                <button class="btn btn--ghost btn--small" id="reset-btn">↺ Reset</button>
              </div>
            </div>

            <!-- Feedback panel -->
            <div id="feedback-panel">
              ${_submitted && _lastResult ? renderFeedback(_lastResult, task, strictness) : ''}
            </div>
          </div>
        </div>

        <!-- Bottom nav -->
        <div class="lesson-nav">
          <button class="btn btn--secondary" id="drill-prev" ${_currentIdx === 0 ? 'disabled' : ''}>← Previous</button>
          ${_currentIdx === total - 1 ? `
            <button class="btn btn--primary" id="drill-finish">Finish drills</button>
          ` : `
            <button class="btn btn--primary" id="drill-next">Next →</button>
          `}
        </div>
      </div>
    `;

    bindEditorEvents(task);
    updateLineNumbers();
  };

  /* ===================================================================
     OFFLINE CODE EVALUATOR
     =================================================================== */
  const evaluateCode = (code, task) => {
    const result = {
      passed: [],
      failed: [],
      score: 0,
      total: task.checks.length,
      verdict: 'incorrect'
    };

    for (const check of task.checks) {
      let match = false;
      const codeNorm = code.replace(/\s+/g, ' ').trim();

      if (check.type === 'keyword') {
        // Simple substring check (normalised whitespace)
        match = codeNorm.includes(check.value.replace(/\s+/g, ' '));
      } else if (check.type === 'pattern') {
        // Regex match
        try {
          const re = new RegExp(check.value, 's');
          match = re.test(code);
        } catch { match = false; }
      }

      if (match) {
        result.passed.push(check);
        result.score++;
      } else {
        result.failed.push(check);
      }
    }

    // Determine verdict
    const pct = result.total > 0 ? result.score / result.total : 0;
    if (pct >= 0.9) result.verdict = 'correct';
    else if (pct >= 0.5) result.verdict = 'partially_correct';
    else result.verdict = 'incorrect';

    return result;
  };

  /* ===================================================================
     FEEDBACK RENDERER (strictness-aware)
     =================================================================== */
  const renderFeedback = (result, task, strictness) => {
    const verdictMap = {
      correct:           { icon: '✅', color: 'green',  tutor: 'Nice work! Your code looks solid.',     guided: 'Correct. Good structure.',             exam: 'Correct.',                       brutal: 'Passes.' },
      partially_correct: { icon: '🟡', color: 'amber',  tutor: 'Almost there! A few things to fix.',    guided: 'Partially correct. Check the gaps.',   exam: 'Incomplete. See missing items.', brutal: 'Half-baked. Fix the gaps.' },
      incorrect:         { icon: '❌', color: 'red',    tutor: 'Not quite yet, but let us work through it.', guided: 'Incorrect. Review the requirements.', exam: 'Incorrect. Key elements missing.', brutal: 'Wrong. Start over.' }
    };

    const v = verdictMap[result.verdict] || verdictMap.incorrect;
    const showDetails = strictness !== 'brutal';
    const showHints = strictness === 'tutor' || strictness === 'guided';
    const isAI = result.source === 'ai';

    // Normalise strengths/mistakes: AI returns string[], offline returns {label}[]
    const strengths = (result.strengths || []).map(s => typeof s === 'string' ? s : s.label);
    const mistakes = (result.mistakes || []).map(m => typeof m === 'string' ? m : m.label);
    const hints = result.hints || [];
    const missingConcepts = result.missing_concepts || [];

    // Use AI message if available, else strictness default
    const mainMsg = result.encouragement || v[strictness] || v.tutor;
    const scoreLabel = isAI ? `Score: ${result.score}/100` : `${result.passed?.length || 0} / ${result.total || 0} checks`;

    return `
      <div class="feedback-card feedback-card--${v.color}">
        <div class="feedback-header">
          <span class="feedback-header__icon">${v.icon}</span>
          <span class="feedback-header__msg">${escapeHTML(mainMsg)}</span>
          <span class="feedback-header__score">${scoreLabel}</span>
        </div>

        <!-- Source badge -->
        <div class="feedback-source">
          ${isAI ? '<span class="source-badge source-badge--ai">🤖 AI Marked</span>' : '<span class="source-badge source-badge--offline">📋 Offline Review</span>'}
        </div>

        ${showDetails ? `
          ${strengths.length > 0 ? `
            <div class="feedback-section feedback-section--pass">
              <strong>✓ What is correct:</strong>
              <ul>${strengths.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>
            </div>
          ` : ''}

          ${mistakes.length > 0 ? `
            <div class="feedback-section feedback-section--fail">
              <strong>✗ What to improve:</strong>
              <ul>${mistakes.map(m => `<li>${escapeHTML(m)}</li>`).join('')}</ul>
            </div>
          ` : ''}

          ${missingConcepts.length > 0 ? `
            <div class="feedback-section">
              <strong>📚 Concepts to review:</strong>
              <ul>${missingConcepts.map(c => `<li>${escapeHTML(c)}</li>`).join('')}</ul>
            </div>
          ` : ''}
        ` : ''}

        ${showHints && hints.length > 0 ? `
          <div class="feedback-section feedback-section--tip">
            <strong>💡 Hint:</strong> ${escapeHTML(hints[0])}
          </div>
        ` : ''}

        ${result.corrected_answer && result.verdict !== 'correct' && strictness !== 'brutal' ? `
          <div class="feedback-section">
            <strong>Improved version:</strong>
            <pre class="code-block"><code>${escapeHTML(result.corrected_answer)}</code></pre>
          </div>
        ` : ''}

        ${result.next_step && showDetails ? `
          <div class="feedback-section">
            <strong>Next step:</strong> ${escapeHTML(result.next_step)}
          </div>
        ` : ''}

        ${result.verdict !== 'correct' ? `
          <button class="btn btn--secondary btn--small" id="retry-btn" style="margin-top:0.75rem">↩ Retry</button>
        ` : ''}
      </div>
    `;
  };

  /* ===================================================================
     FORMAT PROMPT
     =================================================================== */
  const formatPromptMD = (text) => {
    if (!text) return '';
    let html = escapeHTML(text);
    html = html.replace(/```python\n([\s\S]*?)```/g, (_, c) => `<pre class="code-block"><code>${c.trim()}</code></pre>`);
    html = html.replace(/```([\s\S]*?)```/g, (_, c) => `<pre class="code-block"><code>${c.trim()}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n- /g, '\n• ');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  };

  /* ===================================================================
     EDITOR HELPERS
     =================================================================== */
  const updateLineNumbers = () => {
    const editor = $('#code-editor');
    const gutter = $('#line-numbers');
    if (!editor || !gutter) return;

    const lines = editor.value.split('\n').length;
    gutter.innerHTML = Array.from({ length: lines }, (_, i) =>
      `<span>${i + 1}</span>`
    ).join('');
  };

  const bindEditorEvents = (task) => {
    const editor = $('#code-editor');
    const submitBtn = $('#submit-btn');
    const modelBtn = $('#model-btn');
    const resetBtn = $('#reset-btn');
    const hintBtn = $('#hint-btn');
    const prevBtn = $('#drill-prev');
    const nextBtn = $('#drill-next');
    const finishBtn = $('#drill-finish');

    // Line numbers sync
    if (editor) {
      editor.addEventListener('input', () => {
        updateLineNumbers();
        // Auto-save draft
        Storage.set(`code_${task.id}`, editor.value);
      });
      editor.addEventListener('scroll', () => {
        const gutter = $('#line-numbers');
        if (gutter) gutter.scrollTop = editor.scrollTop;
      });
      // Tab support
      editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = editor.selectionStart;
          const end = editor.selectionEnd;
          editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
          editor.selectionStart = editor.selectionEnd = start + 4;
          updateLineNumbers();
        }
      });
    }

    // Submit
    if (submitBtn) submitBtn.onclick = async () => {
      const code = editor.value;
      if (!code.trim()) { toast('Write some code first', 'warn'); return; }

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Marking...';
      const fbPanel = $('#feedback-panel');
      if (fbPanel) fbPanel.innerHTML = '<div class="marking-loading"><div class="marking-spinner"></div><span>Checking your code...</span></div>';

      try {
        // Use unified marking service (AI-first, falls back to offline)
        _lastResult = await MarkingService.markCode(task, code);
        _submitted = true;

        // Track attempt
        incrementAttempt(task.id);

        // XP + progress
        if (_lastResult.verdict === 'correct') {
          Gamification.awardXP(20, 'Code drill correct');
          Storage.updateProgress(p => {
            if (!p.completedDrills) p.completedDrills = [];
            if (!p.completedDrills.includes(task.id)) p.completedDrills.push(task.id);
            if (!p.masteryMap[_unitId]) p.masteryMap[_unitId] = 0;
            p.masteryMap[_unitId] = Math.min(100, p.masteryMap[_unitId] + 10);
          });
          Gamification.refreshHeader();
        } else if (_lastResult.verdict === 'partially_correct') {
          Gamification.awardXP(5, 'Partial credit');
          trackWeakTopic(task.concept);
        } else {
          trackWeakTopic(task.concept);
          if (getAttemptCount(task.id) >= 3) {
            toast('Struggling? Revisit the lesson for this concept.', 'info', 4000);
          }
        }
      } catch (err) {
        // Should not happen since MarkingService handles fallback internally
        console.error('Marking failed completely:', err);
        _lastResult = FallbackMarker.markCode(task, code, Storage.getSettings().strictness || 'tutor');
        _submitted = true;
      }

      renderTask();
      const fb = $('#feedback-panel');
      if (fb && window.innerWidth < 768) fb.scrollIntoView({ behavior: 'smooth' });
    };

    // Retry (inside feedback panel)
    setTimeout(() => {
      const retryBtn = $('#retry-btn');
      if (retryBtn) retryBtn.onclick = () => {
        _submitted = false;
        _lastResult = null;
        renderTask();
      };
    }, 50);

    // Model answer
    if (modelBtn) modelBtn.onclick = () => {
      const panel = $('#feedback-panel');
      if (!panel) return;
      panel.innerHTML = `
        <div class="model-answer-card">
          <h3>Model Answer</h3>
          <pre class="code-block"><code>${escapeHTML(task.modelAnswer)}</code></pre>
          <button class="btn btn--ghost btn--small" id="hide-model">Hide model answer</button>
        </div>`;
      const hideBtn = $('#hide-model');
      if (hideBtn) hideBtn.onclick = () => {
        panel.innerHTML = _submitted && _lastResult ? renderFeedback(_lastResult, task, Storage.getSettings().strictness) : '';
        // rebind retry
        setTimeout(() => {
          const rb = $('#retry-btn');
          if (rb) rb.onclick = () => { _submitted = false; _lastResult = null; renderTask(); };
        }, 50);
      };
    };

    // Reset
    if (resetBtn) resetBtn.onclick = () => {
      if (editor) editor.value = task.starterCode;
      Storage.set(`code_${task.id}`, task.starterCode);
      _submitted = false;
      _lastResult = null;
      _hintsRevealed = 0;
      updateLineNumbers();
      renderTask();
    };

    // Hints
    if (hintBtn) hintBtn.onclick = () => {
      if (_hintsRevealed < (task.hintLadder || []).length) {
        _hintsRevealed++;
        renderTask();
      }
    };

    // Nav
    if (prevBtn) prevBtn.onclick = () => {
      if (_currentIdx > 0) { _currentIdx--; resetTaskState(); renderTask(); window.scrollTo(0, 0); }
    };
    if (nextBtn) nextBtn.onclick = () => {
      if (_currentIdx < _tasks.length - 1) { _currentIdx++; resetTaskState(); renderTask(); window.scrollTo(0, 0); }
    };
    if (finishBtn) finishBtn.onclick = () => {
      showDrillResults();
    };
  };

  const resetTaskState = () => {
    _hintsRevealed = 0;
    _submitted = false;
    _lastResult = null;
  };

  /* ===================================================================
     DRILL RESULTS
     =================================================================== */
  const showDrillResults = () => {
    const main = $('#main-content');
    const p = Storage.getProgress();
    const completed = (_tasks || []).filter(t =>
      (p.completedDrills || []).includes(t.id)
    ).length;
    const total = (_tasks || []).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';

    main.innerHTML = `
      <div class="quiz-results">
        <div class="results-hero">
          <span class="results-hero__emoji">${emoji}</span>
          <h1 class="results-hero__score">${completed} / ${total}</h1>
          <p class="results-hero__pct">${pct}% drills passed</p>
          <p class="results-hero__msg">${pct >= 80 ? 'Outstanding coding work!' : pct >= 50 ? 'Good progress! Keep practising.' : 'Keep at it. Retry the ones you missed.'}</p>
        </div>
        <div class="results-actions">
          <button class="btn btn--primary" onclick="PracticeEngine.startDrills('${_unitId}')">Retry drills</button>
          <button class="btn btn--secondary" onclick="Router.navigate('/units/${_unitId}')">Back to unit</button>
          <button class="btn btn--secondary" onclick="Router.navigate('/')">Dashboard</button>
        </div>
      </div>`;
  };

  /* ===================================================================
     PROGRESS HELPERS
     =================================================================== */
  const getAttemptCount = (taskId) => {
    const p = Storage.getProgress();
    return (p.attempts && p.attempts[taskId]) || 0;
  };

  const incrementAttempt = (taskId) => {
    Storage.updateProgress(p => {
      if (!p.attempts) p.attempts = {};
      p.attempts[taskId] = (p.attempts[taskId] || 0) + 1;
    });
  };

  const trackWeakTopic = (concept) => {
    Storage.updateProgress(p => {
      const existing = p.weakTopics.find(t => t.concept === concept && t.unitId === _unitId);
      if (existing) { existing.count++; existing.lastSeen = new Date().toISOString(); }
      else { p.weakTopics.push({ concept, unitId: _unitId, count: 1, lastSeen: new Date().toISOString() }); }
      p.weakTopics.sort((a, b) => b.count - a.count);
      if (p.weakTopics.length > 20) p.weakTopics = p.weakTopics.slice(0, 20);
    });
  };

  return { startDrills, startHub, evaluateCode };
})();
