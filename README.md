# </> PlainCode

**Understand any code in seconds.** PlainCode takes any code snippet and produces a clear explanation tailored to your technical level — powered by a 3-layer AI accuracy pipeline.

Free. No sign-up required.

---

## What It Does

Paste code (or upload a file), pick your audience level, and get a structured explanation with:

- **Summary** — What the code does at a glance
- **Breakdown** — Step-by-step walkthrough of key parts
- **Analogy** — A real-world comparison to make it click
- **Data Map** — What goes in, what comes out, what transforms
- **Flow Diagram** — Auto-generated Mermaid.js flowchart of the logic
- **Confidence Score** — A 0–100 accuracy rating from a 3-layer AI check

## Features

### 5 Audience Levels

Tailor explanations to exactly who's reading:

| Level | Best For |
|-------|----------|
| **ELI5** | Anyone — uses everyday analogies, zero jargon |
| **Non-Technical** | Non-programmers — plain English, real-world comparisons |
| **Business** | PMs & executives — focuses on user impact and business value |
| **Tech Non-Dev** | Data analysts, sysadmins, tech writers — technical vocab, no code syntax |
| **Developer** | Fellow engineers — design patterns, edge cases, complexity analysis |

Changing the audience level automatically re-explains the same code.

### Diff Mode

Compare two versions of code side-by-side and get an explanation of **what changed and why it matters**. Perfect for reviewing pull requests.

- Paste "Before" and "After" code
- Get the same structured explanation, focused on the differences
- Supports up to 25,000 characters per side

### Follow-Up Q&A

After an explanation is generated, ask follow-up questions in a built-in chat:

- Full context of your code and explanation is preserved
- Conversation history maintained (last 6 exchanges)
- Streamed responses in real-time

### 15 Output Languages

Get explanations in: English, Spanish, French, German, Portuguese, Japanese, Chinese (Simplified), Korean, Italian, Russian, Arabic, Hindi, Dutch, Turkish, or Polish.

### Privacy Mode

Toggle privacy mode on the explain page to ensure your code is never stored or used for model training. Adds Anthropic's `no-training` header to all API calls.

### File Upload

Upload code files directly instead of pasting:

- Drag & drop onto the editor, or click to pick a file
- Supports 16+ extensions: `.js`, `.ts`, `.py`, `.java`, `.rs`, `.go`, `.sql`, `.sh`, `.rb`, `.php`, `.cs`, `.cpp`, `.c`, `.json`, `.md`, `.txt`, and more

### Dark Mode

Full light and dark theme support with system detection. Toggle via the moon/sun icon in the navbar.

### Keyboard Shortcuts

- **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows/Linux) — Trigger explanation
- **Enter** in Q&A — Send message

---

## How the 3-Layer AI Pipeline Works

PlainCode doesn't just ask an AI to explain code — it runs a 3-layer pipeline to ensure accuracy:

```
┌─────────────────────────────────────────────┐
│  Layer 1: Intent Analysis (Claude Haiku)    │
│  → Detects language, purpose, complexity    │
│  → Grounds the explanation                  │
├─────────────────────────────────────────────┤
│  Layer 2: Explanation (Claude Sonnet)       │
│  → Generates the full structured response   │
│  → Streams in real-time via SSE             │
├─────────────────────────────────────────────┤
│  Layer 3: Adversarial Validation (Haiku)    │
│  → Checks explanation against code          │
│  → Identifies and auto-corrects errors      │
│  → Adjusts confidence score                 │
└─────────────────────────────────────────────┘
```

If Layer 3 finds errors, the explanation is automatically revised and re-validated before the final confidence score is calculated.

---

## Tech Stack

- **Framework:** Next.js 14 / React 18 / TypeScript
- **Styling:** Tailwind CSS v4
- **Code Editor:** CodeMirror 6
- **Diagrams:** Mermaid.js
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`, `claude-haiku-4-5-20251001`)
- **Validation:** Zod
- **UI Primitives:** Radix UI
- **Theming:** next-themes

---

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/PlainCode.git
cd PlainCode

# Install dependencies
npm install

# Set your API key
cp .env.example .env.local
# Edit .env.local and add: ANTHROPIC_API_KEY=sk-ant-...

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

The app uses Next.js standalone output mode for containerized deployments (Railway, Docker, etc.).

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/explain` | Explain a code snippet (SSE stream) |
| `POST` | `/api/explain-diff` | Explain changes between two code versions (SSE stream) |
| `POST` | `/api/qa` | Ask a follow-up question (SSE stream) |
| `GET` | `/api/health` | Health check with env warnings |

All streaming endpoints return Server-Sent Events with JSON payloads.

---

## License

Proprietary. All rights reserved.
