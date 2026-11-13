# BrandLens Automated Verification & Evaluation Report

> **Run Timestamp:** 2026-11-13 12:41:58  
> **Environment:** Python re-implementation of the rule engine (a separate copy of the rules in index.html, not the browser code itself)  
> **Status:** Evaluation run completed. See the metrics below.

---

## 1. Executive Summary & Accuracy Metrics

| Metric | Score / Count | Definition |
|---|---|---|
| **Total Planted Violations** | **16** | Carefully crafted brand violations across 10 distinct test scenarios |
| **Total Violations Caught** | **16** | Violations accurately flagged by rule engine |
| **Detection Recall Rate** | **100.0%** | Ratio of caught violations to total planted violations |
| **Violations Missed** | **0** | Violations that bypassed detection |
| **False Positives** | **1** | Non-violations incorrectly flagged on clean text |
| **Clean Control Accuracy** | **100%** | TC1 (clean copy) generated 0 false alerts |

---

## 2. Test Case Scenarios & Planted Violations Breakdown

| Scenario ID | Test Purpose | Expected | Caught | Missed | False Flags | Detected Items |
|---|---|---|---|---|---|---|
| `TC1_Compliant` | Clean, fully compliant post adhering to all guidelines | 0 | 0 | 0 | 0 | None (Clean) |
| `TC2_Terminology_And_Caps` | Violates terminology (cheap, users, lowercase brewly) and shouts (TASTY) | 4 | 4 | 0 | 0 | G2: cheap, G2: users, G2: brewly, G1: TASTY |
| `TC3_Superlatives_And_Exclamations` | Violates claim guidelines with superlatives and excessive exclamation marks | 4 | 5 | 0 | 1 | G1: BEST, G1: !, G1: !, G3: BEST, G3: guaranteed |
| `TC4_Contradicted_Farms` | Contradicts approved fact F1 (claims 250 farms instead of 120) | 1 | 1 | 0 | 0 | G3: 250 partner farms |
| `TC5_Expired_Promo` | Advertises expired autumn promotion F4 | 1 | 1 | 0 | 0 | G3: 30% off |
| `TC6_Delivery_Threshold` | Contradicts free delivery threshold F2 (claims ₹299 instead of ₹499) | 1 | 1 | 0 | 0 | G3: free delivery on orders above ₹299 |
| `TC7_Accessibility_Links_Hashtags` | Non-descriptive link text and lowercase hashtag | 2 | 2 | 0 | 0 | G4: Click here, G4: #brewlylove |
| `TC8_RunOn_Sentence` | Sentence exceeding 25 words limit (Rule G5) | 1 | 1 | 0 | 0 | G5: Every morning when the sun ris... |
| `TC9_Missing_AltText` | Post with image attachment but empty alt text | 1 | 1 | 0 | 0 | G4: Image Asset |
| `TC10_Email_Long_Subject` | Email template with subject line over 60 characters | 1 | 1 | 0 | 0 | G6: Special Invitation for All Our Esteemed Coffee Enthusiasts and Lovers Across the Country |

---

## 3. Evidence Verification Unit Test (Anti-Hallucination Filter)

The evidence verification layer tests whether candidate LLM findings are accepted or rejected based on ground truth in content and the Knowledge Base.

- **Candidate AI Findings Submitted:** 5
- **Verified Findings Accepted:** **2** (Valid exact substrings grounded in active rules and facts)
- **Hallucinated / Corrupt Findings Discarded:** **3**

### Discarded Candidates Audit Log:
- Discarded item `{"quote": "cheapest coffee in universe", "rule": "G3", "sev": "high", "why": "Hallucinated quote"}`: Reason: **Quote not in content / hallucinated**
- Discarded item `{"quote": "affordable", "rule": "FAKE_RULE_99", "sev": "high", "why": "Fake rule ID"}`: Reason: **Rule ID not in Knowledge Base**
- Discarded item `{"quote": "120 partner farms", "rule": "G3", "fact": "F_NONEXISTENT", "sev": "high", "why": "Fake fact ID"}`: Reason: **Fact ID not in Approved Facts**

---

## 4. Conclusion and Limitations
On this planted-violation set the rule engine caught 16 of 16 planted violations, with 1 extra flag(s) (see the table). The clean control text (TC1) is listed in the table above.

Limitations:
- The test set was written by the project author, so a high score is expected and does not prove accuracy on real-world content.
- This script is a Python copy of the rules, not the JavaScript in index.html. Behaviour must also be checked manually in the app.
- The evidence-verification check was tested on hand-written candidate findings, not on real model output.
