# Changes From Plan (Round 2 Progress)

This document tracks technical iterations, design adaptations, and improvements made during Round 2 based on the problem statement requirements.

## 1. AI Architecture Evolution
- **Initial Prototype**: Relied on client-side sandboxed `claude.use()` mock API, which failed when executed on external public browsers.
- **Round 2 Implementation**: Upgraded to a production-grade, secure Vercel Serverless Function (`/api/ai-review`). API keys now live strictly in server environment variables. Added evidence verification to discard hallucinated findings.

## 2. Dynamic Knowledge Base vs. Hardcoded Dictionaries
- **Initial Prototype**: Hardcoded rules (`CL`), facts (`FACTS`), and terms.
- **Round 2 Implementation**: Fully dynamic Knowledge Base stored in structured data objects with UI CRUD operations (Add/Edit/Delete), text import parsing, and persistent storage.

## 3. Multi-Format Ingestion
- **Initial Prototype**: Only supported manual text pasting.
- **Round 2 Implementation**: Added direct browser-side ingestion for `.txt` and `.docx` (via Mammoth.js), plus dedicated campaign templates for Emails and Ads with custom metadata checks (subject lines, CTAs).

## 4. Visual Governance & Accessibility
- **Initial Prototype**: Basic alt-text checkbox.
- **Round 2 Implementation**: Comprehensive visual identity checks including WCAG 2.1 AA/AAA contrast ratios, image dimension/format constraints, and brand palette enforcement.
