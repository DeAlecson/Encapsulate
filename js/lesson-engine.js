/* =========================================================
   lesson-engine.js — Renders lessons from JSON, tracks progress
   Phase 2 core: load content, display sections, nav, checkpoints
   ========================================================= */

const LessonEngine = (() => {
  const { $, el, toast, escapeHTML } = Utils;

  let _currentLesson = null;
  let _currentSection = 0;
  let _sectionStates = {};  // track answered checkpoints

  /* ---------- load lesson JSON ---------- */
  const loadLesson = async (unitId) => {
    try {
      const unitsResp = await fetch('./data/units.json');
      const unitsData = await unitsResp.json();
      const unit = unitsData.units.find(u => u.id === unitId);
      if (!unit || !unit.lessonFile) return null;

      const resp = await fetch('./data/' + unit.lessonFile);
      const lesson = await resp.json();
      return { lesson, unit };
    } catch (e) {
      console.error('Failed to load lesson', e);
      return null;
    }
  };

  /* ---------- load quiz JSON ---------- */
  const loadQuiz = async (unitId) => {
    try {
      const unitsResp = await fetch('./data/units.json');
      const unitsData = await unitsResp.json();
      const unit = unitsData.units.find(u => u.id === unitId);
      if (!unit || !unit.quizFile) return null;

      const resp = await fetch('./data/' + unit.quizFile);
      return await resp.json();
    } catch (e) {
      console.error('Failed to load quiz', e);
      return null;
    }
  };

  /* ---------- render a lesson into the main area ---------- */
  const renderLesson = async (unitId) => {
    const main = $('#main-content');
    main.innerHTML = '<div class="loading">Loading lesson...</div>';

    const data = await loadLesson(unitId);
    if (!data) {
      main.innerHTML = '<div class="placeholder-page"><h1>Lesson not found</h1></div>';
      return;
    }

    const { lesson, unit } = data;
    _currentLesson = lesson;
    _currentSection = restorePosition(unitId);
    _sectionStates = {};

    // Save last visited
    Storage.updateProgress(p => {
      p.lastVisited = { type: 'unit', id: unitId };
    });

    renderCurrentSection(unit);
  };

  /* ---------- render current section ---------- */
  const renderCurrentSection = (unit) => {
    const main = $('#main-content');
    if (!_currentLesson) return;

    const section = _currentLesson.sections[_currentSection];
    const total = _currentLesson.sections.length;
    const pct = Math.round(((_currentSection + 1) / total) * 100);

    let sectionHTML = '';

    switch (section.type) {
      case 'intro':
      case 'definition':
      case 'example':
      case 'worked_example':
        sectionHTML = renderContentSection(section);
        break;
      case 'checkpoint':
        sectionHTML = renderCheckpoint(section);
        break;
      case 'summary':
        sectionHTML = renderContentSection(section);
        break;
      default:
        sectionHTML = renderContentSection(section);
    }

    const isFirst = _currentSection === 0;
    const isLast = _currentSection === total - 1;

    main.innerHTML = `
      <div class="lesson-view" style="--unit-color:${unit.color || 'var(--accent)'}">
        <!-- Lesson header -->
        <div class="lesson-header">
          <button class="btn btn--ghost btn--small" onclick="Router.navigate('/units/${_currentLesson.unit}')">← Back</button>
          <div class="lesson-header__info">
            <span class="lesson-header__unit">${unit.icon || ''} ${unit.title}</span>
            <span class="lesson-header__progress">${_currentSection + 1} / ${total}</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="lesson-progress">
          <div class="lesson-progress__fill" style="width:${pct}%"></div>
        </div>

        <!-- Section type badge -->
        <div class="section-badge section-badge--${section.type}">
          ${sectionTypeBadge(section.type)}
        </div>

        <!-- Section title -->
        <h2 class="lesson-section-title">${escapeHTML(section.title)}</h2>

        <!-- Section content -->
        <div class="lesson-content">
          ${sectionHTML}
        </div>

        <!-- Navigation -->
        <div class="lesson-nav">
          <button class="btn btn--secondary" id="lesson-prev" ${isFirst ? 'disabled' : ''}>
            ← Previous
          </button>
          <button class="btn btn--ghost btn--small" id="lesson-skip" style="${isLast ? 'display:none' : ''}">
            Skip →
          </button>
          ${isLast ? `
            <button class="btn btn--primary" id="lesson-complete">
              ✓ Complete lesson
            </button>
          ` : `
            <button class="btn btn--primary" id="lesson-next">
              Next →
            </button>
          `}
        </div>
      </div>
    `;

    bindLessonNav(unit);
    highlightCode();
  };

  /* ---------- section type badge ---------- */
  const sectionTypeBadge = (type) => {
    const map = {
      intro: '📖 Introduction',
      definition: '📝 Key Concept',
      example: '💡 Example',
      worked_example: '🔨 Worked Example',
      checkpoint: '✅ Quick Check',
      summary: '📋 Summary'
    };
    return map[type] || type;
  };

  /* ---------- render a content section (intro/definition/example/summary) ---------- */
  const renderContentSection = (section) => {
    return `<div class="lesson-prose">${markdownToHTML(section.content)}</div>`;
  };

  /* ---------- render a checkpoint (MCQ) ---------- */
  const renderCheckpoint = (section) => {
    const q = section.question;
    if (!q) return renderContentSection(section);

    const stateKey = `ckpt_${_currentSection}`;
    const answered = _sectionStates[stateKey];

    if (q.type === 'mcq') {
      return `
        <div class="checkpoint">
          <p class="checkpoint__prompt">${escapeHTML(q.prompt)}</p>
          <div class="checkpoint__choices" id="checkpoint-choices">
            ${q.choices.map((c, i) => `
              <button class="choice-btn ${answered !== undefined ? (i === q.answer ? 'choice-btn--correct' : (i === answered ? 'choice-btn--wrong' : 'choice-btn--dim')) : ''}"
                      data-index="${i}"
                      ${answered !== undefined ? 'disabled' : ''}>
                <span class="choice-btn__letter">${String.fromCharCode(65 + i)}</span>
                ${escapeHTML(c)}
              </button>
            `).join('')}
          </div>
          ${answered !== undefined ? `
            <div class="checkpoint__feedback ${answered === q.answer ? 'checkpoint__feedback--correct' : 'checkpoint__feedback--wrong'}">
              ${answered === q.answer ? '✓ Correct!' : '✗ Not quite.'}
              <p>${escapeHTML(q.explanation)}</p>
            </div>
          ` : ''}
        </div>
      `;
    }

    return renderContentSection(section);
  };

  /* ---------- bind navigation ---------- */
  const bindLessonNav = (unit) => {
    const prev = $('#lesson-prev');
    const next = $('#lesson-next');
    const skip = $('#lesson-skip');
    const complete = $('#lesson-complete');

    if (prev) prev.onclick = () => {
      if (_currentSection > 0) {
        _currentSection--;
        savePosition(_currentLesson.unit, _currentSection);
        renderCurrentSection(unit);
        window.scrollTo(0, 0);
      }
    };

    if (next) next.onclick = () => {
      if (_currentSection < _currentLesson.sections.length - 1) {
        _currentSection++;
        savePosition(_currentLesson.unit, _currentSection);
        renderCurrentSection(unit);
        window.scrollTo(0, 0);
      }
    };

    if (skip) skip.onclick = () => {
      if (_currentSection < _currentLesson.sections.length - 1) {
        _currentSection++;
        savePosition(_currentLesson.unit, _currentSection);
        renderCurrentSection(unit);
        window.scrollTo(0, 0);
      }
    };

    if (complete) complete.onclick = () => {
      completeLesson(_currentLesson.unit);
      Router.navigate('/units/' + _currentLesson.unit);
    };

    // Checkpoint answer buttons
    const choices = document.querySelectorAll('#checkpoint-choices .choice-btn');
    choices.forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.index);
        const stateKey = `ckpt_${_currentSection}`;
        _sectionStates[stateKey] = idx;

        const section = _currentLesson.sections[_currentSection];
        const correct = idx === section.question.answer;

        if (correct) {
          Gamification.awardXP(10, 'Checkpoint correct');
        }

        renderCurrentSection(unit);
      };
    });
  };

  /* ---------- position persistence ---------- */
  const savePosition = (unitId, sectionIdx) => {
    Storage.set('lesson_pos_' + unitId, sectionIdx);
  };

  const restorePosition = (unitId) => {
    return Storage.get('lesson_pos_' + unitId) || 0;
  };

  /* ---------- mark lesson complete ---------- */
  const completeLesson = (unitId) => {
    Storage.updateProgress(p => {
      if (!p.completedLessons.includes(unitId)) {
        p.completedLessons.push(unitId);
      }
      // Update mastery
      if (!p.masteryMap[unitId]) p.masteryMap[unitId] = 0;
      p.masteryMap[unitId] = Math.min(100, p.masteryMap[unitId] + 30);
    });

    Gamification.awardXP(15, 'Lesson complete');
    toast('Lesson complete! +15 XP', 'success');
  };

  /* ---------- simple markdown to HTML ---------- */
  const markdownToHTML = (text) => Utils.markdownToHTML(text);

  /* ---------- syntax highlight (simple, safe) ---------- */
  const highlightCode = () => {
    document.querySelectorAll('.code-block code').forEach(block => {
      // Work from textContent (plain text, no HTML entities)
      const raw = block.textContent;
      const lines = raw.split('\n');
      const highlighted = lines.map(line => highlightLine(line)).join('\n');
      block.innerHTML = highlighted;
    });
  };

  const highlightLine = (line) => {
    // Tokenise the line to avoid highlighting inside strings/comments
    const tokens = [];
    let i = 0;

    while (i < line.length) {
      // Comment — rest of line
      if (line[i] === '#') {
        tokens.push({ type: 'comment', text: line.slice(i) });
        i = line.length;
      }
      // String (single or double quote, including f-strings)
      else if (line[i] === "'" || line[i] === '"' || (line[i] === 'f' && (line[i+1] === "'" || line[i+1] === '"'))) {
        const fPrefix = line[i] === 'f' ? 'f' : '';
        const qStart = fPrefix ? i + 1 : i;
        const q = line[qStart];
        let j = qStart + 1;
        while (j < line.length && line[j] !== q) {
          if (line[j] === '\\') j++; // skip escaped char
          j++;
        }
        j++; // include closing quote
        tokens.push({ type: 'string', text: line.slice(i, j) });
        i = j;
      }
      // Decorator
      else if (line[i] === '@' && /\w/.test(line[i+1] || '')) {
        let j = i + 1;
        while (j < line.length && /\w/.test(line[j])) j++;
        // Include dotted decorators like @name.setter
        if (j < line.length && line[j] === '.') {
          j++;
          while (j < line.length && /\w/.test(line[j])) j++;
        }
        tokens.push({ type: 'decorator', text: line.slice(i, j) });
        i = j;
      }
      // Word (identifier or keyword)
      else if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\w]/.test(line[j])) j++;
        tokens.push({ type: 'word', text: line.slice(i, j) });
        i = j;
      }
      // Number
      else if (/\d/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\d.]/.test(line[j])) j++;
        tokens.push({ type: 'number', text: line.slice(i, j) });
        i = j;
      }
      // Other (operators, whitespace, punctuation)
      else {
        tokens.push({ type: 'plain', text: line[i] });
        i++;
      }
    }

    const KEYWORDS = new Set(['class','def','self','return','if','else','elif','for','in','while','try','except','raise','finally','import','from','as','pass','True','False','None','not','and','or','super','print','with','del','lambda','yield','type']);

    return tokens.map(t => {
      const esc = escapeHTML(t.text);
      switch (t.type) {
        case 'comment':   return `<span class="hl-comment">${esc}</span>`;
        case 'string':    return `<span class="hl-string">${esc}</span>`;
        case 'decorator': return `<span class="hl-decorator">${esc}</span>`;
        case 'number':    return `<span class="hl-number">${esc}</span>`;
        case 'word':      return KEYWORDS.has(t.text) ? `<span class="hl-keyword">${esc}</span>` : esc;
        default:          return esc;
      }
    }).join('');
  };

  return { loadLesson, loadQuiz, renderLesson };
})();
