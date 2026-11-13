# BrandLens Architecture & Technical Design

## 1. System Overview

BrandLens uses a hybrid architecture designed for zero friction, high speed, and strict security:

```
[Browser / Client]
  │
  ├── Local Rule Engine (Regex, WCAG Math, Heuristics) -> Instant 0ms Feedback
  ├── In-Browser Parsers (Mammoth.js for .docx, File API for images)
  ├── Local State & Offline Fallback (localStorage)
  │
  └── [HTTP POST /api/ai-review] ──> [Vercel Serverless Function]
                                              │
                                              ├── Server Env: GEMINI_API_KEY / ANTHROPIC_API_KEY
                                              ├── Rate Limiting & Input Validation
                                              ├── Upstream LLM Call (Gemini / Claude, model chosen by environment variable)
                                              └── Return Raw JSON Candidates
  │
  └── Evidence Verification Filter (Client-side)
        ├── Exact substring check: quote in content?
        ├── Referential integrity: rule_id in KnowledgeBase & fact_id in Facts?
        └── Discard unverified findings ("AI suggested N, M verified, N-M discarded")
```

## 2. Key Components

### 2.1 Dual-Engine Content Audit
1. **Rule Engine**: Fast, deterministic regex checks for banned terms, capitalization, claims, and sentence length. Runs on keystroke without network calls.
2. **AI Adapter Engine**: Invoked on demand via `/api/ai-review` for semantic understanding (tone, unsupported claims).

### 2.2 Evidence Verification Layer
LLMs are prone to hallucination. To prevent false flags:
- Every candidate quote must be a verbatim substring of the analyzed content.
- Every referenced rule ID must exist in the active Knowledge Base.
- Every cited fact ID must exist in the Approved Facts.
Items failing these criteria are safely discarded, and the UI displays transparency metrics.

### 2.3 Visual Governance Engine
- Implements standard WCAG 2.1 relative luminance algorithms:
  $$L = 0.2126 \times R + 0.7152 \times G + 0.0722 \times B$$
  $$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
- Computes AA (4.5:1) and AAA (7:1) conformance for brand color pairings.
- Inspects client-uploaded image formats and dimensions using HTML5 Image elements.

### 2.4 Data Flow & State Management
- State is managed via a single reactive state object saved to `localStorage`.
- Optional Supabase connection for persistent cloud storage when keys are provided, with seamless local fallback if absent.
