/* =========================================================
   marking-service.js — Unified marking service for Encapsulate
   Phase 4: AI-first with automatic fallback, feedback history
   ========================================================= */

const MarkingService = (() => {
  const { toast } = Utils;

  /* ===================================================================
     MARK CODE — tries AI first, falls back to offline
     =================================================================== */
  const markCode = async (task, studentCode) => {
    const strictness = Storage.getSettings().strictness || 'tutor';
    const useAI = Storage.getSettings().aiMarking && AI.isAvailable();

    let result;

    if (useAI) {
      try {
        const prompts = AIPrompts.buildCodeReviewPrompt(task, studentCode, strictness);
        const rawText = await AI.request(prompts.system, prompts.user);
        result = AI.parseMarkingResponse(rawText);
      } catch (err) {
        console.warn('AI marking failed, falling back:', err.message);
        const friendlyMsg = getFriendlyError(err.message);
        toast(friendlyMsg, 'warn', 4000);
        result = FallbackMarker.markCode(task, studentCode, strictness);
      }
    } else {
      result = FallbackMarker.markCode(task, studentCode, strictness);
    }

    // Save to feedback history
    saveFeedbackHistory({
      type: 'code',
      taskId: task.id,
      unitId: task.unitId || '',
      concept: task.concept,
      studentAnswer: studentCode,
      result,
      strictness,
      timestamp: new Date().toISOString()
    });

    return result;
  };

  /* ===================================================================
     MARK THEORY — tries AI first, falls back to offline
     =================================================================== */
  const markTheory = async (question, studentAnswer, modelAnswer) => {
    const strictness = Storage.getSettings().strictness || 'tutor';
    const useAI = Storage.getSettings().aiMarking && AI.isAvailable();

    let result;

    if (useAI) {
      try {
        const prompts = AIPrompts.buildTheoryReviewPrompt(
          question, studentAnswer, strictness,
          question.expectedKeyPoints || question.rubricPoints || null,
          modelAnswer || question.modelAnswer || ''
        );
        const rawText = await AI.request(prompts.system, prompts.user);
        result = AI.parseMarkingResponse(rawText);
      } catch (err) {
        console.warn('AI theory marking failed, falling back:', err.message);
        const friendlyMsg = getFriendlyError(err.message);
        toast(friendlyMsg, 'warn', 4000);
        result = FallbackMarker.markTheory(question, studentAnswer, strictness, modelAnswer);
      }
    } else {
      result = FallbackMarker.markTheory(question, studentAnswer, strictness, modelAnswer);
    }

    // Save to feedback history
    saveFeedbackHistory({
      type: 'theory',
      questionId: question.id || '',
      concept: question.concept || '',
      studentAnswer,
      result,
      strictness,
      timestamp: new Date().toISOString()
    });

    return result;
  };

  /* ===================================================================
     FEEDBACK HISTORY
     =================================================================== */
  const saveFeedbackHistory = (entry) => {
    Storage.updateProgress(p => {
      if (!p.reviewHistory) p.reviewHistory = [];
      p.reviewHistory.push(entry);
      // Keep last 50
      if (p.reviewHistory.length > 50) {
        p.reviewHistory = p.reviewHistory.slice(-50);
      }
    });
  };

  const getFeedbackHistory = () => {
    const p = Storage.getProgress();
    return (p.reviewHistory || []).slice().reverse();
  };

  /* ===================================================================
     ERROR MESSAGE MAPPING
     =================================================================== */
  const getFriendlyError = (code) => {
    const map = {
      'NO_API_KEY':     'No API key set. Using offline marking.',
      'OFFLINE':        'You are offline. Using local marking.',
      'INVALID_KEY':    'API key is invalid. Check your key in settings.',
      'RATE_LIMITED':   'Too many requests. Try again shortly.',
      'API_OVERLOADED': 'Anthropic API is busy. Using offline marking.',
      'API_ERROR':      'API error occurred. Using offline marking.',
      'TIMEOUT':        'Request timed out. Using offline marking.',
      'NETWORK_ERROR':  'Network error. Using offline marking.',
      'EMPTY_RESPONSE': 'AI returned empty response. Using offline marking.',
      'PARSE_ERROR':    'Could not parse AI response. Using offline marking.',
      'UNKNOWN_ERROR':  'Something went wrong. Using offline marking.'
    };
    return map[code] || 'AI marking unavailable. Using offline marking.';
  };

  return { markCode, markTheory, getFeedbackHistory, getFriendlyError };
})();
