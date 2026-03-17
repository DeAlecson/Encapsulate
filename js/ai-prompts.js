/* =========================================================
   ai-prompts.js — Prompt templates for Anthropic AI marking
   Phase 4: system prompts, strictness modes, payload builders
   ========================================================= */

const AIPrompts = (() => {

  const SYSTEM_BASE = `You are the marking assistant inside Encapsulate, a beginner-friendly ICT162-style OOP learning app.

Rules:
- explain in plain beginner-friendly language
- do not pretend code was executed
- review by structure and logic only
- be encouraging by default
- keep feedback short but useful
- identify the concept being tested
- tell the learner what is correct, what is missing, and what to do next

Return ONLY valid JSON. No markdown fences. No preamble.`;

  const STRICTNESS_PROMPTS = {
    tutor: `Review the student's answer in a forgiving tutor style.
Focus on learning, not punishment.
Accept partially correct structure when the idea is mostly right.
Explain one or two key fixes.
Be warm, clear, detailed, and beginner-friendly.
Include encouragement.`,

    guided: `Review the student's answer with moderate strictness.
Expect stronger structure and more accurate logic.
Still explain mistakes clearly.
Be helpful but expect more accuracy.`,

    exam: `Review the student's answer like an exam practice marker.
Be stricter. Do not reward vague answers.
Point out missing required parts.
Be concise and direct.`,

    brutal: `Review the student's answer very strictly.
Keep it concise. Do not soften major errors.
Still remain accurate and useful.
Be sarcastic but educational. Never be cruel or personal.
If the answer is terrible, roast it lightly but give one concrete fix.`
  };

  const RESPONSE_SCHEMA = `{
  "verdict": "correct | partially_correct | incorrect",
  "score": <number 0-100>,
  "strengths": ["what student did well"],
  "mistakes": ["specific errors found"],
  "missing_concepts": ["concepts the student appears to not understand"],
  "hints": ["actionable improvement hints"],
  "corrected_answer": "improved version of the student's code or answer",
  "encouragement": "one motivating sentence",
  "next_step": "what the student should do or study next"
}`;

  /* ---------- build code review payload ---------- */
  const buildCodeReviewPrompt = (task, studentCode, strictness) => {
    const mode = STRICTNESS_PROMPTS[strictness] || STRICTNESS_PROMPTS.tutor;

    const userMsg = `## Task
Concept: ${task.concept}
Type: ${task.type}
Difficulty: ${task.difficulty}/5

## Question
${task.prompt}

## Student's Code
\`\`\`python
${studentCode}
\`\`\`

## Expected Key Points
${(task.expectedKeyPoints || []).map(k => '- ' + k).join('\n')}

## Model Answer
\`\`\`python
${task.modelAnswer}
\`\`\`

## Common Mistakes to Watch For
${(task.commonMistakes || []).map(m => '- ' + m).join('\n')}

## Marking Mode
${mode}

## Response Format
Return ONLY this JSON structure (no markdown fences, no extra text):
${RESPONSE_SCHEMA}`;

    return {
      system: SYSTEM_BASE,
      user: userMsg
    };
  };

  /* ---------- build theory/short answer review payload ---------- */
  const buildTheoryReviewPrompt = (question, studentAnswer, strictness, rubricPoints, modelAnswer) => {
    const mode = STRICTNESS_PROMPTS[strictness] || STRICTNESS_PROMPTS.tutor;

    const userMsg = `## Question
${question.prompt || question}

## Concept Being Tested
${question.concept || 'General OOP knowledge'}

## Student's Answer
${studentAnswer}

${rubricPoints ? `## Rubric Points\n${rubricPoints.map(r => '- ' + r).join('\n')}` : ''}

${modelAnswer ? `## Model Answer\n${modelAnswer}` : ''}

## Marking Mode
${mode}

## Response Format
Return ONLY this JSON structure (no markdown fences, no extra text):
${RESPONSE_SCHEMA}`;

    return {
      system: SYSTEM_BASE,
      user: userMsg
    };
  };

  return {
    buildCodeReviewPrompt,
    buildTheoryReviewPrompt,
    STRICTNESS_PROMPTS,
    RESPONSE_SCHEMA
  };
})();
