/* =========================================================
   ai.js — Anthropic API service for Encapsulate
   Phase 4: request, parse, error handling, status tracking
   ========================================================= */

const AI = (() => {
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-haiku-4-5-20251001';
  const MAX_TOKENS = 1024;
  const TIMEOUT_MS = 30000;

  /* ---------- status tracking ---------- */
  // 'none' | 'ready' | 'loading' | 'error' | 'offline'
  let _status = 'none';
  let _lastError = '';

  const getStatus = () => {
    const key = Storage.getApiKey();
    if (!key) return 'none';
    if (!navigator.onLine) return 'offline';
    return _status === 'error' ? 'error' : 'ready';
  };

  const getLastError = () => _lastError;

  /* ---------- main request function ---------- */
  const request = async (systemPrompt, userMessage) => {
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      _status = 'none';
      throw new Error('NO_API_KEY');
    }

    if (!navigator.onLine) {
      _status = 'offline';
      throw new Error('OFFLINE');
    }

    _status = 'loading';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        _status = 'error';

        if (response.status === 401) {
          _lastError = 'Invalid API key';
          throw new Error('INVALID_KEY');
        }
        if (response.status === 429) {
          _lastError = 'Rate limited — try again in a moment';
          throw new Error('RATE_LIMITED');
        }
        if (response.status === 529 || response.status === 503) {
          _lastError = 'Anthropic API is temporarily overloaded';
          throw new Error('API_OVERLOADED');
        }

        _lastError = `API error ${response.status}`;
        throw new Error('API_ERROR');
      }

      const data = await response.json();
      _status = 'ready';
      _lastError = '';

      // Extract text content
      const textBlock = (data.content || []).find(b => b.type === 'text');
      if (!textBlock || !textBlock.text) {
        throw new Error('EMPTY_RESPONSE');
      }

      return textBlock.text;

    } catch (err) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        _status = 'error';
        _lastError = 'Request timed out';
        throw new Error('TIMEOUT');
      }

      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
        _status = 'offline';
        _lastError = 'Network error';
        throw new Error('NETWORK_ERROR');
      }

      // Re-throw known errors
      if (['NO_API_KEY','OFFLINE','INVALID_KEY','RATE_LIMITED','API_OVERLOADED','API_ERROR','EMPTY_RESPONSE','TIMEOUT','NETWORK_ERROR'].includes(err.message)) {
        throw err;
      }

      _status = 'error';
      _lastError = err.message || 'Unknown error';
      throw new Error('UNKNOWN_ERROR');
    }
  };

  /* ---------- parse JSON from AI response ---------- */
  const parseMarkingResponse = (rawText) => {
    // Strip markdown fences if present
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      return normaliseResponse(parsed);
    } catch {
      // Try to extract JSON from within text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return normaliseResponse(parsed);
        } catch { /* fall through */ }
      }
      throw new Error('PARSE_ERROR');
    }
  };

  /* ---------- normalise response into standard shape ---------- */
  const normaliseResponse = (raw) => {
    return {
      verdict:           raw.verdict || 'incorrect',
      score:             typeof raw.score === 'number' ? Math.min(100, Math.max(0, raw.score)) : 0,
      strengths:         Array.isArray(raw.strengths) ? raw.strengths : [],
      mistakes:          Array.isArray(raw.mistakes) ? raw.mistakes : [],
      missing_concepts:  Array.isArray(raw.missing_concepts) ? raw.missing_concepts : (Array.isArray(raw.concept_gaps) ? raw.concept_gaps : []),
      hints:             Array.isArray(raw.hints) ? raw.hints : (raw.hint ? [raw.hint] : []),
      corrected_answer:  raw.corrected_answer || raw.improved_answer || '',
      encouragement:     raw.encouragement || '',
      next_step:         raw.next_step || '',
      source:            'ai'
    };
  };

  /* ---------- check if AI is available ---------- */
  const isAvailable = () => {
    return !!Storage.getApiKey() && navigator.onLine;
  };

  return {
    request,
    parseMarkingResponse,
    normaliseResponse,
    isAvailable,
    getStatus,
    getLastError
  };
})();
