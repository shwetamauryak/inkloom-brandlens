# Disclosures & Attribution

This document discloses all libraries, APIs, external dependencies, datasets, templates, and AI tools used in BrandLens for CodeNova India 2026 Round 2.

## 1. AI Coding Assistance Disclosure
- **AI Coding Assistant**: Built with the assistance of Google DeepMind's Antigravity agentic coding platform.
- **Earlier prototype and documents**: An earlier version of the prototype and repository documents was drafted with Anthropic's Claude.
- **Human Role**: Architecture design, engineering decisions, requirement specification, quality assurance, and code validation were performed directly by the hackathon participant.

## 2. External APIs & AI Models
- **Google Gemini API** (model set by `GEMINI_MODEL`, default `gemini-2.5-flash`): Used server-side in `/api/ai-review` for semantic tone and claim verification.
- **Groq API**: Used server-side in `/api/ai-review` as a fallback AI provider when the primary provider is unavailable. 
- **Anthropic Claude API** (model set by `ANTHROPIC_MODEL`): Alternative serverless LLM adapter.
- No client-side LLM API keys are ever stored or exposed.

## 3. Third-Party Libraries & CDNs
- **Mammoth.js (v1.6.0)**: Loaded from pinned CDN (`cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js`) for browser-side `.docx` text extraction without server uploads.
- No test framework dependency. Evaluation is done with a Python script (`evaluate_violations.py`).

## 4. UI Templates & Styles
- Clean, hand-crafted vanilla CSS with custom design tokens for light/dark mode and responsive layouts. No bulky UI frameworks (Bootstrap, Tailwind, etc.) were imported to maintain speed and zero-dependency reliability.

## 5. Privacy & Data Handling
- **No Data Retention**: The serverless `/api/ai-review` route processes requests statelessly in memory and does not log, persist, or store user-submitted content.
- **PII Warning**: Client-side scanning checks for email addresses and telephone numbers before transmitting data to the AI endpoint.
