"use client";
// /notebook-grader — batch-test submitted Eve notebooks against one problem.
// For each notebook: K independent Eve runs → optional leak audit per run →
// one Eve-constrained judge → consensus solution. Exports a CSV for grading.

import { useState, useRef, useEffect } from "react";
import { EVE_PROMPT } from "@/components/NAIEve";
import {
  parseNotebook, RELAXATION_LEVELS, buildRelaxationAddendum, buildRunSystem,
  buildRunUserMessage, buildAuditSystem, buildAuditUserMessage, parseAudit,
  buildJudgeSystem, buildJudgeUserMessage, parseJudge, toCSV, notebookName,
  callsPerNotebook, pool,
} from "@/lib/notebookGrader";

const INK = "#111111", PAPER = "#FAFAF7", SOFT = "#6B6B5E";
const PURPLE = "#7c3aed", PURPLE_LIGHT = "#f5f3ff", RED = "#b91c1c", GREEN = "#15803d";

const MODELS = [
  ["claude-haiku-4-5-20251001", "Haiku 4.5 (production Eve)"],
  ["claude-haiku-5-5", "Haiku 5.5"],
  ["claude-sonnet-5-5", "Sonnet 5.5"],
  ["claude-opus-5-5", "Opus 5.5"],
];

const DEFAULT_CONFIG = {
  problemTitle: "",
  problem: "",
  allowedContext: "",
  corePrinciples: "",
  level: "standard",
  runs: 5,
  audit: true,
  eveModel: "claude-haiku-4-5-20251001",
  auditModel: "claude-haiku-4-5-20251001",
  judgeModel: "claude-sonnet-5-5",
  concurrency: 3,
};

function download(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeStore(kind, key, value) {
  try {
    const s = kind === "session" ? window.sessionStorage : window.localStorage;
    if (value === undefined) return s.getItem(key);
    s.setItem(key, value);
  } catch { return null; }
}

function slug(s) {
  return (s || "problem").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "problem";
}

export default function NotebookGrader() {
  const [token, setToken] = useState("");
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [baselineKB, setBaselineKB] = useState("");
  const [notebooks, setNotebooks] = useState([]); // {name, raw}
  const [results, setResults] = useState({});     // name -> result
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const folderRef = useRef(null);
  const filesRef = useRef(null);
  const configRef = useRef(null);

  useEffect(() => {
    setToken(safeStore("session", "nai_grader_token") || "");
    const saved = safeStore("local", "nai_grader_config");
    if (saved) { try { setCfg({ ...DEFAULT_CONFIG, ...JSON.parse(saved) }); } catch {} }
    fetch("/baseline.txt").then(r => r.text()).then(t => setBaselineKB(t.trim())).catch(() => setError("Could not load /baseline.txt"));
  }, []);

  useEffect(() => { safeStore("local", "nai_grader_config", JSON.stringify(cfg)); }, [cfg]);

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));

  const loadFiles = async fileList => {
    const files = [...fileList].filter(f => /\.(txt|md)$/i.test(f.name) && !f.name.startsWith("."));
    const loaded = await Promise.all(files.map(async f => ({ name: notebookName(f), raw: await f.text() })));
    loaded.sort((a, b) => a.name.localeCompare(b.name));
    setNotebooks(loaded);
    setResults({});
    setExpanded(null);
  };

  const call = async ({ system, user, model, max_tokens, temperature }, signal) => {
    const resp = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ system, messages: [{ role: "user", content: user }], model, max_tokens, temperature }),
      signal,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data.error) throw new Error(data.error || `HTTP ${resp.status}`);
    return data;
  };

  const gradeOne = async (nbFile, config, signal) => {
    const update = patch => setResults(r => ({ ...r, [nbFile.name]: { ...(r[nbFile.name] || {}), ...patch } }));
    const nb = parseNotebook(nbFile.raw);
    const warnings = nb.warning ? [nb.warning] : [];
    const allowance = buildRelaxationAddendum(config);
    const runSystem = buildRunSystem(EVE_PROMPT, baselineKB, nb, config);
    const usage = { input: 0, output: 0 };
    const addUsage = u => { if (u) { usage.input += u.input_tokens || 0; usage.output += u.output_tokens || 0; } };

    update({ status: `Running ${config.runs} attempts…`, done: 0 });
    let doneCount = 0;
    const runs = await Promise.all(Array.from({ length: config.runs }, async () => {
      try {
        const r = await call({ system: runSystem, user: buildRunUserMessage(config.problem), model: config.eveModel, max_tokens: 3000, temperature: 1 }, signal);
        addUsage(r.usage);
        let audit = null;
        if (config.audit) {
          try {
            const a = await call({
              system: buildAuditSystem(),
              user: buildAuditUserMessage({ baselineKB, nb, problem: config.problem, allowance, solution: r.text }),
              model: config.auditModel, max_tokens: 600, temperature: 0,
            }, signal);
            addUsage(a.usage);
            audit = parseAudit(a.text);
          } catch (e) {
            if (signal.aborted) throw e;
            audit = { leak: null, issues: [`Audit failed: ${e.message}`] };
          }
        }
        return { ok: true, text: r.text, truncated: r.stop_reason === "max_tokens", audit };
      } catch (e) {
        if (signal.aborted) throw e;
        return { ok: false, error: e.message };
      } finally {
        doneCount++;
        update({ done: doneCount });
      }
    }));

    const good = runs.filter(r => r.ok);
    const failed = runs.length - good.length;
    if (failed) warnings.push(`${failed} run(s) failed: ${runs.filter(r => !r.ok).map(r => r.error).join("; ")}`);
    if (good.some(r => r.truncated)) warnings.push("At least one run hit the output length limit");

    const base = {
      notebook: nbFile.name,
      runsCompleted: `${good.length}/${config.runs}`,
      leakFlags: config.audit ? `${good.filter(r => r.audit?.leak === true).length}/${good.length}` : "not audited",
      runs, usage,
    };

    if (!good.length) {
      const row = { ...base, status: "Error", finalAnswer: "ERROR", consensusSolution: "", agreement: "", judgeNotes: "", warnings: warnings.join(" | ") };
      update(row);
      return row;
    }

    update({ status: "Judging…" });
    let judged;
    try {
      const j = await call({
        system: buildJudgeSystem(runSystem),
        user: buildJudgeUserMessage(config.problem, good),
        model: config.judgeModel, max_tokens: 4000, temperature: 0,
      }, signal);
      addUsage(j.usage);
      if (j.stop_reason === "max_tokens") warnings.push("Judge output hit the length limit");
      judged = parseJudge(j.text);
    } catch (e) {
      if (signal.aborted) throw e;
      warnings.push(`Judge failed: ${e.message}`);
      judged = { finalAnswer: "ERROR", agreement: "", solution: "", notes: "" };
    }

    const row = {
      ...base,
      status: judged.finalAnswer === "ERROR" ? "Error" : "Done",
      finalAnswer: judged.finalAnswer,
      consensusSolution: judged.solution,
      agreement: judged.agreement,
      judgeNotes: judged.notes,
      warnings: warnings.join(" | "),
    };
    update(row);
    return row;
  };

  const start = async (onlyFirst = false) => {
    setError("");
    if (!token) return setError("Enter the admin token first.");
    if (!cfg.problem.trim()) return setError("Enter the problem statement first.");
    if (!notebooks.length) return setError("Choose a folder or files of notebooks first.");
    if (!baselineKB) return setError("Baseline not loaded yet.");
    safeStore("session", "nai_grader_token", token);

    const list = onlyFirst ? notebooks.slice(0, 1) : notebooks;
    const config = { ...cfg, runs: Math.max(1, Math.min(9, Number(cfg.runs) || 1)) };
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setResults(r => {
      const next = { ...r };
      list.forEach(n => { next[n.name] = { status: "Queued" }; });
      return next;
    });

    try {
      await pool(list, Number(config.concurrency) || 1, nb =>
        gradeOne(nb, config, controller.signal).catch(e => {
          const status = controller.signal.aborted ? "Stopped" : "Error";
          setResults(r => ({ ...r, [nb.name]: { ...(r[nb.name] || {}), status, finalAnswer: status === "Error" ? "ERROR" : "", warnings: e.message } }));
        })
      );
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const finishedRows = notebooks.map(n => results[n.name]).filter(r => r && (r.status === "Done" || r.status === "Error"));

  const exportCSV = () => {
    const rows = notebooks.map(n => results[n.name]).filter(r => r?.notebook);
    download(toCSV(rows), `eve-consensus-${slug(cfg.problemTitle)}.csv`, "text/csv;charset=utf-8");
  };

  const exportJSON = () => {
    const rows = notebooks.map(n => results[n.name]).filter(r => r?.notebook);
    download(JSON.stringify({ exportedAt: new Date().toISOString(), config: cfg, results: rows }, null, 2),
      `eve-runs-${slug(cfg.problemTitle)}.json`, "application/json");
  };

  const exportConfig = () => download(JSON.stringify(cfg, null, 2), `grader-config-${slug(cfg.problemTitle)}.json`, "application/json");
  const importConfig = async e => {
    const f = e.target.files?.[0]; if (!f) return;
    try { setCfg({ ...DEFAULT_CONFIG, ...JSON.parse(await f.text()) }); } catch { setError("That file is not a grader config."); }
    e.target.value = "";
  };

  const totalUsage = Object.values(results).reduce((a, r) => ({ input: a.input + (r.usage?.input || 0), output: a.output + (r.usage?.output || 0) }), { input: 0, output: 0 });
  const totalCalls = notebooks.length * callsPerNotebook(Number(cfg.runs) || 1, cfg.audit);

  const label = { fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4, display: "block" };
  const help = { fontSize: 11, color: SOFT, marginTop: 3, lineHeight: 1.5 };
  const input = { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #d4d4c8", borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff" };
  const btn = (accent, disabled) => ({ padding: "8px 14px", borderRadius: 6, border: `1px solid ${accent ? PURPLE : "#d4d4c8"}`, background: disabled ? "#eee" : accent ? PURPLE : "#fff", color: disabled ? "#999" : accent ? "#fff" : INK, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer" });
  const card = { background: "#fff", border: "1px solid #e5e5dc", borderRadius: 10, padding: 18, marginBottom: 16 };

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "system-ui, -apple-system, sans-serif", padding: "28px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>NAI:Eve notebook grader</h1>
        <div style={{ fontSize: 13, color: SOFT, marginBottom: 20 }}>
          Each notebook gets {cfg.runs} independent Eve attempt{cfg.runs == 1 ? "" : "s"}{cfg.audit ? ", a leak audit of each attempt" : ""}, then one Eve judge writes the consensus solution.
        </div>

        <div style={card}>
          <label style={label}>Admin token</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} style={{ ...input, maxWidth: 420 }} placeholder="ADMIN_TOKEN" />
          <div style={help}>Same token as /api/logs. Kept in this tab only.</div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>Problem</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn(false)} onClick={exportConfig}>Save problem setup</button>
              <button style={btn(false)} onClick={() => configRef.current?.click()}>Load problem setup</button>
              <input ref={configRef} type="file" accept=".json" style={{ display: "none" }} onChange={importConfig} />
            </div>
          </div>

          <label style={label}>Title</label>
          <input style={{ ...input, marginBottom: 12 }} value={cfg.problemTitle} onChange={e => set("problemTitle", e.target.value)} placeholder="e.g. HW4 Q2: splitter with recycle" />

          <label style={label}>Problem statement</label>
          <textarea style={{ ...input, minHeight: 140, fontFamily: "ui-monospace, monospace", fontSize: 12 }} value={cfg.problem} onChange={e => set("problem", e.target.value)} placeholder="Paste the problem exactly as Eve should see it." />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            <div>
              <label style={label}>Allowed context (one per line)</label>
              <textarea style={{ ...input, minHeight: 100, fontSize: 12 }} value={cfg.allowedContext} onChange={e => set("allowedContext", e.target.value)} disabled={cfg.level === "strict"}
                placeholder={"A distillation column separates a feed into a top and bottom stream\nMole fraction = moles of a component / total moles"} />
              <div style={help}>Surface details Eve may use without having been taught them: vocabulary, equipment descriptions, definitions you don't intend to assess.</div>
            </div>
            <div>
              <label style={label}>Core principles being assessed (one per line)</label>
              <textarea style={{ ...input, minHeight: 100, fontSize: 12 }} value={cfg.corePrinciples} onChange={e => set("corePrinciples", e.target.value)} disabled={cfg.level === "strict"}
                placeholder={"Steady-state mass balance: in = out\nDegrees-of-freedom analysis"} />
              <div style={help}>Eve may use these only if the student's notebook teaches them. The allowance never unlocks them.</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Run settings</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={label}>Knowledge-boundary relaxation</label>
              <select style={input} value={cfg.level} onChange={e => set("level", e.target.value)}>
                {Object.entries(RELAXATION_LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div style={help}>{RELAXATION_LEVELS[cfg.level].help}</div>
            </div>
            <div>
              <label style={label}>Attempts per notebook</label>
              <input type="number" min={1} max={9} style={input} value={cfg.runs} onChange={e => set("runs", e.target.value)} />
              <div style={help}>Odd numbers avoid ties. 5 is a good default.</div>
            </div>
            <div>
              <label style={label}>Notebooks in parallel</label>
              <input type="number" min={1} max={10} style={input} value={cfg.concurrency} onChange={e => set("concurrency", e.target.value)} />
              <div style={help}>Lower this if you hit rate limits.</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 14 }}>
            {[["eveModel", "Eve attempts model"], ["auditModel", "Audit model"], ["judgeModel", "Judge model"]].map(([k, l]) => (
              <div key={k}>
                <label style={label}>{l}</label>
                <select style={input} value={cfg[k]} onChange={e => set(k, e.target.value)} disabled={k === "auditModel" && !cfg.audit}>
                  {MODELS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 13 }}>
            <input type="checkbox" checked={cfg.audit} onChange={e => set("audit", e.target.checked)} />
            Audit each attempt for knowledge leaks (the judge drops leaked steps)
          </label>
          <div style={help}>Keep the Eve model on Haiku 4.5 so students are graded on the Eve they taught.</div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button style={btn(false, running)} disabled={running} onClick={() => folderRef.current?.click()}>Choose folder</button>
            <button style={btn(false, running)} disabled={running} onClick={() => filesRef.current?.click()}>Choose files</button>
            <input ref={folderRef} type="file" webkitdirectory="" directory="" multiple style={{ display: "none" }} onChange={e => { loadFiles(e.target.files); e.target.value = ""; }} />
            <input ref={filesRef} type="file" accept=".txt,.md" multiple style={{ display: "none" }} onChange={e => { loadFiles(e.target.files); e.target.value = ""; }} />
            <span style={{ fontSize: 13, color: SOFT, marginLeft: 6 }}>
              {notebooks.length ? `${notebooks.length} notebook${notebooks.length === 1 ? "" : "s"} · about ${totalCalls} API calls` : "Only .txt and .md files are read, including subfolders."}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button style={btn(false, running || !notebooks.length)} disabled={running || !notebooks.length} onClick={() => start(true)}>Trial run: first notebook</button>
            <button style={btn(true, running || !notebooks.length)} disabled={running || !notebooks.length} onClick={() => start(false)}>Grade all</button>
            {running && <button style={{ ...btn(false), borderColor: RED, color: RED }} onClick={stop}>Stop</button>}
            <div style={{ flex: 1 }} />
            <button style={btn(false, !finishedRows.length)} disabled={!finishedRows.length} onClick={exportCSV}>Download CSV</button>
            <button style={btn(false, !finishedRows.length)} disabled={!finishedRows.length} onClick={exportJSON}>Download all attempts (JSON)</button>
          </div>
          {error && <div style={{ color: RED, fontSize: 13, marginTop: 10 }}>{error}</div>}
          {(totalUsage.input > 0) && <div style={help}>Tokens so far: {totalUsage.input.toLocaleString()} in · {totalUsage.output.toLocaleString()} out</div>}
        </div>

        {notebooks.length > 0 && (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: PURPLE_LIGHT, textAlign: "left" }}>
                  {["Notebook", "Status", "Final answer", "Agreement", "Leaks"].map(h => <th key={h} style={{ padding: "8px 12px", fontWeight: 700 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {notebooks.map(n => {
                  const r = results[n.name] || {};
                  const open = expanded === n.name;
                  const status = r.status === "Queued" || !r.status ? (r.status || "—")
                    : r.status.startsWith("Running") ? `${r.done || 0}/${cfg.runs} attempts` : r.status;
                  return [
                    <tr key={n.name} onClick={() => r.notebook && setExpanded(open ? null : n.name)}
                      style={{ borderTop: "1px solid #eee", cursor: r.notebook ? "pointer" : "default", background: open ? "#fcfcf8" : "#fff" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{n.name}</td>
                      <td style={{ padding: "8px 12px", color: r.status === "Error" ? RED : r.status === "Done" ? GREEN : SOFT }}>{status}</td>
                      <td style={{ padding: "8px 12px", maxWidth: 360 }}>{r.finalAnswer || ""}</td>
                      <td style={{ padding: "8px 12px" }}>{r.agreement || ""}</td>
                      <td style={{ padding: "8px 12px" }}>{r.leakFlags || ""}</td>
                    </tr>,
                    open && (
                      <tr key={n.name + "_detail"}>
                        <td colSpan={5} style={{ padding: "4px 12px 16px", background: "#fcfcf8" }}>
                          {r.warnings && <div style={{ color: RED, fontSize: 12, margin: "8px 0" }}>{r.warnings}</div>}
                          {r.judgeNotes && <div style={{ fontSize: 12, color: SOFT, margin: "8px 0" }}><b>Judge notes:</b> {r.judgeNotes}</div>}
                          <div style={{ fontWeight: 700, fontSize: 12, margin: "10px 0 4px" }}>Consensus solution</div>
                          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#fff", border: "1px solid #eee", borderRadius: 6, padding: 10, margin: 0 }}>{r.consensusSolution || "(none)"}</pre>
                          {(r.runs || []).map((run, i) => (
                            <details key={i} style={{ marginTop: 8 }}>
                              <summary style={{ fontSize: 12, cursor: "pointer" }}>
                                Attempt {i + 1}{!run.ok ? " — failed" : run.audit?.leak === true ? " — LEAK flagged" : run.audit?.leak === false ? " — clean" : ""}
                              </summary>
                              {run.audit?.issues?.length > 0 && <div style={{ fontSize: 12, color: RED, margin: "6px 0" }}>{run.audit.issues.join("; ")}</div>}
                              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#fff", border: "1px solid #eee", borderRadius: 6, padding: 10 }}>{run.ok ? run.text : run.error}</pre>
                            </details>
                          ))}
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
