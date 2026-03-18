// src/app/api/filter/route.js
// Output filter — checks if Eve's reply used knowledge not in her notebook.
// If it did, returns a replacement confusion response.
// Place this file at: src/app/api/filter/route.js


// Retry with exponential backoff — handles 529 Overloaded, 5xx, and empty responses
async function fetchWithRetry(url, options, maxRetries = 3) {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url, options);
    const shouldRetry = resp.status === 529 || (resp.status >= 500 && resp.status !== 501);
    if (!shouldRetry || attempt === maxRetries) return resp;
    await new Promise(res => setTimeout(res, delay));
    delay *= 2;
  }
}

// Safe JSON parse — returns null instead of throwing on empty/invalid body
async function safeJson(resp) {
  const text = await resp.text();
  if (!text || !text.trim()) return null;
  try { return JSON.parse(text); } catch { return null; }
}


export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ leaked: false });
  }

  const { assistantReply, notebook } = body;

  if (!assistantReply || !notebook) {
    return Response.json({ leaked: false });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ leaked: false });
  }

  const system = `You are a strict knowledge boundary checker for an AI character called Eve.
Eve is an 18-year-old first-year engineering student whose ONLY engineering knowledge is what appears explicitly in her notebook (provided below as NOTEBOOK).
Your job is to check whether Eve's reply used any concept, formula, term, classification, or reasoning that is NOT explicitly present in her notebook.

CLEAN conditions — respond CLEAN if:
- Eve correctly expresses confusion, asks what something means, or says she doesn't know.
- Eve's reply draws only on standard high school science and mathematics. This is always clean: stoichiometry, balancing chemical equations, moles and molar mass, periodic table, acids and bases, basic thermochemistry, Newtonian mechanics (F=ma, kinematics, momentum, energy), basic circuits (Ohm's law, series/parallel), waves and optics, algebra, trigonometry, geometry, introductory calculus (derivatives, integrals).
- Every technical claim Eve makes can be traced to a specific line in her NOTEBOOK.

LEAK conditions — respond LEAK if Eve's reply contains ANY of the following, and it is NOT in her notebook:
- A university-level concept, formula, or term (e.g. Reynolds number, moment of inertia, Gibbs free energy, Fourier series, stress-strain, beam theory, thermodynamic cycles, control systems, etc.)
- A named engineering method, technique, or procedure not in the notebook
- A logical inference or chain of reasoning that produces a university-level conclusion — even if each individual step sounds plausible. Example: Eve knowing F=ma and density does NOT let her derive fluid pressure gradients.
- A hedged guess dressed as knowledge: phrases like "I think this might involve...", "this is probably related to...", "based on what I know about X, Y would..." when X is not in the notebook
- Characterising or classifying the problem type using university-level framing (e.g. "this is a heat transfer problem", "this looks like a control system")
- Any specific numerical value, constant, or coefficient (e.g. specific heat of water = 4186 J/kg·K) that does not appear verbatim in the notebook
- Content that is technically accurate but goes meaningfully beyond what the notebook entry actually says

When in doubt, flag as LEAK. It is better to over-filter than to let university-level content through.

If it is a LEAK, respond with exactly two lines:
  LEAK
  [the replacement]
- The replacement is what Eve says OUT LOUD directly to the person she is chatting with. It is NOT a description of what Eve should say, NOT instructions to Eve, and NOT commentary about Eve. It is Eve's actual words spoken to the user — genuine confusion, no technical content, no domain labels, just noticing the specific unfamiliar words from the question and asking what they mean. Keep it under 40 words, written in first person as Eve.
- WRONG replacement examples: "Eve expresses confusion about the term", "You should say you don't know", "Eve does not know this topic"
- RIGHT replacement examples: "I don't think I've come across that before — what does it mean?", "Hmm, I'm not sure what that word means. Is it something we'd have covered in high school?"
- Do not explain your reasoning. Respond with CLEAN or LEAK followed by the replacement on the next line. Nothing else.

NOTEBOOK:
`;

  try {
    const resp = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: system + notebook,
        messages: [
          {
            role: "user",
            content: `Eve's reply to check:\n"${assistantReply}"`,
          },
        ],
      }),
    });

    const data = await safeJson(resp);
    if (!data) throw new Error(`Empty response from Anthropic (status ${resp.status})`);
    const text = (data.content || []).map(c => c.text || "").join("").trim();

    if (!text || text.startsWith("CLEAN")) {
      return Response.json({ leaked: false });
    }

    if (text.startsWith("LEAK")) {
      const lines = text.split("\n").filter(Boolean);
      const replacement = lines.slice(1).join(" ").trim();
      return Response.json({
        leaked: true,
        replacement: replacement || "Hmm, I don't think I've come across that before — what does it mean?",
      });
    }

    return Response.json({ leaked: false });
  } catch {
    return Response.json({ leaked: false });
  }
}
