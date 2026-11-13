
const hits = new Map();

function limited(ip) {
  const now = Date.now(), windowMs = 60000, max = 10;
  const recent = (hits.get(ip) || []).filter(t => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (!v.some(t => now - t < windowMs)) hits.delete(k);
    }
  }
  return recent.length > max;
}

// Each provider gets its own timeout so one timeout
// does not prevent the next provider from being tried.
async function callProvider(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseFindings(raw) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (Array.isArray(parsed)) return parsed.slice(0, 6);
  if (Array.isArray(parsed.findings)) return parsed.findings.slice(0, 6);
  if (Array.isArray(parsed.issues)) return parsed.issues.slice(0, 6);

  return [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

  if (limited(ip)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a minute.',
      fallback: true
    });
  }

  try {
    const { text, guidelines, facts } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "text".' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ error: 'Text exceeds 10,000 characters.' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!geminiKey && !groqKey && !anthropicKey) {
      return res.status(503).json({
        error: 'AI service is not configured on the server.',
        fallback: true
      });
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
2. Return a JSON object with a "findings" array containing at most 6 issues.
3. Each issue must have:
   "quote": exact substring copied from the content,
   "rule": guideline ID such as "G1" or "G3",
   "sev": "high", "medium" or "low",
   "why": one clear sentence,
   "fix": a replacement that preserves the writer's intent, or an empty string,
   "fact": matching approved fact ID, or an empty string.
4. If there are no violations, return {"findings":[]}.
5. Respond with ONLY valid JSON. No markdown or extra text.`;

    const userPrompt = `${kbText}\n\nCONTENT TO REVIEW:\n${text}`;

    // 1. Try Gemini first
    if (geminiKey) {
      try {
        const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

        const r = await callProvider(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiKey
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (!r.ok) {
          console.error('Gemini error:', r.status, (await r.text()).slice(0, 300));
        } else {
          const data = await r.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (raw) {
            const findings = parseFindings(raw);
            return res.status(200).json({
              success: true,
              provider: 'Gemini',
              findings
            });
          }
        }
      } catch (err) {
        console.error('Gemini failed:', err.name);
      }
    }

    // 2. If Gemini fails, try Groq
    if (groqKey) {
      try {
        const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

        const r = await callProvider(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.1,
              max_tokens: 2048,
              response_format: { type: 'json_object' }
            })
          }
        );

        if (!r.ok) {
          console.error('Groq error:', r.status, (await r.text()).slice(0, 300));
        } else {
          const data = await r.json();
          const raw = data?.choices?.[0]?.message?.content;

          if (raw) {
            const findings = parseFindings(raw);
            return res.status(200).json({
              success: true,
              provider: 'Groq',
              findings
            });
          }
        }
      } catch (err) {
        console.error('Groq failed:', err.name);
      }
    }

    // 3. Keep the existing Claude option as a third fallback
    if (anthropicKey) {
      try {
        const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

        const r = await callProvider(
          'https://api.anthropic.com/v1/messages',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model,
              max_tokens: 1500,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompt }]
            })
          }
        );

        if (!r.ok) {
          console.error('Anthropic error:', r.status, (await r.text()).slice(0, 300));
        } else {
          const data = await r.json();
          const raw = data?.content?.[0]?.text;

          if (raw) {
            const findings = parseFindings(raw);
            return res.status(200).json({
              success: true,
              provider: 'Claude',
              findings
            });
          }
        }
      } catch (err) {
        console.error('Anthropic failed:', err.name);
      }
    }

    return res.status(502).json({
      error: 'AI providers are unavailable. Rule-based audit is active.',
      fallback: true
    });

  } catch (err) {
    console.error('ai-review error:', err && err.name);

    return res.status(500).json({
      error: 'Internal error.',
      fallback: true
    });
  }
}
