# Inkloom BrandLens — Brand Governance Platform

> **Hackathon:** CodeNova India 2026 (Problem: Inkloom AI — Brand Governance Platform, Round 2)  
> **Demo Brand:** Brewly Coffee  
> **Live Public URL:** *(Will be added upon Vercel deployment)*

---

## 📌 Executive Summary

**BrandLens** is an AI-powered brand governance and content pre-publish audit platform. It prevents brand drift, regulatory fines, and misleading promotional claims before marketing and sales assets are published.

### Core Workflow (Runs End-to-End without Login)
1. **Input Content**: Paste text, upload documents (`.txt`, `.docx`), or select campaign templates (email/ad).
2. **Multi-Layer Audit Engine**:
   - **Live Rule-Based Checks**: Instant regex and pattern matching against brand terminology, style guidelines, and claims.
   - **Visual Identity Checks**: WCAG contrast ratio calculation for brand palettes, image alt-text, and image asset dimension/format validation.
   - **Evidence-Verified AI Review**: Server-side LLM review (Gemini/Claude) that flags nuanced tone violations and unsupported claims, with an evidence-verification filter that rejects any hallucinated quote or fake rule/fact ID.
3. **Intent-Preserving Correction**: Side-by-side Before/After diffs with rationale notes. Creators can Accept, Edit, or Dismiss (with an audit reason).
4. **Human Review & Governance**: One-click Creator/Reviewer roles, submission workflows, version histories, and audit logs.
5. **Governance Insights**: Real-time analytics on frequent issues and most-dismissed rules to help brand managers identify ambiguous guidelines.

---

## 🚀 Quick Start (Try in 2 Minutes)

1. Open the public deployment URL.
2. Click **"Load sample post"** to populate pre-configured sample text with realistic brand violations.
3. Observe live findings in the right-hand panel.
4. Click **"Run AI check"** to execute the evidence-verified LLM tone and claim audit.
5. Accept or dismiss findings, then click **"Submit for review"**.
6. Switch to the **Reviewer** view in the top-right corner to approve or request changes with feedback.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Lightweight vanilla HTML5, CSS3, JavaScript (zero heavy framework overhead, blazing fast load times).
- **In-Browser Text Extraction**: `mammoth.js` (pinned CDN version) for docx parsing.
- **Serverless API**: Vercel Serverless Function (`/api/ai-review`).
- **AI Models**: Google Gemini (model set by the `GEMINI_MODEL` environment variable, default `gemini-2.5-flash`) or Anthropic Claude (`ANTHROPIC_MODEL`).
- **Storage**: Client-side `localStorage` with resilient error handling (and optional Supabase adapter).
- **Testing**: Python evaluation script (`evaluate_violations.py`) run against planted violations, see `docs/TEST_REPORT.md` (it uses a Python copy of the rules, not the browser code).

---

## 📋 Features Completed

- [x] Zero-login public access for instant judging.
- [x] Dual-role toggle: Creator & Reviewer.
- [x] Live rule-based scanning (Terminology, Voice, Claims, Accessibility, Readability).
- [x] Editable Knowledge Base (Guidelines, Facts with expiry & sources, Terminology, Brand Colors).
- [x] Visual identity checks (WCAG contrast ratios, image dimensions/alt-text).
- [x] Multi-format support (Pasted text, `.txt`, `.docx`, Email/Ad templates).
- [x] Server-side AI review behind secure environment variables.
- [x] Evidence verification discarding hallucinated quotes or invalid rule/fact IDs.
- [x] Intent-preserving side-by-side fix preview.
- [x] Governance insights dashboard (unclear guideline detector).
- [x] Dark/Light responsive UI.
