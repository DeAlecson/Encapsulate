/* =========================================================
   fallback-marker.js — Offline rule-based marking
   Phase 4: returns same normalised format as AI marking
   ========================================================= */

const FallbackMarker = (() => {

  /* ---------- mark a code task offline ---------- */
  const markCode = (task, studentCode, strictness) => {
    // Reuse the existing check-based evaluator
    const checks = task.checks || [];
    const passed = [];
    const failed = [];

    for (const check of checks) {
      let match = false;
      const codeNorm = studentCode.replace(/\s+/g, ' ').trim();

      if (check.type === 'keyword') {
        match = codeNorm.includes(check.value.replace(/\s+/g, ' '));
      } else if (check.type === 'pattern') {
        try { match = new RegExp(check.value, 's').test(studentCode); }
        catch { match = false; }
      }

      (match ? passed : failed).push(check);
    }

    const total = checks.length;
    const score = total > 0 ? Math.round((passed.length / total) * 100) : 0;
    const pct = total > 0 ? passed.length / total : 0;

    let verdict = 'incorrect';
    if (pct >= 0.9) verdict = 'correct';
    else if (pct >= 0.5) verdict = 'partially_correct';

    // Build strengths and mistakes from check labels
    const strengths = passed.map(c => c.label);
    const mistakes = failed.map(c => `Missing: ${c.label}`);

    // Strictness-tuned encouragement
    const encourageMap = {
      tutor:  verdict === 'correct' ? 'Great job! You nailed it.' : 'Keep going — you are making progress!',
      guided: verdict === 'correct' ? 'Correct.' : 'Review the items above and try again.',
      exam:   verdict === 'correct' ? 'Correct.' : 'Incomplete submission.',
      brutal: verdict === 'correct' ? 'Fine.' : 'Not even close. Try harder.'
    };

    const hintMap = {
      tutor:  task.hintLadder ? [task.hintLadder[0]] : [],
      guided: task.commonMistakes ? [`Watch for: ${task.commonMistakes[0]}`] : [],
      exam:   [],
      brutal: []
    };

    return {
      verdict,
      score,
      strengths,
      mistakes,
      missing_concepts: failed.length > 0 ? [task.concept] : [],
      hints: hintMap[strictness] || hintMap.tutor,
      corrected_answer: verdict !== 'correct' ? task.modelAnswer : '',
      encouragement: encourageMap[strictness] || encourageMap.tutor,
      next_step: verdict === 'correct' ? 'Move on to the next exercise.' : `Revisit the ${task.concept} lesson section, then retry.`,
      source: 'offline',
      // Keep raw check data for the existing feedback renderer
      passed,
      failed,
      total
    };
  };

  /* ---------- mark a theory/short answer offline ---------- */
  const markTheory = (question, studentAnswer, strictness, modelAnswer) => {
    if (!studentAnswer || !studentAnswer.trim()) {
      return {
        verdict: 'incorrect',
        score: 0,
        strengths: [],
        mistakes: ['No answer provided'],
        missing_concepts: [question.concept || 'Unknown'],
        hints: ['Try writing at least one key point from the topic.'],
        corrected_answer: modelAnswer || '',
        encouragement: strictness === 'brutal' ? 'You submitted nothing.' : 'Give it a try first — even a partial answer helps.',
        next_step: 'Review the lesson and attempt this question again.',
        source: 'offline',
        passed: [],
        failed: [],
        total: 0
      };
    }

    // Simple keyword matching against model answer and rubric
    const answerLower = studentAnswer.toLowerCase();
    const rubricPoints = question.expectedKeyPoints || question.rubricPoints || [];
    const matched = [];
    const missed = [];

    if (rubricPoints.length > 0) {
      for (const point of rubricPoints) {
        // Check if any significant word from the point appears in the answer
        const words = point.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const found = words.some(w => answerLower.includes(w));
        (found ? matched : missed).push(point);
      }
    } else if (modelAnswer) {
      // Fallback: compare key tokens from model answer
      const modelTokens = modelAnswer.toLowerCase()
        .replace(/[^a-z0-9_\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
      const uniqueTokens = [...new Set(modelTokens)].slice(0, 10);
      for (const token of uniqueTokens) {
        (answerLower.includes(token) ? matched : missed).push(token);
      }
    }

    const total = matched.length + missed.length;
    const score = total > 0 ? Math.round((matched.length / total) * 100) : 30; // give some credit for attempting
    const pct = total > 0 ? matched.length / total : 0;

    let verdict = 'incorrect';
    if (pct >= 0.7) verdict = 'correct';
    else if (pct >= 0.35) verdict = 'partially_correct';

    const encourageMap = {
      tutor:  verdict === 'correct' ? 'Well explained!' : 'You have some of the right ideas. Let us fill in the gaps.',
      guided: verdict === 'correct' ? 'Good answer.' : 'Review what is missing below.',
      exam:   verdict === 'correct' ? 'Correct.' : 'Incomplete answer.',
      brutal: verdict === 'correct' ? 'Acceptable.' : 'Weak answer. Study more.'
    };

    return {
      verdict,
      score,
      strengths: matched.length > 0 ? [`Mentioned: ${matched.join(', ')}`] : [],
      mistakes: missed.length > 0 ? [`Missing: ${missed.join(', ')}`] : [],
      missing_concepts: missed.length > 0 ? [question.concept || 'Review the topic'] : [],
      hints: strictness === 'tutor' || strictness === 'guided' ? (missed.length > 0 ? [`Try including: ${missed[0]}`] : []) : [],
      corrected_answer: modelAnswer || '',
      encouragement: encourageMap[strictness] || encourageMap.tutor,
      next_step: verdict === 'correct' ? 'Try a harder question on this topic.' : 'Re-read the lesson and focus on the missing points.',
      source: 'offline',
      passed: matched.map(m => ({ label: m })),
      failed: missed.map(m => ({ label: m })),
      total
    };
  };

  return { markCode, markTheory };
})();
