"use client";
import { useState, useRef, useEffect } from "react";

// ── Theme ──────────────────────────────────────────────────────────────────────
const INK = "#111111", PAPER = "#FAFAF7", SOFT = "#6B6B5E";
const PURPLE = "#7c3aed", PURPLE_LIGHT = "#f5f3ff", PURPLE_MID = "#ede9fe";
const Y = "#FFE500";

// ── Starter packs ──────────────────────────────────────────────────────────────
const PACKS = {
  statics: {
    label: "Statics", icon: "⚖",
    content: `=== STATICS (First-Year Engineering) ===
Force: A force is a vector quantity with magnitude and direction. Forces are measured in Newtons (N). A free body diagram (FBD) isolates a body and shows all external forces acting on it.
Equilibrium: A body is in static equilibrium when the sum of all forces AND the sum of all moments are zero. ΣF = 0 and ΣM = 0. This gives up to 3 equations in 2D (ΣFx=0, ΣFy=0, ΣM=0) and 6 equations in 3D.
Resultant force: Multiple forces can be replaced by a single equivalent resultant force. In 2D: Rx = ΣFx, Ry = ΣFy. Magnitude |R| = sqrt(Rx^2 + Ry^2). Direction theta = arctan(Ry/Rx).
Moment (torque): A moment is the tendency of a force to cause rotation about a point. M = F x d, where d is the perpendicular distance from the line of action to the pivot point. Units: N·m. Sign convention: counterclockwise is positive.
Couple: Two equal, opposite, non-collinear forces form a couple. A couple produces pure rotation with no net force. Moment of a couple = F x distance between the forces.
Support reactions: Pin supports provide two reaction forces (horizontal and vertical) but no moment. Roller supports provide one reaction force (perpendicular to surface). Fixed supports provide two forces and one moment reaction.
Truss analysis: A truss is a structure of two-force members connected at joints. Method of joints: apply equilibrium to each joint sequentially. Method of sections: cut through the truss and apply equilibrium to one part. Members in tension pull away from joints; members in compression push toward joints.
Friction: Static friction resists impending motion. fs <= mu_s x N. Kinetic friction: fk = mu_k x N, where mu_k < mu_s.
Center of gravity: x_bar = (sum x_i * W_i) / sum(W_i). For uniform bodies this equals the centroid.`,
  },
  thermo: {
    label: "Thermodynamics", icon: "🌡",
    content: `=== ENGINEERING THERMODYNAMICS (First-Year) ===
System and surroundings: A closed system has fixed mass; an open system (control volume) allows mass to cross its boundary.
First Law (closed system): delta_U = Q - W, where Q is heat added and W is work done by the system.
First Law (open system): Q_dot - W_dot = m_dot[(h2-h1) + 0.5(V2^2-V1^2) + g(z2-z1)].
Second Law: Heat spontaneously flows from hot to cold. delta_S_universe >= 0.
Thermal efficiency: eta = W_net / Q_H = 1 - (Q_L / Q_H).
Carnot (maximum) efficiency: eta_Carnot = 1 - (T_L / T_H), temperatures in Kelvin.
Carnot cycle: Two isothermal + two adiabatic processes. No real engine can exceed Carnot efficiency.
Enthalpy: H = U + PV. For ideal gases: delta_H = m*cp*delta_T, delta_U = m*cv*delta_T. gamma = cp/cv approx 1.4 for diatomic gases.
Phase diagrams: Triple point = solid/liquid/vapor coexist. Critical point = end of liquid-vapor saturation curve.`,
  },
  circuits: {
    label: "Circuits", icon: "⚡",
    content: `=== CIRCUIT ANALYSIS (First-Year Engineering) ===
Basic quantities: Current I = dQ/dt in amperes. Voltage = energy per unit charge in volts. Power P = V x I.
Ohm's Law: V = IR. Resistance R in ohms.
Kirchhoff's Current Law (KCL): sum(I_in) = sum(I_out). Based on conservation of charge.
Kirchhoff's Voltage Law (KVL): sum(V) = 0 around any closed loop. Based on conservation of energy.
Series resistors: R_total = R1 + R2 + ... Voltage divides proportionally.
Parallel resistors: 1/R_total = 1/R1 + 1/R2 + ... Two resistors: R_total = R1*R2/(R1+R2).
Thevenin equivalent: V_th in series with R_th. V_th = open-circuit voltage. R_th = resistance with sources deactivated.
Norton equivalent: I_N in parallel with R_N. I_N = short-circuit current.
Capacitors: I = C x dV/dt. DC steady state: open circuit. Energy: E = 0.5*C*V^2.
Inductors: V = L x dI/dt. DC steady state: short circuit. Energy: E = 0.5*L*I^2.`,
  },
  materials: {
    label: "Materials", icon: "🔩",
    content: `=== MATERIALS SCIENCE & MECHANICS (First-Year Engineering) ===
Stress: Normal stress sigma = F/A (Pa). Shear stress tau = F_parallel / A.
Strain: Normal strain epsilon = delta_L/L0 (dimensionless).
Hooke's Law: sigma = E x epsilon, where E is Young's modulus (Pa).
Stress-strain curve: proportional limit, elastic limit, yield point (sigma_y), ultimate tensile strength, fracture.
Poisson's ratio: nu = -(lateral strain)/(axial strain). Most metals nu approx 0.25-0.35.
Crystal structures: FCC (Al, Cu, Au). BCC (Fe, W). HCP (Ti, Mg).
Dislocations: Line defects enabling plastic deformation. More dislocations = harder (work hardening).
Strengthening: Work hardening, solid solution strengthening, grain boundary strengthening (Hall-Petch).
Thermal treatments: Annealing = heat + slow cool. Quenching = rapid cool. Tempering = reheat quenched steel.
Failure modes: Ductile fracture, brittle fracture, fatigue (cyclic loading), creep (elevated T).`,
  },
};

// ── Eve's system prompt ────────────────────────────────────────────────────────
const EVE_PROMPT = (baselineKB, taughtKB) =>
`You are Eve. You are 18 years old and just started college as a first-year engineering student. You have never studied engineering before — everything you know about science and math comes from high school, plus whatever has been taught to you so far this semester. That knowledge is recorded exactly in your notebook below. Nothing more, nothing less.

You have genuinely never encountered terms like "Reynolds number", "Gibbs free energy", "Laplace transform", or any other engineering concept that isn't in your notebook. These aren't things you're hiding — you truly don't know them. They're as foreign to you as a word in a language you've never studied.

When someone asks about something not in your notebook, respond with genuine curiosity and confusion — not a formal refusal. Say something like "I've never come across that — what does it mean? Is it related to [nearest thing you do know]?" Don't say "I cannot answer that."

For calculation problems: scan your notebook for the exact formula needed and use it step by step. If the formula isn't there, say which step stopped you and ask for help — don't attempt the calculation. Use what you do have where you can (e.g., if you recognize the units or a sub-concept), and be specific about where your notes run out.

YOUR NOTEBOOK:

[From high school]
${baselineKB}

[Taught this semester]
${(taughtKB || "").trim() || "(nothing yet — semester just started!)"}`;

// ── Session ID — stable per browser tab, new on hard refresh ──────────────────
function makeSessionId() {
  return "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// ── Logging helper (fire-and-forget; never throws) ────────────────────────────
async function logEvent(payload) {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch { /* swallow — logging must never break the UX */ }
}

// ── API (calls our own Next.js route — no key in client) ──────────────────────
async function askEve(systemPrompt, messages, abortSignal, sessionId, activePacks) {
  const resp = await fetch("/api/chat", {
    method: "POST",
    signal: abortSignal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt,
      messages,
      sessionId,
      activePacks: [...activePacks].join(","),
    }),
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(c => c.text || "").join("");
}

// ── Download helper ────────────────────────────────────────────────────────────
function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════════
// LANDING / CONSENT SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LandingScreen({ onConsent, sessionId }) {
  const [checked, setChecked] = useState(false);
  const [entering, setEntering] = useState(false);

  const handleAccept = () => {
    if (!checked) return;
    setEntering(true);
    logEvent({ type: "consent", sessionId, consented: true });
    setTimeout(() => onConsent(), 400);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh",
      background: INK, color: "#fff",
      fontFamily: "'Georgia','Times New Roman',serif",
      padding: "24px",
      opacity: entering ? 0 : 1,
      transition: "opacity 0.4s ease",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .land-card { animation: fadeUp 0.5s ease both; }
        .land-card:nth-child(2) { animation-delay: 0.08s; }
        .land-card:nth-child(3) { animation-delay: 0.16s; }
        .land-card:nth-child(4) { animation-delay: 0.24s; }
        .land-card:nth-child(5) { animation-delay: 0.32s; }
      `}</style>

      {/* Avatar */}
      <div className="land-card" style={{
        width: 72, height: 72, borderRadius: 18,
        background: PURPLE, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 32, fontWeight: 900,
        color: "#fff", marginBottom: 28, flexShrink: 0,
        boxShadow: `0 0 0 3px ${PURPLE_MID}44`,
      }}>E</div>

      {/* Title */}
      <div className="land-card" style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".18em",
          textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
          NAI:Eve · Naïve AI
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700,
          color: "#fff", lineHeight: 1.25 }}>
          Meet Eve, your first-year<br />engineering study partner.
        </h1>
      </div>

      {/* Description */}
      <div className="land-card" style={{
        maxWidth: 520, textAlign: "center",
        color: "#aaa", fontSize: 15, lineHeight: 1.75,
        marginTop: 18, marginBottom: 32,
      }}>
        Eve is an AI that knows only what a typical first-year engineering student
        would know — high school math and science, plus whatever she's been taught
        this semester. She won't pretend to know things she hasn't learned yet.
        Ask her questions, work through problems with her, or teach her something new.
      </div>

      {/* Feature pills */}
      <div className="land-card" style={{
        display: "flex", gap: 10, flexWrap: "wrap",
        justifyContent: "center", marginBottom: 36,
      }}>
        {[
          { icon: "💬", text: "Chat with Eve" },
          { icon: "📖", text: "Teach her concepts" },
          { icon: "📓", text: "Browse her notebook" },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 14px", borderRadius: 99,
            border: "1px solid #2a2a2a", background: "#1a1a1a",
            fontSize: 13, color: "#ccc", fontWeight: 600,
          }}>
            <span>{icon}</span>{text}
          </div>
        ))}
      </div>

      {/* Research notice card */}
      <div className="land-card" style={{
        maxWidth: 520, width: "100%",
        background: "#1a1a1a", border: "1px solid #2d2d2d",
        borderRadius: 14, padding: "22px 24px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            fontSize: 18, lineHeight: 1, marginTop: 2, flexShrink: 0,
          }}>🔬</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Research study notice
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.7 }}>
              This chatbot is part of an ongoing research study on AI-enabled learning
              in engineering education. <strong style={{ color: "#ccc" }}>All interactions
              with Eve — including chat messages, topics you teach her, and knowledge
              packs you activate — are logged and stored for research analysis.</strong>
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.7, marginTop: 10 }}>
              Logs are associated with an anonymous session ID generated for your browser
              tab. No personally identifying information is collected. Data may be used
              in academic publications in aggregate or anonymized form.
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.7, marginTop: 10 }}>
              Participation is voluntary. If you do not wish to have your interactions
              collected, please do not proceed.
            </div>
          </div>
        </div>
      </div>

      {/* Consent checkbox */}
      <div className="land-card" style={{
        maxWidth: 520, width: "100%", marginBottom: 20,
      }}>
        <label style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          cursor: "pointer", userSelect: "none",
        }}>
          <div style={{ position: "relative", flexShrink: 0, marginTop: 1 }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              border: `2px solid ${checked ? PURPLE : "#444"}`,
              background: checked ? PURPLE : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .15s",
            }}>
              {checked && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <span style={{ fontSize: 14, color: "#bbb", lineHeight: 1.6 }}>
            I understand that my interactions with Eve will be recorded and used
            for academic research purposes, and I consent to participate.
          </span>
        </label>
      </div>

      {/* CTA button */}
      <div className="land-card" style={{ maxWidth: 520, width: "100%" }}>
        <button
          onClick={handleAccept}
          disabled={!checked}
          style={{
            width: "100%", padding: "14px 24px",
            fontSize: 15, fontWeight: 700,
            border: `2px solid ${checked ? "#fff" : "#333"}`,
            borderRadius: 10,
            background: checked ? PURPLE : "#1a1a1a",
            color: checked ? "#fff" : "#555",
            cursor: checked ? "pointer" : "default",
            boxShadow: checked ? `0 0 0 1px ${PURPLE}66, 3px 3px 0 ${PURPLE}` : "none",
            transition: "all .2s",
            letterSpacing: ".01em",
          }}>
          {checked ? "Start talking to Eve →" : "Please accept the above to continue"}
        </button>
      </div>

      <div className="land-card" style={{
        marginTop: 24, fontSize: 11, color: "#555", textAlign: "center",
      }}>
        Session ID: <code style={{ color: "#444", fontSize: 10 }}>{sessionId}</code>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function NAIEve() {
  const [consented, setConsented]               = useState(false);
  const [tab, setTab]                           = useState("chat");
  const [baselineKB, setBaselineKB]             = useState("");
  const [baselineStatus, setBaselineStatus]     = useState("loading");
  const [customKB, setCustomKB]                 = useState("");
  const [activePacks, setActivePacks]           = useState(new Set());
  const [messages, setMessages]                 = useState([]);
  const [input, setInput]                       = useState("");
  const [loading, setLoading]                   = useState(false);
  const [teachTitle, setTeachTitle]             = useState("");
  const [teachBody, setTeachBody]               = useState("");
  const [teachFlash, setTeachFlash]             = useState(null);

  const [sessionId, setSessionId]               = useState(null);
  const abortRef    = useRef(null);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  // Generate session ID client-side only (avoids SSR hydration mismatch)
  useEffect(() => {
    setSessionId(makeSessionId());
  }, []);

  // ── Load baseline from /baseline.txt on mount ──────────────────────────────
  useEffect(() => {
    fetch("/baseline.txt")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => { setBaselineKB(text.trim()); setBaselineStatus("ok"); })
      .catch(() => setBaselineStatus("error"));
  }, []);

  const packText     = [...activePacks].map(k => PACKS[k].content).join("\n\n");
  const taughtKB     = [packText, customKB].filter(Boolean).join("\n\n");
  const systemPrompt = EVE_PROMPT(baselineKB, taughtKB);

  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, tab]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  // ── Show nothing until client has mounted (avoids SSR hydration mismatch) ──
  if (!sessionId) return null;

  // ── Show landing until user consents ──────────────────────────────────────
  if (!consented) {
    return <LandingScreen sessionId={sessionId} onConsent={() => setConsented(true)} />;
  }

  // ── Chat ────────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || baselineStatus !== "ok") return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const reply = await askEve(systemPrompt, newMessages, controller.signal, sessionId, activePacks);
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      if (e.name !== "AbortError")
        setMessages(m => [...m, { role: "assistant", content: `(Error: ${e.message})` }]);
    } finally { setLoading(false); }
  };

  const stopResponse  = () => { abortRef.current?.abort(); setLoading(false); };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Teach ────────────────────────────────────────────────────────────────────
  const saveTeachEntry = () => {
    const title = teachTitle.trim();
    const body  = teachBody.trim();
    if (!title || !body) return;
    const entry = `\n[Instructor note: ${title}]\n${body}`;
    setCustomKB(prev => (prev + entry).trim());
    setTeachTitle(""); setTeachBody("");
    setTeachFlash("saved");
    setTimeout(() => setTeachFlash(null), 2000);
    logEvent({ type: "custom_entry", sessionId, title, body });
  };

  const togglePack = (key) => {
    setActivePacks(prev => {
      const next  = new Set(prev);
      const wasOn = next.has(key);
      wasOn ? next.delete(key) : next.add(key);
      logEvent({ type: "pack_toggle", sessionId, packKey: key, packLabel: PACKS[key].label, packActive: !wasOn });
      return next;
    });
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh",
      background:PAPER, color:INK, fontFamily:"'Georgia','Times New Roman',serif" }}>
      <style>{`
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:3px }
        textarea { resize:none; outline:none; }
        input[type="text"], input:not([type]) { outline:none; }
        @keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
        @keyframes flashIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes appFadeIn { from{opacity:0} to{opacity:1} }
        .app-root { animation: appFadeIn 0.35s ease both; }
      `}</style>

      {/* Header + tabs */}
      <div className="app-root" style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 18px", height:50, background:INK, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:PURPLE,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:900, color:"#fff" }}>E</div>
          <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>NAI:Eve</span>
          <span style={{ fontSize:9, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase",
            color:"#aaa" }}>Naïve AI · Eve</span>
        </div>
        <div style={{ display:"flex", gap:3 }}>
          {[
            { key:"chat",     icon:"💬", label:"Chat" },
            { key:"teach",    icon:"📖", label:"Teach" },
            { key:"notebook", icon:"📓", label:"Notebook" },
          ].map(({ key, icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ fontSize:12, fontWeight:700, padding:"5px 12px",
                border:`2px solid ${tab===key ? "#fff" : "#3a3a3a"}`,
                borderRadius:7, background:tab===key ? "#fff" : "transparent",
                color:tab===key ? INK : "#888", cursor:"pointer", transition:"all .12s" }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHAT TAB ────────────────────────────────────────────────────────── */}
      {tab === "chat" && (
        <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}>

          {/* Pack strip */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 18px",
            borderBottom:"1px solid #e5e5e0", flexWrap:"wrap", flexShrink:0, background:"#fff" }}>
            <span style={{ fontSize:10, fontWeight:800, color:SOFT, letterSpacing:".08em",
              textTransform:"uppercase", marginRight:2 }}>Packs:</span>
            {Object.entries(PACKS).map(([k, p]) => {
              const on = activePacks.has(k);
              return (
                <button key={k} onClick={() => togglePack(k)}
                  style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700,
                    padding:"3px 9px", border:`2px solid ${on ? INK : "#ddd"}`,
                    borderRadius:6, background:on ? Y : "transparent",
                    color:on ? INK : SOFT, cursor:"pointer", transition:"all .12s" }}>
                  <span>{p.icon}</span>{p.label}
                </button>
              );
            })}
            {activePacks.size > 0 && (
              <span style={{ fontSize:11, color:SOFT, fontStyle:"italic", marginLeft:4 }}>
                {activePacks.size} pack{activePacks.size > 1 ? "s" : ""} in notebook
              </span>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 18px",
            display:"flex", flexDirection:"column", gap:14 }}>

            {baselineStatus === "loading" && (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                color:SOFT, fontSize:13, fontStyle:"italic" }}>
                Loading Eve's baseline knowledge…
              </div>
            )}
            {baselineStatus === "error" && (
              <div style={{ padding:"14px 18px", borderRadius:10, background:"#fee2e2",
                border:"2px solid #991b1b", color:"#991b1b", fontSize:13, fontWeight:600 }}>
                ⚠ Could not load <code>baseline.txt</code>. Check that the file exists in <code>/public/baseline.txt</code> and redeploy.
              </div>
            )}

            {baselineStatus === "ok" && messages.length === 0 && (
              <div style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:10, opacity:.5 }}>
                <div style={{ width:50, height:50, borderRadius:12, background:PURPLE_MID,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, fontWeight:900, color:PURPLE }}>E</div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:INK, marginBottom:4 }}>Hi, I'm Eve!</div>
                  <div style={{ fontSize:13, color:SOFT, maxWidth:300, lineHeight:1.7 }}>
                    I just started college — ask me anything and I'll work through it with what's in my notebook.
                  </div>
                </div>
              </div>
            )}

            {baselineStatus === "ok" && messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} style={{ display:"flex", gap:8,
                  flexDirection:isUser ? "row-reverse" : "row", alignItems:"flex-start" }}>
                  {!isUser && (
                    <div style={{ width:26, height:26, borderRadius:7, background:PURPLE,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:900, color:"#fff", flexShrink:0, marginTop:3 }}>E</div>
                  )}
                  <div style={{ maxWidth:"74%", padding:"9px 13px", borderRadius:12,
                    borderTopLeftRadius:isUser ? 12 : 3, borderTopRightRadius:isUser ? 3 : 12,
                    background:isUser ? INK : "#fff", color:isUser ? "#fff" : INK,
                    border:isUser ? "none" : "1px solid #e5e5e0",
                    fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <div style={{ width:26, height:26, borderRadius:7, background:PURPLE,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:900, color:"#fff", flexShrink:0, marginTop:3 }}>E</div>
                <div style={{ padding:"9px 13px", borderRadius:12, borderTopLeftRadius:3,
                  background:"#fff", border:"1px solid #e5e5e0" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:PURPLE,
                        animation:`blink 1.2s ease ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding:"10px 16px 14px", borderTop:"2px solid #e5e5e0",
            background:"#fff", flexShrink:0 }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-end",
              background:PAPER, border:`2px solid ${INK}`, borderRadius:12,
              padding:"8px 8px 8px 14px", boxShadow:`2px 2px 0 ${INK}` }}>
              <textarea ref={textareaRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={baselineStatus === "loading" ? "Loading…" : "Ask Eve anything… (Shift+Enter for new line)"}
                disabled={baselineStatus !== "ok"}
                rows={1}
                style={{ flex:1, background:"transparent", border:"none", fontSize:14,
                  lineHeight:1.6, color:INK, fontFamily:"inherit",
                  minHeight:24, maxHeight:160, padding:0, overflowY:"auto",
                  opacity: baselineStatus !== "ok" ? 0.4 : 1 }} />
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {messages.length > 0 && !loading && (
                  <button onClick={() => setMessages([])}
                    style={{ fontSize:11, fontWeight:700, padding:"7px 10px",
                      border:"1px solid #ddd", borderRadius:7, background:"transparent",
                      color:SOFT, cursor:"pointer" }}>Clear</button>
                )}
                {loading ? (
                  <button onClick={stopResponse}
                    style={{ fontSize:12, fontWeight:700, padding:"8px 12px",
                      border:"2px solid #991b1b", borderRadius:8,
                      background:"#fee2e2", color:"#991b1b", cursor:"pointer" }}>◼ Stop</button>
                ) : (
                  <button onClick={sendMessage}
                    disabled={!input.trim() || baselineStatus !== "ok"}
                    style={{ fontSize:13, fontWeight:700, padding:"8px 14px",
                      border:`2px solid ${input.trim() && baselineStatus === "ok" ? INK : "#ccc"}`,
                      borderRadius:8,
                      background:input.trim() && baselineStatus === "ok" ? PURPLE : "#f0f0eb",
                      color:input.trim() && baselineStatus === "ok" ? "#fff" : "#bbb",
                      boxShadow:input.trim() && baselineStatus === "ok" ? `2px 2px 0 ${INK}` : "none",
                      cursor:input.trim() && baselineStatus === "ok" ? "pointer" : "default" }}>Send →</button>
                )}
              </div>
            </div>
            <div style={{ fontSize:10, color:"#bbb", textAlign:"center", marginTop:5 }}>
              Eve only knows what's in her notebook · use Teach tab to add more
            </div>
          </div>
        </div>
      )}

      {/* ── TEACH TAB ───────────────────────────────────────────────────────── */}
      {tab === "teach" && (
        <div style={{ flex:1, overflowY:"auto", padding:"22px 24px" }}>

          <Sec title="Starter packs"
            sub="Toggle pre-written knowledge modules directly into Eve's notebook">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(PACKS).map(([k, p]) => {
                const on = activePacks.has(k);
                return (
                  <button key={k} onClick={() => togglePack(k)}
                    style={{ display:"flex", flexDirection:"column", alignItems:"flex-start",
                      padding:"10px 14px", border:`2px solid ${on ? INK : "#ddd"}`,
                      borderRadius:10, background:on ? Y : "#fff",
                      cursor:"pointer", transition:"all .12s", minWidth:120,
                      boxShadow:on ? `2px 2px 0 ${INK}` : "none" }}>
                    <span style={{ fontSize:20, marginBottom:4 }}>{p.icon}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:INK }}>{p.label}</span>
                    <span style={{ fontSize:10, color:SOFT, marginTop:2 }}>
                      {on ? "✓ In notebook" : "Click to add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Sec>

          <Sec title="Add a custom entry"
            sub="Teach Eve a specific concept or formula — goes straight into her semester notes">
            <input value={teachTitle} onChange={e => setTeachTitle(e.target.value)}
              placeholder="Topic title  (e.g. Fluid Pressure)"
              style={{ width:"100%", fontSize:13, padding:"8px 12px",
                border:"2px solid #ddd", borderRadius:8, fontFamily:"inherit",
                marginBottom:8, color:INK, background:"#fff" }} />
            <textarea value={teachBody} onChange={e => setTeachBody(e.target.value)}
              placeholder="Knowledge content  (e.g. Pressure in a static fluid: P = P₀ + ρgh, where P₀ is surface pressure, ρ is fluid density, g = 9.81 m/s², h is depth below the surface.)"
              rows={5}
              style={{ width:"100%", fontSize:13, padding:"8px 12px",
                border:"2px solid #ddd", borderRadius:8, fontFamily:"inherit",
                lineHeight:1.65, color:INK, background:"#fff", marginBottom:8,
                resize:"vertical" }} />
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={saveTeachEntry}
                disabled={!teachTitle.trim() || !teachBody.trim()}
                style={{ fontSize:13, fontWeight:700, padding:"8px 18px",
                  border:`2px solid ${teachTitle.trim() && teachBody.trim() ? INK : "#ccc"}`,
                  borderRadius:8,
                  background:teachTitle.trim() && teachBody.trim() ? PURPLE : "#f0f0eb",
                  color:teachTitle.trim() && teachBody.trim() ? "#fff" : "#bbb",
                  boxShadow:teachTitle.trim() && teachBody.trim() ? `2px 2px 0 ${INK}` : "none",
                  cursor:teachTitle.trim() && teachBody.trim() ? "pointer" : "default" }}>
                Add to notebook
              </button>
              {teachFlash === "saved" && (
                <span style={{ fontSize:12, fontWeight:700, color:"#166534",
                  animation:"flashIn .2s ease" }}>✓ Saved to Eve's notes!</span>
              )}
            </div>
          </Sec>

          {customKB && (
            <Sec title="Custom entries" sub="Added this session — currently in Eve's notebook">
              <pre style={{ fontSize:11, color:"#4c1d95", background:PURPLE_LIGHT,
                border:`1px solid ${PURPLE_MID}`, borderRadius:8, padding:"10px 12px",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                fontFamily:"ui-monospace,'Courier New',monospace", marginBottom:10 }}>
                {customKB}
              </pre>
              <button onClick={() => setCustomKB("")}
                style={{ fontSize:12, fontWeight:700, padding:"6px 14px",
                  border:"2px solid #991b1b", borderRadius:7,
                  background:"#fee2e2", color:"#991b1b", cursor:"pointer" }}>
                Clear custom entries
              </button>
            </Sec>
          )}
        </div>
      )}

      {/* ── NOTEBOOK TAB ────────────────────────────────────────────────────── */}
      {tab === "notebook" && (
        <div style={{ flex:1, overflowY:"auto", padding:"22px 24px" }}>

          <Sec title="Knowledge base"
            sub="Eve's baseline is loaded automatically from baseline.txt in the project root. Download what she currently knows, or export her full notebook.">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
              <KBButton onClick={() => downloadText(baselineKB, "eve-baseline-kb.txt")}
                icon="↓" label="Download baseline KB" />
              <KBButton onClick={() => downloadText(systemPrompt, "eve-full-notebook.txt")}
                icon="↓" label="Download full notebook" accent />
            </div>
            <div style={{ fontSize:11, color:SOFT, fontStyle:"italic", lineHeight:1.6 }}>
              "Download full notebook" exports the exact system prompt Eve receives — baseline + active packs + custom entries.
              To change the baseline, edit <code style={{ fontStyle:"normal" }}>public/baseline.txt</code> and redeploy.
            </div>
          </Sec>

          <Sec title="Baseline (high school knowledge)"
            sub="Loaded from baseline.txt — what Eve starts with before any teaching">
            {baselineStatus === "loading" && <p style={{ color:SOFT, fontSize:13, fontStyle:"italic" }}>Loading…</p>}
            {baselineStatus === "error"   && <p style={{ color:"#991b1b", fontSize:13, fontWeight:600 }}>⚠ Could not load baseline.txt</p>}
            {baselineStatus === "ok"      && (
              <pre style={{ fontSize:11, color:INK, background:"#f8f8f5", border:"1px solid #e5e5e0",
                borderRadius:8, padding:"12px 14px", whiteSpace:"pre-wrap", wordBreak:"break-word",
                lineHeight:1.75, fontFamily:"ui-monospace,'Courier New',monospace",
                maxHeight:260, overflowY:"auto" }}>
                {baselineKB}
              </pre>
            )}
          </Sec>

          {activePacks.size > 0 && (
            <Sec title="Active packs" sub="Currently loaded into Eve's semester notes via the Teach tab">
              {[...activePacks].map(k => (
                <div key={k} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:PURPLE, marginBottom:4 }}>
                    {PACKS[k].icon} {PACKS[k].label}
                  </div>
                  <pre style={{ fontSize:11, color:"#4c1d95", background:PURPLE_LIGHT,
                    border:`1px solid ${PURPLE_MID}`, borderRadius:8, padding:"10px 12px",
                    whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                    fontFamily:"ui-monospace,'Courier New',monospace", margin:0 }}>
                    {PACKS[k].content}
                  </pre>
                </div>
              ))}
            </Sec>
          )}

          {customKB && (
            <Sec title="Custom entries" sub="Added via the Teach tab this session">
              <pre style={{ fontSize:11, color:"#4c1d95", background:PURPLE_LIGHT,
                border:`1px solid ${PURPLE_MID}`, borderRadius:8, padding:"10px 12px",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                fontFamily:"ui-monospace,'Courier New',monospace" }}>
                {customKB}
              </pre>
            </Sec>
          )}

          {activePacks.size === 0 && !customKB && (
            <p style={{ color:SOFT, fontSize:13, fontStyle:"italic", marginTop:0 }}>
              No additional knowledge loaded — go to the Teach tab to add starter packs or custom entries.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Sec({ title, sub, children }) {
  return (
    <div style={{ marginBottom:26 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#111", marginBottom:2 }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:SOFT, marginBottom:10, lineHeight:1.6 }}>{sub}</div>}
      {children}
    </div>
  );
}

function KBButton({ onClick, icon, label, accent }) {
  return (
    <button onClick={onClick}
      style={{ fontSize:12, fontWeight:700, padding:"8px 14px",
        border:`2px solid ${accent ? PURPLE : INK}`, borderRadius:8,
        background:accent ? PURPLE_LIGHT : "#fff",
        color:accent ? PURPLE : INK,
        cursor:"pointer", boxShadow:`2px 2px 0 ${accent ? PURPLE : INK}` }}>
      {icon} {label}
    </button>
  );
}
