/* =========================================================
   quiz-engine.js — Quiz rendering, scoring, weak topic tracking
   Phase 2: static quiz bank, MCQ, output prediction, error spotting
   ========================================================= */

const QuizEngine = (() => {
  const { $, escapeHTML, toast } = Utils;

  let _quiz = null;
  let _currentIdx = 0;
  let _answers = [];
  let _unitId = null;

  /* ---------- start a unit quiz ---------- */
  const startUnitQuiz = async (unitId) => {
    const main = $('#main-content');
    main.innerHTML = '<div class="loading">Loading quiz...</div>';

    const data = await LessonEngine.loadQuiz(unitId);
    if (!data || !data.questions || data.questions.length === 0) {
      main.innerHTML = `
        <div class="placeholder-page">
          <span class="placeholder-page__icon">📝</span>
          <h1 class="placeholder-page__title">No quiz available yet</h1>
          <p class="placeholder-page__desc">Quiz content for this unit is coming soon.</p>
          <button class="btn btn--secondary" onclick="Router.navigate('/units/${unitId}')">← Back to unit</button>
        </div>`;
      return;
    }

    _quiz = data;
    _unitId = unitId;
    _currentIdx = 0;
    _answers = new Array(data.questions.length).fill(null);

    renderQuestion();
  };

  /* ---------- render current question ---------- */
  const renderQuestion = () => {
    const main = $('#main-content');
    if (!_quiz) return;

    const q = _quiz.questions[_currentIdx];
    const total = _quiz.questions.length;
    const pct = Math.round(((_currentIdx + 1) / total) * 100);
    const answered = _answers[_currentIdx] !== null;

    main.innerHTML = `
      <div class="quiz-view">
        <div class="quiz-header">
          <button class="btn btn--ghost btn--small" onclick="Router.navigate('/units/${_unitId}')">← Back</button>
          <span class="quiz-header__counter">Question ${_currentIdx + 1} of ${total}</span>
        </div>

        <div class="lesson-progress">
          <div class="lesson-progress__fill" style="width:${pct}%"></div>
        </div>

        <div class="quiz-card">
          <span class="section-badge section-badge--checkpoint">${q.type === 'output_prediction' ? '🔍 Output Prediction' : q.type === 'error_spotting' ? '🐛 Error Spotting' : '❓ MCQ'}</span>
          <span class="quiz-card__concept">Concept: ${escapeHTML(q.concept)}</span>
          <div class="quiz-card__prompt">${formatPrompt(q.prompt)}</div>

          <div class="checkpoint__choices" id="quiz-choices">
            ${q.choices.map((c, i) => `
              <button class="choice-btn ${answered ? (i === q.answer ? 'choice-btn--correct' : (i === _answers[_currentIdx] ? 'choice-btn--wrong' : 'choice-btn--dim')) : ''}"
                      data-index="${i}"
                      ${answered ? 'disabled' : ''}>
                <span class="choice-btn__letter">${String.fromCharCode(65 + i)}</span>
                <span class="choice-btn__text">${formatChoiceText(c)}</span>
              </button>
            `).join('')}
          </div>

          ${answered ? `
            <div class="checkpoint__feedback ${_answers[_currentIdx] === q.answer ? 'checkpoint__feedback--correct' : 'checkpoint__feedback--wrong'}">
              ${_answers[_currentIdx] === q.answer ? '✓ Correct!' : '✗ Not quite.'}
              <p>${escapeHTML(q.explanation)}</p>
              ${q.commonMistakes ? `<p class="common-mistakes"><strong>Common mistake:</strong> ${escapeHTML(q.commonMistakes[0])}</p>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="lesson-nav">
          <button class="btn btn--secondary" id="quiz-prev" ${_currentIdx === 0 ? 'disabled' : ''}>← Previous</button>
          ${_currentIdx === total - 1 ? `
            <button class="btn btn--primary" id="quiz-finish" ${!allAnswered() ? 'disabled' : ''}>See results</button>
          ` : `
            <button class="btn btn--primary" id="quiz-next">Next →</button>
          `}
        </div>
      </div>
    `;

    bindQuizEvents();
  };

  /* ---------- format prompt with code blocks ---------- */
  const formatPrompt = (text) => {
    let html = escapeHTML(text);
    // Handle \n as actual newlines in code-like prompts
    html = html.replace(/\\n/g, '\n');
    if (html.includes('\n') && (html.includes('class ') || html.includes('def ') || html.includes('print'))) {
      // This looks like code — wrap in a code block
      const lines = html.split('\n');
      let inCode = false;
      let result = '';
      let codeBlock = '';

      for (const line of lines) {
        if (!inCode && (line.trim().startsWith('class ') || line.trim().startsWith('def ') || line.trim().startsWith('from ') || line.trim().startsWith('import '))) {
          inCode = true;
          codeBlock = line;
        } else if (inCode && (line.trim() === '' && codeBlock.trim() === '')) {
          inCode = false;
        } else if (inCode) {
          codeBlock += '\n' + line;
        } else {
          result += '<p>' + line + '</p>';
        }
      }

      if (codeBlock) {
        result += `<pre class="code-block"><code>${codeBlock}</code></pre>`;
      }
      return result || '<p>' + html.replace(/\n/g, '<br>') + '</p>';
    }

    return '<p>' + html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
  };

  const formatChoiceText = (text) => {
    let html = escapeHTML(text);
    html = html.replace(/\\n/g, '<br>');
    return html;
  };

  /* ---------- bind quiz events ---------- */
  const bindQuizEvents = () => {
    // Choice buttons
    document.querySelectorAll('#quiz-choices .choice-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.index);
        _answers[_currentIdx] = idx;

        const q = _quiz.questions[_currentIdx];
        if (idx === q.answer) {
          Gamification.awardXP(10, 'Quiz correct');
        } else {
          trackWeakTopic(q.concept, _unitId);
        }

        renderQuestion();
      };
    });

    const prev = $('#quiz-prev');
    const next = $('#quiz-next');
    const finish = $('#quiz-finish');

    if (prev) prev.onclick = () => {
      if (_currentIdx > 0) { _currentIdx--; renderQuestion(); window.scrollTo(0, 0); }
    };
    if (next) next.onclick = () => {
      if (_currentIdx < _quiz.questions.length - 1) { _currentIdx++; renderQuestion(); window.scrollTo(0, 0); }
    };
    if (finish) finish.onclick = () => {
      showResults();
    };
  };

  const allAnswered = () => _answers.every(a => a !== null);

  /* ---------- show results ---------- */
  const showResults = () => {
    const main = $('#main-content');
    const total = _quiz.questions.length;
    const correct = _answers.filter((a, i) => a === _quiz.questions[i].answer).length;
    const pct = Math.round((correct / total) * 100);

    // Update mastery
    Storage.updateProgress(p => {
      if (!p.completedQuizzes.includes(_unitId + '_quiz')) {
        p.completedQuizzes.push(_unitId + '_quiz');
      }
      if (!p.masteryMap[_unitId]) p.masteryMap[_unitId] = 0;
      p.masteryMap[_unitId] = Math.min(100, p.masteryMap[_unitId] + Math.round(pct * 0.7));

      // Save wrong answers to review vault
      _answers.forEach((a, i) => {
        if (a !== _quiz.questions[i].answer) {
          const wrongEntry = {
            questionId: _quiz.questions[i].id,
            unitId: _unitId,
            concept: _quiz.questions[i].concept,
            yourAnswer: a,
            correctAnswer: _quiz.questions[i].answer,
            timestamp: new Date().toISOString()
          };
          p.wrongAnswers.push(wrongEntry);
          // Keep last 100
          if (p.wrongAnswers.length > 100) p.wrongAnswers = p.wrongAnswers.slice(-100);
        }
      });
    });

    Gamification.awardXP(correct * 5, `Quiz: ${correct}/${total}`);
    Gamification.refreshHeader();

    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '🤔' : '💪';
    const message = pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job! A few more to review.' : pct >= 40 ? 'Keep going. Review the mistakes below.' : 'No worries, learning takes practice. Let us review.';

    main.innerHTML = `
      <div class="quiz-results">
        <div class="results-hero">
          <span class="results-hero__emoji">${emoji}</span>
          <h1 class="results-hero__score">${correct} / ${total}</h1>
          <p class="results-hero__pct">${pct}% correct</p>
          <p class="results-hero__msg">${message}</p>
        </div>

        <div class="results-breakdown">
          ${_quiz.questions.map((q, i) => {
            const isCorrect = _answers[i] === q.answer;
            return `
              <div class="result-item ${isCorrect ? 'result-item--correct' : 'result-item--wrong'}">
                <span class="result-item__icon">${isCorrect ? '✓' : '✗'}</span>
                <div class="result-item__info">
                  <span class="result-item__concept">${escapeHTML(q.concept)}</span>
                  ${!isCorrect ? `<p class="result-item__explain">${escapeHTML(q.explanation)}</p>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="results-actions">
          <button class="btn btn--primary" onclick="QuizEngine.startUnitQuiz('${_unitId}')">Retry quiz</button>
          <button class="btn btn--secondary" onclick="Router.navigate('/units/${_unitId}')">Back to unit</button>
          <button class="btn btn--secondary" onclick="Router.navigate('/')">Dashboard</button>
        </div>
      </div>
    `;
  };

  /* ---------- weak topic tracking ---------- */
  const trackWeakTopic = (concept, unitId) => {
    Storage.updateProgress(p => {
      const existing = p.weakTopics.find(t => t.concept === concept && t.unitId === unitId);
      if (existing) {
        existing.count++;
        existing.lastSeen = new Date().toISOString();
      } else {
        p.weakTopics.push({
          concept,
          unitId,
          count: 1,
          lastSeen: new Date().toISOString()
        });
      }
      // Keep top 20 weak topics
      p.weakTopics.sort((a, b) => b.count - a.count);
      if (p.weakTopics.length > 20) p.weakTopics = p.weakTopics.slice(0, 20);
    });
  };

  return { startUnitQuiz, trackWeakTopic };
})();
