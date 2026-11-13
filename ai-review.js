// Vercel Serverless Function: /api/ai-review  (this file must live at api/ai-review.js)
// Calls Gemini or Claude server-side. API keys come ONLY from environment variables.

const hits = new Map(); // best-effort in-memory rate limit per IP (resets when the function restarts)
function limited(ip) {
  const now = Date.now(), windowMs = 60000, max = 10;
  const recent = (hits.get(ip) || []).filter(t => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return recent.length > max;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests. Please wait a minute.', fallback: true });

  try {
    const { text, guidelines, facts } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing or invalid "text".' });
    if (text.length > 10000) return res.status(400).json({ error: 'Text exceeds 10,000 characters.' });

    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!geminiKey && !anthropicKey) {
      return res.status(503).json({ error: 'AI service is not configured on the server.', fallback: true });
    }

    const kbText = [
      'GUIDELINES:',
      Array.isArray(guidelines)
        ? guidelines.slice(0, 30).map(g => `${g.id} ${g.name || ''}: ${g.rule || g.desc || ''}`).join('\n')
        : 'G1 Voice: Warm, clear and honest. No hype and no shouting.\nG3 Claims: Every number, ranking or promise must match an approved fact.',
      '\nAPPROVED FACTS:',
      Array.isArray(facts)
        ? facts.slice(0, 50).map(f => `${f.id}: ${f.text || f.t} (source: ${f.source || f.s || 'Internal'}, expires: ${f.expiry || f.e || 'N/A'})`).join('\n')
        : 'F1: Brewly sources beans from 120 partner farms.\nF2: Free delivery on orders above Rs 499.'
    ].join('\n');

    const systemPrompt = `You are an AI brand governance reviewer.
Review the user's content against ONLY the provided Guidelines and Approved Facts.
1. Identify tone issues (hype, shouting) and promotional or numerical claims not supported by approved facts.
2. Return a JSON array of at most 6 issues.
3. Each issue has: "quote" (exact substring copied verbatim from the content), "rule" (guideline ID such as "G1" or "G3"), "sev" ("high", "medium" or "low"), "why" (one clear sentence), "fix" (a replacement that preserves the writer's intent, or an empty string to remove it), "fact" (matching approved fact ID, or an empty string).
4. If there are no violations, return [].
5. Respond with ONLY a valid JSON array. No markdown, no extra text.`;
    const userPrompt = `${kbText}\n\nCONTENT TO REVIEW:\n${text}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let raw = '[]';

    if (geminiKey) {
      // Model is configurable because Google retires models. Check AI Studio for a current one.
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' }
        })
      });
      if (!r.ok) {
        console.error('Gemini error', r.status, (await r.text()).slice(0, 300));
        clearTimeout(timer);
        return res.status(502).json({ error: 'AI provider error.', fallback: true });
      }
      const data = await r.json();
      raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    } else {
      const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        signal: controller.signal,
        body: JSON.stringify({ model, max_tokens: 1500, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] })
      });
      if (!r.ok) {
        console.error('Anthropic error', r.status, (await r.text()).slice(0, 300));
        clearTimeout(timer);
        return res.status(502).json({ error: 'AI provider error.', fallback: true });
      }
      const data = await r.json();
      raw = data?.content?.[0]?.text || '[]';
    }
    clearTimeout(timer);

    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim()); }
    catch (e) { return res.status(502).json({ error: 'AI returned an unreadable answer.', fallback: true }); }

    return res.status(200).json({ success: true, findings: Array.isArray(parsed) ? parsed.slice(0, 6) : [] });
  } catch (err) {
    console.error('ai-review error:', err && err.name);
    const timeout = err && err.name === 'AbortError';
    return res.status(timeout ? 504 : 500).json({ error: timeout ? 'AI request timed out.' : 'Internal error.', fallback: true });
  }
}
