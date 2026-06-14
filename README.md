# GradeAI

**Drop in your grades. Get instant analysis and AI coaching — for every class.**

GradeAI is a web app that takes your raw grade data (assignments, quizzes, tests, midterms, finals) and turns it into a clear picture of where you stand, what's dragging you down, and exactly what score you need on your next assignment to hit the grade you want.

---

## How it works

```
  ┌─────────────────────────────────────────────────────┐
  │  1. Enter your grades                               │
  │     • Paste a grade report, upload a PDF,           │
  │       or type scores in manually                    │
  └───────────────────────┬─────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  2. AI reads and structures the data                │
  │     • Extracts assignment names, scores, types,     │
  │       dates, category weights — automatically       │
  └───────────────────────┬─────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  3. Your dashboard appears instantly                │
  │     • Weighted final grade + letter grade           │
  │     • Charts, category breakdowns, stat cards       │
  │     • "What You Need" score calculator              │
  └───────────────────────┬─────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  4. AI coaching streams in                          │
  │     • Performance trends specific to your numbers   │
  │     • Honest, actionable advice — not generic tips  │
  └─────────────────────────────────────────────────────┘
```

---

## Features

### Flexible grade input
- **Paste a grade report** — copy text from your student portal and GradeAI parses it automatically
- **Upload a PDF** — upload your grade report PDF and the AI extracts everything
- **Type it manually** — enter scores one by one with full control over weights and categories

### Smart grade calculation
- Handles **category-weighted grading** (e.g. Homework 10%, Quizzes 20%, Tests 45%, Assignments 25%)
- Handles **points-based grading** with optional midterm and final exam weights
- Correctly accounts for **extra credit** — scores above max, or assignments with 0 max points
- Computes your **weighted final grade** and letter grade in real time

### Visual dashboard

```
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Final Grade │  │   Highest    │  │   Lowest     │  │  # Graded    │
  │   87.42%     │  │   98.50%     │  │   71.00%     │  │     24       │
  │      B+      │  │              │  │              │  │              │
  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

  Grade History (line chart — every assignment over time)
  ────────────────────────────────────────────────────────
        100% ┤         ●
         90% ┤    ●         ●    ●
         80% ┤●        ●         
         70% ┤              ●         
             └──────────────────────────────────────────▶

  Category Breakdown
  ────────────────────────────────────────────────────────
  HW  ████████████████░░░░  82.4%  (10% of grade, 8 items)
  QZ  ██████████████░░░░░░  75.1%  (20% of grade, 5 items)
  TS  ████████████████████  91.3%  (45% of grade, 4 items)
  GA  ███████████████░░░░░  88.0%  (25% of grade, 3 items)
```

### "What You Need" calculator
Tells you the exact score you need on your next assignment to reach — or hold — each letter grade tier:

```
  Score needed on your next Homework (~100 pts):

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │   ↑ Reach    │  │   ● Maintain │  │   ↓ Floor of │
  │      A-      │  │      B+      │  │      B       │
  │    94 / 100  │  │    72 / 100  │  │   Safe ✓     │
  │  Get ≥ this  │  │  Get ≥ this  │  │ Can't drop   │
  │   to reach   │  │  to maintain │  │  here in one │
  └──────────────┘  └──────────────┘  └──────────────┘
```

### Multi-class radar chart
When you enter two or more classes, a radar chart lets you see your relative strengths and weaknesses across subjects at a glance.

```
              Math
               100
          ┌────●────┐
  English ●         ● Chemistry
          └────●────┘
            History
```

### AI-powered coaching (streams in live)
After your dashboard loads, Claude analyzes your specific numbers and writes two things:
- **Trends** — what patterns your scores actually show (references real numbers, flags alarming grades, notes extra credit)
- **Coaching advice** — specific, honest actions tied to exactly what your data says

### Persists across sessions
Everything you enter is saved automatically in your browser. Come back tomorrow and your classes and analyses are right where you left them.

---

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/chiragmenonr/GradeAI.git
cd GradeAI

# 2. Install dependencies
npm install

# 3. Add your API key
#    Create a file called .env in the project root:
echo "VITE_ANTHROPIC_API_KEY=your_api_key_here" > .env

# 4. Start the dev server
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
npm run preview
```

---

## Usage guide

### Option 1 — Paste your grade report
1. Log into your student portal and find your grade breakdown
2. Select all the text on the page and copy it (`Cmd+A`, `Cmd+C`)
3. Paste it into the text area in GradeAI
4. Click **Parse with AI** — the app reads it and fills in all your grades automatically

### Option 2 — Upload a PDF
1. Export or download your grade report as a PDF
2. Click the PDF upload button in the input panel
3. GradeAI sends it to Claude, which extracts every assignment, score, and weight

### Option 3 — Enter manually
1. Type your subject name
2. Add each assignment with its score and max points
3. Optionally tag each one with a type (HW, QZ, TS, GA, XC)
4. Add midterm / final weights if your class uses them
5. Hit **Analyze**

You can add as many classes as you want and analyze them all at once.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| AI | Anthropic Claude (claude-sonnet-4-6) via the Anthropic SDK |

---

## Project structure

```
src/
├── api/
│   ├── analyzeGrades.ts   — streams AI coaching via Claude
│   └── parseGrades.ts     — extracts grade data from text or PDF via Claude
├── components/
│   ├── ClassCard.tsx       — per-class input panel (paste / manual modes)
│   ├── ResultsDashboard.tsx — the full analysis view for one class
│   ├── StatCards.tsx       — top-line grade stat cards
│   ├── GradeChart.tsx      — line chart for grade history
│   ├── CombinedTypeChart.tsx — overlaid Tests vs Quizzes chart
│   ├── SubjectRadar.tsx    — multi-class radar chart
│   ├── WhatYouNeed.tsx     — score-needed calculator
│   ├── StreamingInsight.tsx — live-streaming AI coaching text
│   └── Skeleton.tsx        — loading placeholders
├── utils/
│   ├── gradeCalculations.ts — weighted grade engine + score-needed math
│   └── parseGrades.ts      — client-side grade parsing utilities
├── types.ts                — shared TypeScript interfaces
└── App.tsx                 — main app shell and state
```

---

## Environment variables

| Variable | Description |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com/) |

> **Note:** The API key is used directly from the browser. This is fine for local/personal use, but do not deploy this publicly with a shared key — anyone who visits the page could use your API quota.
