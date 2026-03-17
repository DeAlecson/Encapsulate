# Encapsulate

> A mobile-friendly ICT162 OOP learning assistant with lessons, quizzes, code drills, offline progress, and optional Anthropic-powered AI marking.

---

## Repository Details

| Field | Value |
|---|---|
| **Repo name** | `encapsulate-ict162-oop-coach` |
| **Description** | A mobile-friendly ICT162 OOP learning assistant with quizzes, code drills, offline progress, and optional Anthropic-powered marking. |
| **Topics** | `python`, `oop`, `education`, `quiz-app`, `suss`, `ict162`, `pwa`, `static-site`, `github-pages` |
| **Visibility** | Public or Private (your choice) |
| **Licence** | MIT (recommended) or unlicensed |
| **Pages branch** | `main` — root folder `/` |

---

## What It Does

Encapsulate is a browser-based crash course for **SUSS ICT162 Object Oriented Programming**. It rewrites difficult exam-style material into beginner-friendly lessons, provides repeated practice through quizzes and coding exercises, and gives structured feedback — all without needing a backend or server.

The app is designed for a student who is anxious, new to coding, and struggles with reading complex exam wording. It lowers the barrier step by step, then rebuilds toward exam-level confidence.

### Features

**Learning**
- 7 guided lessons covering all ICT162 topics
- 68 lesson sections with explanations, code examples, worked examples, and checkpoints
- Beginner-friendly rewrites of seminar and lab material
- Resume exactly where you left off

**Practice**
- 33 quiz questions (MCQ, output prediction, error spotting) across all 6 units
- 10 coding drills with split-pane editor (left = prompt, right = code)
- Offline code evaluation using keyword and pattern matching
- Hint ladder, model answers, and retry on every exercise

**AI Marking (optional)**
- Anthropic Claude integration for code and theory review
- Structured JSON feedback: strengths, mistakes, concepts to review, corrected answer
- 4 strictness modes: Tutor (warm), Guided (moderate), Exam (strict), Brutal (no mercy)
- Automatic offline fallback if API is unavailable

**Gamification**
- XP, levels, and daily streaks
- Mastery percentage per unit
- Weak topic tracking and review vault
- Marking history with AI/offline source labels

**Offline and Privacy**
- Service worker caches the entire app for offline use
- API key stored in sessionStorage only (cleared on tab close)
- No analytics, no tracking, no cookies, no backend
- Progress export/import as JSON

---

## Quick Start

### Option 1: Open locally

1. Download and unzip the repository
2. Serve with any local HTTP server:
   ```bash
   # Python
   python3 -m http.server 8000

   # Node
   npx serve .

   # VS Code
   # Right-click index.html > Open with Live Server
   ```
3. Open `http://localhost:8000` in your browser
4. Start learning immediately — no API key needed

> **Note:** Opening `index.html` directly with `file://` will not work because the app fetches JSON data files. You need a local server.

### Option 2: Deploy to GitHub Pages

See the deployment section below.

---

## Content Coverage

The app covers all six ICT162 seminar topics with content drawn from SUSS seminar slides, lab exercises, TMA patterns, and past exam papers.

| Unit | Topic | Lessons | Quizzes | Code Drills |
|---|---|---|---|---|
| Welcome | Getting started | 6 sections | — | — |
| SU1 | Classes and Objects | 16 sections | 10 questions | 4 tasks |
| SU2 | Composition and Collection | 10 sections | 5 questions | 2 tasks |
| SU3 | Inheritance | 10 sections | 5 questions | 2 tasks |
| SU4 | Exception Handling | 10 sections | 5 questions | 2 tasks |
| SU5 | Python GUI (tkinter) | 7 sections | 4 questions | — |
| SU6 | SOLID and Design | 9 sections | 4 questions | — |
| **Total** | | **68 sections** | **33 questions** | **10 tasks** |

---

## GitHub Pages Deployment

### Step-by-step

1. Create a new repository on GitHub named `encapsulate-ict162-oop-coach`
2. Clone it locally:
   ```bash
   git clone https://github.com/<your-username>/encapsulate-ict162-oop-coach.git
   cd encapsulate-ict162-oop-coach
   ```
3. Copy all the app files into the repo root (not inside a subfolder)
4. Push:
   ```bash
   git add .
   git commit -m "Initial deploy"
   git push origin main
   ```
5. On GitHub, go to **Settings > Pages**
6. Under "Build and deployment", set:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
7. Click **Save**
8. Wait 1-2 minutes, then visit `https://<your-username>.github.io/encapsulate-ict162-oop-coach/`

### Deployment checklist

- [ ] All files are in the repo root (index.html is at the top level, not inside a folder)
- [ ] GitHub Pages is enabled on the `main` branch
- [ ] Site loads and shows the dashboard
- [ ] Lessons load when you click a unit
- [ ] Quizzes load and submit correctly
- [ ] Code drills show the split-pane editor
- [ ] Settings panel opens and saves theme/strictness
- [ ] App still works after going offline (service worker active after first load + refresh)

---

## File Structure

```
encapsulate-ict162-oop-coach/
│
├── index.html                   Single-page app shell
├── README.md                    This file
├── manifest.webmanifest         PWA manifest for install prompts
├── service-worker.js            Offline caching (41 assets)
│
├── css/
│   ├── themes.css               Dark/light theme tokens
│   ├── styles.css               All component styles (2,085 lines)
│   └── editor.css               Code editor base styles
│
├── js/
│   ├── storage.js               localStorage/sessionStorage persistence
│   ├── state.js                 In-memory reactive state
│   ├── utils.js                 DOM helpers, toast notifications, formatters
│   ├── router.js                Hash-based SPA routing
│   ├── gamification.js          XP, levels, streaks, badge definitions
│   ├── ai-prompts.js            Anthropic prompt templates (4 strictness modes)
│   ├── ai.js                    Anthropic API service (request, parse, timeout)
│   ├── fallback-marker.js       Offline rule-based code and theory marking
│   ├── marking-service.js       Unified orchestrator (AI-first with fallback)
│   ├── settings.js              Settings panel, API key status, theme controls
│   ├── lesson-engine.js         Lesson JSON loader, section renderer, navigation
│   ├── quiz-engine.js           MCQ engine, scoring, weak topic tracker
│   ├── practice-engine.js       Code drill engine, split-pane editor, evaluator
│   ├── renderer.js              Page renderers (dashboard, units, review, AI studio)
│   └── app.js                   Boot sequence, route registration, event binding
│
├── data/
│   ├── app-config.json          App-wide configuration and XP values
│   ├── units.json               Study unit registry and guided path order
│   ├── sample-progress.json     Demo progress file for import testing
│   │
│   ├── lessons/
│   │   ├── welcome.json         Onboarding (6 sections)
│   │   ├── su1.json             Classes and Objects (16 sections)
│   │   ├── su2.json             Composition and Collection (10 sections)
│   │   ├── su3.json             Inheritance (10 sections)
│   │   ├── su4.json             Exception Handling (10 sections)
│   │   ├── su5.json             Python GUI (7 sections)
│   │   └── su6.json             SOLID and Design (9 sections)
│   │
│   ├── quizzes/
│   │   ├── su1_quiz.json        Classes and Objects (10 questions)
│   │   ├── su2_quiz.json        Composition and Collection (5 questions)
│   │   ├── su3_quiz.json        Inheritance (5 questions)
│   │   ├── su4_quiz.json        Exception Handling (5 questions)
│   │   ├── su5_quiz.json        Python GUI (4 questions)
│   │   └── su6_quiz.json        SOLID and Design (4 questions)
│   │
│   └── coding/
│       ├── su1_coding.json      Classes and Objects (4 tasks)
│       ├── su2_coding.json      Composition and Collection (2 tasks)
│       ├── su3_coding.json      Inheritance (2 tasks)
│       └── su4_coding.json      Exception Handling (2 tasks)
│
└── assets/                      Placeholder for icons, badges, sounds
```

---

## How the API Key Works

Encapsulate can optionally use the **Anthropic Claude API** for richer AI-powered marking. Here is how it works:

1. Open **Settings** (gear icon, accessible from every page)
2. Paste your Anthropic API key (starts with `sk-ant-...`)
3. Click **Save key** — the key is stored in `sessionStorage` only
4. Click **Test connection** to verify it works
5. Submit code or theory answers — AI marking will be used automatically
6. If the API is unavailable (offline, error, timeout), the app falls back to offline marking seamlessly

**Security:**
- The key is stored in **sessionStorage** — it is automatically cleared when you close the browser tab
- The key is **never** saved to localStorage, cookies, or sent anywhere except `api.anthropic.com`
- The key is **never** included in progress exports
- You can clear the key at any time from Settings

**Without an API key:**
- All lessons, quizzes, and code drills work normally
- Code evaluation uses keyword/pattern matching (offline evaluator)
- Theory answers show model answers for self-comparison
- The app is 100% functional without any API key

---

## How to Add More Content

All content is stored as static JSON files. No code changes are needed to add questions.

### Add quiz questions

Edit `data/quizzes/su<N>_quiz.json` and add to the `questions` array:

```json
{
  "id": "su1_q11",
  "type": "mcq",
  "concept": "encapsulation",
  "prompt": "Why do we use double underscore __ for variable names?",
  "difficulty": 2,
  "choices": [
    "To make it public",
    "To trigger name mangling for privacy",
    "To make it a constant",
    "Python requires it"
  ],
  "answer": 1,
  "explanation": "Double underscore triggers name mangling, making the variable harder to access from outside the class.",
  "commonMistakes": ["Thinking __ makes it completely inaccessible"]
}
```

### Add coding drills

Edit `data/coding/su<N>_coding.json` and add to the `tasks` array:

```json
{
  "id": "su1_c5",
  "type": "write_class",
  "concept": "your concept",
  "prompt": "Write a class called Rectangle with width and height...",
  "difficulty": 2,
  "starterCode": "class Rectangle:\n    pass",
  "modelAnswer": "class Rectangle:\n    def __init__(self, width, height):\n        self.__width = width\n        self.__height = height\n\n    def area(self):\n        return self.__width * self.__height",
  "expectedKeyPoints": ["class Rectangle", "__init__", "self.__width", "area method"],
  "hintLadder": [
    "Start with class Rectangle: and def __init__(self, width, height):",
    "Store width and height as self.__width and self.__height",
    "The area method returns width * height"
  ],
  "commonMistakes": ["Forgetting self parameter", "Not making variables private"],
  "checks": [
    { "type": "keyword", "value": "class Rectangle", "label": "Class declared" },
    { "type": "keyword", "value": "__init__", "label": "Constructor defined" },
    { "type": "keyword", "value": "self.__width", "label": "Private width variable" },
    { "type": "keyword", "value": "def area", "label": "Area method defined" }
  ]
}
```

### Add lesson sections

Edit `data/lessons/su<N>.json` and add to the `sections` array. Valid section types: `intro`, `definition`, `example`, `worked_example`, `checkpoint`, `summary`.

For checkpoints with MCQs:
```json
{
  "type": "checkpoint",
  "title": "Quick check",
  "content": "Test question text",
  "question": {
    "type": "mcq",
    "prompt": "What does self refer to?",
    "choices": ["The class", "The current object", "The parent", "Nothing"],
    "answer": 1,
    "explanation": "self refers to the current object instance."
  }
}
```

---

## Privacy

| Storage | What | Persists |
|---|---|---|
| **localStorage** | Progress, scores, settings, lesson positions, feedback history, code drafts | Yes — across sessions |
| **sessionStorage** | Anthropic API key only | No — cleared on tab close |
| **Network** | API calls to `api.anthropic.com` only when API key is set and answer is submitted | Only when AI marking is used |

- No analytics or tracking scripts
- No cookies
- No data sent to any server except the Anthropic API (and only when you opt in by setting a key)
- Progress stays entirely in your browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (no framework) |
| Content | Static JSON files |
| AI (optional) | Anthropic Claude API (frontend-only, no backend proxy) |
| Offline | Service worker with cache-first strategy |
| Hosting | GitHub Pages compatible (static site) |
| Total size | ~260 KB uncompressed, ~83 KB zipped |

---

## Known Limitations

- **No code execution.** The offline evaluator checks code structure (keywords, patterns), not runtime behaviour. AI marking provides deeper logical analysis when available.
- **Frontend-only API calls.** Anthropic API is called directly from the browser using the `anthropic-dangerous-direct-browser-access` header. A backend proxy would be needed for production-grade key security.
- **Static content.** Quiz and lesson banks are fixed JSON files. Adaptive question generation would require AI integration.
- **Single-device progress.** localStorage is browser-specific. Cross-device sync would require a backend.
- **Service worker activation.** The service worker caches assets on first visit but requires a page reload to activate. After that, the app works fully offline.

---

## Future Enhancements (Optional)

These are not required for the app to work, but could be added later:

- Mock exam arena with timer and mixed-unit question sets
- Spaced repetition for wrong answers
- Badge unlock notifications and achievement popups
- Sound effects for XP gains and level-ups
- Coding drills for SU5 (GUI) and SU6 (SOLID)
- Expanded quiz banks (20+ questions per unit)
- AI-powered adaptive question generation
- Onboarding tutorial overlay for first-time users
- Leaderboard integration (would need a backend)

---

## Licence

Built for educational use in SUSS ICT162 Object Oriented Programming.

You are free to use, modify, and distribute this project for personal and educational purposes.
