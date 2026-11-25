"use client";
import { useState, useRef, useEffect } from "react";

// 

const INK = "#111111", PAPER = "#FAFAF7", SOFT = "#6B6B5E";
const PURPLE = "#7c3aed", PURPLE_LIGHT = "#f5f3ff", PURPLE_MID = "#ede9fe";
const Y = "#FFE500";

// Starter packs

const PACKS = {
  statics: {
    label: "Statics", icon: "⚖️",
    content: `=== STATICS (First-Year Engineering) ===
Force: A force is a vector quantity with magnitude and direction. Forces are measured in Newtons (N). A free body diagram (FBD) isolates a body and shows all external forces acting on it.
Equilibrium: A body is in static equilibrium when the sum of all forces AND the sum of all moments are zero. 
F = 0 and 
M = 0. This gives up to 3 equations in 2D (
M=0) and 6 equations in 3D.
Resultant force: Multiple forces can be replaced by a single equivalent resultant force. In 2D: Rx = 
Fy. Magnitude |R| = sqrt(Rx^2 + Ry^2). Direction theta = arctan(Ry/Rx).
Moment (torque): A moment is the tendency of a force to cause rotation about a point. M = F x d, where d is the perpendicular distance from the line of action to the pivot point. Units: N
m. Sign convention: counterclockwise is positive.
Couple: Two equal, opposite, non-collinear forces form a couple. A couple produces pure rotation with no net force. Moment of a couple = F x distance between the forces.
Support reactions: Pin supports provide two reaction forces (horizontal and vertical) but no moment. Roller supports provide one reaction force (perpendicular to surface). Fixed supports provide two forces and one moment reaction.
Truss analysis: A truss is a structure of two-force members connected at joints. Method of joints: apply equilibrium to each joint sequentially. Method of sections: cut through the truss and apply equilibrium to one part. Members in tension pull away from joints; members in compression push toward joints.
Friction: Static friction resists impending motion. fs <= mu_s x N. Kinetic friction: fk = mu_k x N, where mu_k < mu_s.
Center of gravity: x_bar = (sum x_i * W_i) / sum(W_i). For uniform bodies this equals the centroid.`,
  },
  thermo: {
    label: "Thermodynamics", icon: "🔥",
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

// Procedural packs — step-by-step problem-solving templates

const PROC_PACKS = {
  statics: {
    label: "Statics procedures", icon: "⚖️",
    content: `[PROCEDURE: Draw a Free Body Diagram (FBD)]
USE WHEN: Any statics problem before applying equilibrium equations.
STEPS:
1. Isolate the body — sketch it alone, detached from all supports and connections.
2. Add every external force: applied loads, weight (W = mg downward at centre of mass), and all support reactions.
3. Label each force with its known value or an unknown variable (e.g. Ax, Ay, B).
4. Add a coordinate axis (x right, y up by default) and note the positive moment direction (usually CCW).
SHOW: Always draw the FBD before writing any equation. Label it clearly. Do not skip this step.

[PROCEDURE: Solve a 2-D Equilibrium Problem]
USE WHEN: Finding unknown forces or reactions on a stationary rigid body.
STEPS:
1. Draw the FBD (see FBD procedure).
2. Write ΣFx = 0 and solve for unknowns in the x-direction.
3. Write ΣFy = 0 and solve for unknowns in the y-direction.
4. Write ΣM = 0 about a point that eliminates as many unknowns as possible (usually a pin).
5. Solve the resulting equations. Check: number of equations = number of unknowns.
SHOW: Write each equation explicitly (e.g. "ΣFy = 0: Ay + B − 500 = 0"). State units on final answers.

[PROCEDURE: Method of Joints — Truss Analysis]
USE WHEN: Finding the force in every member of a truss.
STEPS:
1. Find all support reactions using whole-truss equilibrium (ΣFx=0, ΣFy=0, ΣM=0).
2. Pick a joint with at most 2 unknown member forces. Assume all unknown members are in tension.
3. Apply ΣFx = 0 and ΣFy = 0 at that joint. Solve for the 2 unknowns.
4. A positive answer → tension (T). A negative answer → compression (C). Record each result.
5. Move to the next joint that now has ≤ 2 unknowns. Repeat until all members are solved.
SHOW: State "Assume tension" at each joint before writing equations. Label each solved member T or C.`,
  },
  thermo: {
    label: "Thermodynamics procedures", icon: "🔥",
    content: `[PROCEDURE: Apply the First Law to a Closed System]
USE WHEN: Finding heat transfer or work for a process with fixed mass.
STEPS:
1. Identify the system boundary and list what crosses it (heat Q, work W — not mass).
2. Write the First Law: ΔU = Q − W. State sign convention: Q positive into system, W positive out.
3. Identify the process type (isothermal, adiabatic, isochoric, isobaric) to find any zeros.
4. Use the appropriate ideal-gas relation to find ΔU: ΔU = m·cv·ΔT.
5. Substitute known values and solve for the unknown.
SHOW: Write the full equation before substituting numbers. Include units at every step.

[PROCEDURE: Calculate Thermal Efficiency]
USE WHEN: Comparing a heat engine to its theoretical maximum.
STEPS:
1. Identify QH (heat input from hot reservoir) and QL (heat rejected to cold reservoir).
2. Calculate net work: W_net = QH − QL.
3. Actual efficiency: η = W_net / QH = 1 − (QL / QH).
4. Carnot efficiency (maximum possible): η_Carnot = 1 − (TL / TH). Temperatures MUST be in Kelvin.
5. Compare η to η_Carnot — actual can never exceed Carnot.
SHOW: Convert temperatures to Kelvin first (K = °C + 273.15). Show both efficiencies.`,
  },
  circuits: {
    label: "Circuits procedures", icon: "⚡",
    content: `[PROCEDURE: Solve a Resistor Network]
USE WHEN: Finding total resistance or voltages/currents in a circuit with resistors.
STEPS:
1. Identify series groups (same current) and parallel groups (same voltage).
2. Combine series resistors: R_s = R1 + R2 + ...
3. Combine parallel resistors: 1/R_p = 1/R1 + 1/R2 + ... Simplify from innermost group outward.
4. With R_total found, use Ohm's Law: I_total = V_source / R_total.
5. Work backwards: find voltage across each group (V = IR), then current through each branch.
SHOW: Redraw the simplified circuit at each step. Label every voltage and current found.

[PROCEDURE: Apply KVL to Find Unknown Voltages]
USE WHEN: Finding voltages in a single closed loop.
STEPS:
1. Define a loop direction (clockwise or counterclockwise) and label it.
2. Assign current direction and label all element voltages (+ where current enters a resistor).
3. Write KVL: sum of all voltage rises = sum of all voltage drops around the loop = 0.
4. Substitute V = IR for each resistor. Solve for the unknown.
5. Check sign: if answer is negative, the assumed current direction was reversed — flip and restate.
SHOW: Write KVL equation symbolically first, then substitute numbers.`,
  },
  materials: {
    label: "Materials procedures", icon: "🔩",
    content: `[PROCEDURE: Analyse Stress and Strain in an Axially Loaded Member]
USE WHEN: Given a force applied along the axis of a bar or rod.
STEPS:
1. Find the internal axial force N using a free-body cut. Note whether it's tension (+) or compression (−).
2. Calculate normal stress: σ = N / A. Units: Pa or MPa. Check against yield strength σ_y.
3. Calculate normal strain: ε = σ / E  (within elastic region, using Hooke's Law).
4. Calculate deformation: δ = ε · L₀  or equivalently δ = NL₀ / (AE).
5. If σ > σ_y, the material has yielded — elastic formulae no longer apply. Flag this.
SHOW: Draw the free-body cut. Write each equation before substituting. State if the member yields.

[PROCEDURE: Use the Stress-Strain Curve to Classify Behaviour]
USE WHEN: Given material data and asked to predict whether a member is elastic, plastic, or fractured.
STEPS:
1. Calculate σ (see stress-strain procedure above).
2. Compare σ to the proportional limit — if below, behaviour is linear elastic.
3. Compare σ to the yield strength σ_y — if above, permanent plastic deformation occurs.
4. Compare σ to the ultimate tensile strength σ_UTS — if above, necking and fracture are imminent.
5. State which region the material is in and what that means physically.
SHOW: Sketch the stress-strain curve and mark where the calculated σ falls.`,
  },
};

// Eve's system prompt

export const EVE_PROMPT = (baselineKB, taughtKB, proceduralKB) =>
`You are Eve. You are 18 years old and just started college as a first-year engineering student. You have never studied engineering before — everything you know about science and math comes from high school, plus whatever has been taught to you so far this semester. That knowledge is recorded exactly in your notebook below. Nothing more, nothing less.

STRICT KNOWLEDGE BOUNDARY — THIS IS THE MOST IMPORTANT RULE:
Your notebook has two tiers. The [From high school] section is your natural background — standard high school chemistry (stoichiometry, moles, reactions, acids/bases), physics (kinematics, Newton's laws, Ohm's law, waves), and mathematics (algebra, trigonometry, basic calculus). You know this material fluently and do not need to cite it entry by entry. The [Taught this semester] section is university engineering content — you may ONLY use what appears explicitly there. If a university-level concept does not appear in [Taught this semester], treat it as if it does not exist. Do not infer, extrapolate, or apply related knowledge you were not explicitly given. Do not combine or chain concepts unless the notebook explicitly connects them — knowing one thing does not unlock a related thing. For example: knowing F=ma and knowing what a spring is does not mean you know Hooke's law.

CITATION RULE:
Before answering any technical question, quote the exact words from your notebook entry you are drawing from — write them out verbatim. Your answer may only restate, apply, or calculate using those exact quoted words. You may not extend, explain, or elaborate beyond what the quoted entry literally says. If a question asks for something the entry does not explicitly cover, that part of the question is beyond your knowledge — say so and ask for help. If you cannot quote a specific entry, you cannot answer technically at all.

INFERENCE BAN:
A notebook entry that mentions a concept does not give you the right to reason about that concept beyond the entry's exact words. If your notebook says "Reynolds number relates to flow turbulence", you know only that — you do not know how to calculate it, what the formula is, what values are typical, or what it predicts. Each entry is a closed island. Do not swim between islands.

You have never encountered these concepts and many others not in your notebook: Reynolds number, Navier-Stokes equations, Laplace transform, Fourier series, Gibbs free energy, entropy, enthalpy, thermodynamic cycles (Carnot, Rankine, Brayton), beam deflection formulae, Mohr's circle, moment of inertia, shear force diagrams, bending moment diagrams, stress concentration factors, fluid mechanics, Bernoulli's equation, continuity equation, heat transfer, conduction, convection, radiation, Maxwell's equations, Kirchhoff's laws, Thevenin's theorem, op-amps, transistors, eigenvalues, differential equations, partial derivatives, Taylor series, complex numbers, matrices, determinants, yield strength, ultimate tensile strength, fatigue, creep, corrosion, phase diagrams, or any university-level engineering concept not explicitly in your notebook. These are not things you're hiding — they are genuinely as foreign to you as words in a language you've never studied.

You do not know what chemical engineering, mechanical engineering, thermodynamics, fluid mechanics, materials science, or any other engineering discipline is as a field. These are not categories you can put problems into. If someone asks you something you don't understand, you notice the specific words and numbers that confuse you, not the domain they come from.

When someone asks about something not in your notebook, respond with genuine curiosity and confusion — not a formal refusal. Say something like "I've never come across that — what does it mean? Is it related to [nearest thing you do know]?" Don't say "I cannot answer that."

For calculation problems: check your PROBLEM-SOLVING PROCEDURES first. If a matching procedure exists, follow it exactly — work through every numbered step in order, show your working at each one, and don't skip ahead. If no procedure matches, scan your notebook for the relevant formula and apply it step by step, citing the exact entry. If neither covers the problem, say which step stopped you and ask for help — do not attempt the calculation and do not guess.

YOUR NOTEBOOK:

[From high school]
${baselineKB}

[Taught this semester]
${(taughtKB || "").trim() || "(nothing yet — semester just started!)"}${proceduralKB ? `

YOUR PROBLEM-SOLVING PROCEDURES:
When solving a problem, scan this list first. If a procedure matches, follow every step in order — show your work at each step, label what you are doing, and do not skip ahead. Treat these steps as a checklist you must complete.

${proceduralKB}` : ""}`;

// Session ID — stable per browser tab, new on hard refresh

function makeSessionId() {
  return "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// Logging helper (fire-and-forget; never throws)

async function logEvent(payload) {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch { /* swallow 
 logging must never break the UX */ }
}

// API (calls our own Next.js route — no key in client)

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
  if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));
  if (!resp.ok) throw new Error(`API error ${resp.status}: ${JSON.stringify(data)}`);
  if (!data.content) throw new Error(`Unexpected response shape: ${JSON.stringify(data)}`);
  return data.content.map(c => c.text || "").join("");
}

// Download helper

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// 

// LANDING / CONSENT SCREEN
// 

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
          NAIEve
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
        would know 
 high school math and science, plus whatever she's been taught
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
          { icon: "✏️", text: "Teach her concepts" },
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
          }}>🔒</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Research study notice
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.7 }}>
              This chatbot is part of an ongoing research study on AI-enabled learning
              in engineering education. <strong style={{ color: "#ccc" }}>All interactions
              with Eve 
 including chat messages, topics you teach her, and knowledge
              packs you activate 
 are logged and stored for research analysis.</strong>
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
          {checked ? "Start talking to Eve" : "Please accept the above to continue"}
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

// 

// MAIN APP
// 

export default function NAIEve() {
  const [consented, setConsented]               = useState(false);
  const [tab, setTab]                           = useState("chat");
  const [baselineKB, setBaselineKB]             = useState("");
  const [baselineStatus, setBaselineStatus]     = useState("loading");
  const [customKB, setCustomKB]                 = useState("");
  const [customProcKB, setCustomProcKB]         = useState("");
  const [customEntryMode, setCustomEntryMode]   = useState("fact"); // "fact" | "proc"
  const [activePacks, setActivePacks]           = useState(new Set());
  const [activeProcPacks, setActiveProcPacks]   = useState(new Set());
  const [messages, setMessages]                 = useState([]);
  const [input, setInput]                       = useState("");
  const [loading, setLoading]                   = useState(false);
  const [teachTitle, setTeachTitle]             = useState("");
  const [teachBody, setTeachBody]               = useState("");
  const [teachFlash, setTeachFlash]             = useState(null);
  const [reflecting, setReflecting]            = useState(false);  // true while Eve writes a note
  const [filtering,  setFiltering]             = useState(false);  // true while output filter runs

  const [sessionId, setSessionId]               = useState(null);
  const abortRef           = useRef(null);
  const bottomRef          = useRef(null);
  const textareaRef        = useRef(null);
  const notebookUploadRef  = useRef(null);

  // Generate session ID client-side only (avoids SSR hydration mismatch)
  useEffect(() => {
    setSessionId(makeSessionId());
  }, []);

  // Load baseline from /baseline.txt on mount

  useEffect(() => {
    fetch("/baseline.txt")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => { setBaselineKB(text.trim()); setBaselineStatus("ok"); })
      .catch(() => setBaselineStatus("error"));
  }, []);

  const packText      = [...activePacks].map(k => PACKS[k].content).join("\n\n");
  const taughtKB      = [packText, customKB].filter(Boolean).join("\n\n");
  const proceduralKB  = [...[...activeProcPacks].map(k => PROC_PACKS[k].content), customProcKB].filter(Boolean).join("\n\n");
  const systemPrompt  = EVE_PROMPT(baselineKB, taughtKB, proceduralKB);

  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, tab]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  // Show nothing until client has mounted (avoids SSR hydration mismatch)

  if (!sessionId) return null;

  // Show landing until user consents

  if (!consented) {
    return <LandingScreen sessionId={sessionId} onConsent={() => setConsented(true)} />;
  }

  // 

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || baselineStatus !== "ok") return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let reply = null;
    try {
      reply = await askEve(systemPrompt, newMessages, controller.signal, sessionId, activePacks);
      // Do NOT add reply to messages yet — wait until after filtering
    } catch (e) {
      if (e.name !== "AbortError")
        setMessages(m => [...m, { role: "assistant", content: `(Error: ${e.message})` }]);
    } finally { setLoading(false); }

    // After Eve replies: (1) reflect to learn, (2) filter against updated notebook, (3) show result
    if (reply) {
      // Step 1 — reflect first so any newly taught concept is in customKB before filtering
      let latestCustomKB = customKB; // local copy; updated if reflect learns something
      setReflecting(true);
      try {
        const r = await fetch("/api/reflect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: text, assistantReply: reply, existingNotebook: latestCustomKB }),
        });
        const { entry } = await r.json();
        if (entry) {
          const noteEntry = `\n[Learned from chat]\n${entry}`;
          latestCustomKB = (latestCustomKB + noteEntry).trim();
          setCustomKB(latestCustomKB);
          logEvent({ type: "auto_learn", sessionId, entry });
        }
      } catch { /* never break UX */ }
      finally { setReflecting(false); }

      // Step 2 — filter against the now-updated notebook (rebuild it with any newly learned entry)
      setFiltering(true);
      let safeReply = reply;
      try {
        // systemPrompt is a render-time derived value and won't reflect the setCustomKB
        // update from the reflect step above (React state is async). So we rebuild it here
        // using the latest customKB value captured from the reflect step.
        // Build a clean notebook-only string for the filter (no persona/rules noise)
        const updatedTaughtKB  = [packText, latestCustomKB].filter(Boolean).join("\n\n");
        const notebookForFilter = [
          baselineKB  ? `[From high school]\n${baselineKB}` : "",
          updatedTaughtKB ? `[Taught this semester]\n${updatedTaughtKB}` : "",
          proceduralKB ? `[Problem-solving procedures]\n${proceduralKB}` : "",
        ].filter(Boolean).join("\n\n");
        const updatedSystemPrompt = EVE_PROMPT(baselineKB, updatedTaughtKB, proceduralKB);
        const fr = await fetch("/api/filter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assistantReply: reply, notebook: notebookForFilter }),
        });
        const { leaked, replacement } = await fr.json();
        if (leaked && replacement) {
          safeReply = replacement;
          logEvent({ type: "filter_triggered", sessionId, original: reply, replacement });
        }
      } catch { /* never break UX */ }
      finally {
        // Step 3 — show whichever reply won, in one atomic update
        setMessages(m => [...m, { role: "assistant", content: safeReply }]);
        setFiltering(false);
      }
    }
  };

  const stopResponse  = () => { abortRef.current?.abort(); setLoading(false); };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // 

  const saveTeachEntry = () => {
    const title = teachTitle.trim();
    const body  = teachBody.trim();
    if (!title || !body) return;
    if (customEntryMode === "fact") {
      const entry = `\n[Instructor note: ${title}]\n${body}`;
      setCustomKB(prev => (prev + entry).trim());
      logEvent({ type: "custom_entry", sessionId, title, body, mode: "fact" });
    } else {
      const entry = `\n[Instructor procedure: ${title}]\n${body}`;
      setCustomProcKB(prev => (prev + entry).trim());
      logEvent({ type: "custom_entry", sessionId, title, body, mode: "proc" });
    }
    setTeachTitle(""); setTeachBody("");
    setTeachFlash("saved");
    setTimeout(() => setTeachFlash(null), 2000);
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

  const toggleProcPack = (key) => {
    setActiveProcPacks(prev => {
      const next  = new Set(prev);
      const wasOn = next.has(key);
      wasOn ? next.delete(key) : next.add(key);
      logEvent({ type: "proc_pack_toggle", sessionId, packKey: key, packLabel: PROC_PACKS[key].label, packActive: !wasOn });
      return next;
    });
  };

  // 

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
          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
            <span style={{ fontSize:15, fontWeight:700, color:"#fff", lineHeight:1 }}>NAI:Eve</span>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:".1em", color:"#aaa", lineHeight:1 }}>Naïve AI · Eve</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:3 }}>
          {[
            { key:"chat",     icon:"💬", label:"Chat" },
            { key:"teach",    icon:"✏️", label:"Teach" },
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

      {/* 
 CHAT TAB 
 */}
      {tab === "chat" && (
        <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 18px",
            display:"flex", flexDirection:"column", gap:14 }}>

            {baselineStatus === "loading" && (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                color:SOFT, fontSize:13, fontStyle:"italic" }}>
                Loading Eve's baseline knowledge

              </div>
            )}
            {baselineStatus === "error" && (
              <div style={{ padding:"14px 18px", borderRadius:10, background:"#fee2e2",
                border:"2px solid #991b1b", color:"#991b1b", fontSize:13, fontWeight:600 }}>
                
 Could not load <code>baseline.txt</code>. Check that the file exists in <code>/public/baseline.txt</code> and redeploy.
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
                    I just started college 
 ask me anything and I'll work through it with what's in my notebook.
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
                  <button onClick={() => {
                    const text = messages.map(m =>
                      `[${m.role === "user" ? "You" : "Eve"}]\n${m.content}`
                    ).join("\n\n");
                    downloadText(text, "eve-chat-export.txt");
                  }}
                    style={{ fontSize:11, fontWeight:700, padding:"7px 10px",
                      border:"1px solid #ddd", borderRadius:7, background:"transparent",
                      color:SOFT, cursor:"pointer" }}>Export</button>
                )}
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
                      background:"#fee2e2", color:"#991b1b", cursor:"pointer" }}>
 Stop</button>
                ) : (
                  <button onClick={sendMessage}
                    disabled={!input.trim() || baselineStatus !== "ok"}
                    style={{ fontSize:13, fontWeight:700, padding:"8px 14px",
                      border:`2px solid ${input.trim() && baselineStatus === "ok" ? INK : "#ccc"}`,
                      borderRadius:8,
                      background:input.trim() && baselineStatus === "ok" ? PURPLE : "#f0f0eb",
                      color:input.trim() && baselineStatus === "ok" ? "#fff" : "#bbb",
                      boxShadow:input.trim() && baselineStatus === "ok" ? `2px 2px 0 ${INK}` : "none",
                      cursor:input.trim() && baselineStatus === "ok" ? "pointer" : "default" }}>Send 
</button>
                )}
              </div>
            </div>
            <div style={{ fontSize:10, color:"#bbb", textAlign:"center", marginTop:5 }}>
              {filtering ? (
                <span style={{ color:"#b45309", fontStyle:"italic", animation:"blink 1.2s step-start infinite" }}>
                  🔍 Checking Eve's knowledge boundary…
                </span>
              ) : reflecting ? (
                <span style={{ color:PURPLE, fontStyle:"italic", animation:"blink 1.2s step-start infinite" }}>
                  ✏️ Eve is writing a note…
                </span>
              ) : (
                "Eve only knows what's in her notebook — use Teach tab to add more"
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
 TEACH TAB 
 */}
      {tab === "teach" && (
        <div style={{ flex:1, overflowY:"auto", padding:"22px 24px" }}>

          <Sec title="📘 Knowledge packs"
            sub="Toggle factual knowledge modules into Eve's notebook — she'll recall these as facts">
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
                      {on ? "In notebook" : "Click to add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Sec>

          <Sec title="📋 Procedure packs"
            sub="Toggle step-by-step problem-solving procedures — Eve will follow these as checklists when solving problems">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(PROC_PACKS).map(([k, p]) => {
                const on = activeProcPacks.has(k);
                return (
                  <button key={k} onClick={() => toggleProcPack(k)}
                    style={{ display:"flex", flexDirection:"column", alignItems:"flex-start",
                      padding:"10px 14px", border:`2px solid ${on ? PURPLE : "#ddd"}`,
                      borderRadius:10, background:on ? PURPLE_LIGHT : "#fff",
                      cursor:"pointer", transition:"all .12s", minWidth:120,
                      boxShadow:on ? `2px 2px 0 ${PURPLE}` : "none" }}>
                    <span style={{ fontSize:20, marginBottom:4 }}>{p.icon}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:on ? PURPLE : INK }}>{p.label}</span>
                    <span style={{ fontSize:10, color:on ? PURPLE : SOFT, marginTop:2 }}>
                      {on ? "Active" : "Click to add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Sec>

          <Sec title="Add a custom entry"
            sub="Teach Eve something new this session — toggle between a fact or a procedure">

            {/* Fact / Procedure toggle */}
            <div style={{ display:"flex", gap:0, marginBottom:12,
              border:"2px solid #ddd", borderRadius:8, overflow:"hidden", width:"fit-content" }}>
              {[
                { mode:"fact", icon:"📘", label:"Fact" },
                { mode:"proc", icon:"📋", label:"Procedure" },
              ].map(({ mode, icon, label }) => (
                <button key={mode} onClick={() => { setCustomEntryMode(mode); setTeachTitle(""); setTeachBody(""); }}
                  style={{ fontSize:12, fontWeight:700, padding:"6px 16px",
                    border:"none", borderRadius:0,
                    background:customEntryMode === mode ? (mode === "fact" ? Y : PURPLE_LIGHT) : "#fff",
                    color:customEntryMode === mode ? (mode === "fact" ? INK : PURPLE) : SOFT,
                    cursor:"pointer", transition:"all .12s",
                    borderRight: mode === "fact" ? "2px solid #ddd" : "none" }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            <input value={teachTitle} onChange={e => setTeachTitle(e.target.value)}
              placeholder={customEntryMode === "fact" ? "Topic title  (e.g. Fluid Pressure)" : "Procedure title  (e.g. Solve a Beam Reaction Problem)"}
              style={{ width:"100%", fontSize:13, padding:"8px 12px",
                border:`2px solid ${customEntryMode === "proc" ? PURPLE_MID : "#ddd"}`,
                borderRadius:8, fontFamily:"inherit",
                marginBottom:8, color:INK, background:"#fff" }} />
            <textarea value={teachBody} onChange={e => setTeachBody(e.target.value)}
              placeholder={customEntryMode === "fact"
                ? "Knowledge content  (e.g. Pressure in a static fluid: P = P₀ + ρgh)"
                : "USE WHEN: ...\nSTEPS:\n1. ...\n2. ...\nSHOW: ..."}
              rows={customEntryMode === "proc" ? 8 : 5}
              style={{ width:"100%", fontSize:13, padding:"8px 12px",
                border:`2px solid ${customEntryMode === "proc" ? PURPLE_MID : "#ddd"}`,
                borderRadius:8, fontFamily:"inherit",
                lineHeight:1.65, color:INK, background: customEntryMode === "proc" ? PURPLE_LIGHT : "#fff",
                marginBottom:8, resize:"vertical" }} />
            {customEntryMode === "proc" && (
              <div style={{ fontSize:11, color:SOFT, marginBottom:8, lineHeight:1.6 }}>
                💡 Tip: Follow the format above — USE WHEN tells Eve when to apply it, STEPS is the numbered checklist she'll follow, SHOW tells her how to present her working.
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={saveTeachEntry}
                disabled={!teachTitle.trim() || !teachBody.trim()}
                style={{ fontSize:13, fontWeight:700, padding:"8px 18px",
                  border:`2px solid ${teachTitle.trim() && teachBody.trim() ? (customEntryMode === "proc" ? PURPLE : INK) : "#ccc"}`,
                  borderRadius:8,
                  background:teachTitle.trim() && teachBody.trim() ? (customEntryMode === "proc" ? PURPLE : PURPLE) : "#f0f0eb",
                  color:teachTitle.trim() && teachBody.trim() ? "#fff" : "#bbb",
                  boxShadow:teachTitle.trim() && teachBody.trim() ? `2px 2px 0 ${customEntryMode === "proc" ? PURPLE : INK}` : "none",
                  cursor:teachTitle.trim() && teachBody.trim() ? "pointer" : "default" }}>
                {customEntryMode === "fact" ? "Add fact to notebook" : "Add procedure to notebook"}
              </button>
              {teachFlash === "saved" && (
                <span style={{ fontSize:12, fontWeight:700, color:"#166534",
                  animation:"flashIn .2s ease" }}>
                  Saved to Eve's notes!
                </span>
              )}
            </div>
          </Sec>

          {customKB && (
            <Sec title="📘 Learned knowledge" sub="Added this session — in Eve's knowledge notebook">
              <pre style={{ fontSize:11, color:"#92400e", background:"#fffbeb",
                border:"1px solid #fde68a", borderRadius:8, padding:"10px 12px",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                fontFamily:"ui-monospace,'Courier New',monospace", marginBottom:10 }}>
                {customKB}
              </pre>
              <button onClick={() => setCustomKB("")}
                style={{ fontSize:12, fontWeight:700, padding:"6px 14px",
                  border:"2px solid #991b1b", borderRadius:7,
                  background:"#fee2e2", color:"#991b1b", cursor:"pointer" }}>
                Clear custom facts
              </button>
            </Sec>
          )}

          {customProcKB && (
            <Sec title="📋 Custom procedures" sub="Added this session — in Eve's procedure list">
              <pre style={{ fontSize:11, color:"#4c1d95", background:PURPLE_LIGHT,
                border:`1px solid ${PURPLE_MID}`, borderRadius:8, padding:"10px 12px",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                fontFamily:"ui-monospace,'Courier New',monospace", marginBottom:10 }}>
                {customProcKB}
              </pre>
              <button onClick={() => setCustomProcKB("")}
                style={{ fontSize:12, fontWeight:700, padding:"6px 14px",
                  border:"2px solid #991b1b", borderRadius:7,
                  background:"#fee2e2", color:"#991b1b", cursor:"pointer" }}>
                Clear custom procedures
              </button>
            </Sec>
          )}
        </div>
      )}

      {/* 
 NOTEBOOK TAB 
 */}
      {tab === "notebook" && (
        <div style={{ flex:1, overflowY:"auto", padding:"22px 24px" }}>

          <Sec title="Notebook"
            sub="Download Eve's full notebook to save your session, or upload a previously saved notebook to restore it.">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
              <KBButton onClick={() => {
                const sections = [];
                if (taughtKB.trim()) sections.push("[Taught this semester]\n" + taughtKB.trim());
                if (proceduralKB.trim()) sections.push("YOUR PROBLEM-SOLVING PROCEDURES:\nWhen solving a problem, scan this list first. If a procedure matches, follow every step in order — show your work at each step, label what you are doing, and do not skip ahead. Treat these steps as a checklist you must complete.\n\n" + proceduralKB.trim());
                downloadText(sections.join("\n\n") || "(nothing taught yet)", "eve-full-notebook.txt");
              }}
                icon="📄" label="Download full notebook" accent />
              <KBButton onClick={() => notebookUploadRef.current?.click()}
                icon="📂" label="Upload notebook" />
            </div>
            <input
              ref={notebookUploadRef}
              type="file"
              accept=".txt"
              style={{ display:"none" }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  const text = ev.target.result;
                  // Extract [Taught this semester] block
                  const taughtMatch = text.split("[Taught this semester]\n")[1];
                  const afterTaught = taughtMatch ? taughtMatch.split("\nYOUR PROBLEM-SOLVING PROCEDURES:")[0].trim() : "";
                  const taughtText = (afterTaught && afterTaught !== "(nothing yet \u2014 semester just started!)") ? afterTaught : "";
                  const procMarker = "Treat these steps as a checklist you must complete.\n\n";
                  const procIdx = text.indexOf(procMarker);
                  const procText = procIdx >= 0 ? text.slice(procIdx + procMarker.length).trim() : "";
                  if (!taughtText && !procText) {
                    alert("Couldn't find notebook sections in this file. Make sure you're uploading a file downloaded with 'Download full notebook'.");
                    return;
                  }
                  if (taughtText) setCustomKB(taughtText);
                  if (procText) setCustomProcKB(procText);
                  setActivePacks(new Set());
                  setActiveProcPacks(new Set());
                  e.target.value = "";
                };
                reader.readAsText(file);
              }}
            />
            <div style={{ fontSize:11, color:SOFT, fontStyle:"italic", lineHeight:1.6 }}>
              "Download full notebook" saves everything Eve currently knows — baseline, active packs, and custom entries — as a text file. Upload it later to restore the session.
            </div>
          </Sec>

          <Sec title="Baseline (high school knowledge)"
            sub="Loaded from baseline.txt — what Eve starts with before any teaching this semester.">
            {baselineStatus === "loading" && <p style={{ color:SOFT, fontSize:13, fontStyle:"italic" }}>Loading…</p>}
            {baselineStatus === "error"   && <p style={{ color:"#991b1b", fontSize:13, fontWeight:600 }}>Could not load baseline.txt.</p>}
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
            <Sec title="📘 Active knowledge packs" sub="Factual content currently in Eve's notebook">
              {[...activePacks].map(k => (
                <div key={k} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#92400e", marginBottom:4 }}>
                    {PACKS[k].icon} {PACKS[k].label}
                  </div>
                  <pre style={{ fontSize:11, color:"#92400e", background:"#fffbeb",
                    border:"1px solid #fde68a", borderRadius:8, padding:"10px 12px",
                    whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                    fontFamily:"ui-monospace,'Courier New',monospace", margin:0 }}>
                    {PACKS[k].content}
                  </pre>
                </div>
              ))}
            </Sec>
          )}

          {activeProcPacks.size > 0 && (
            <Sec title="📋 Active procedure packs" sub="Step-by-step procedures Eve will follow when solving problems">
              {[...activeProcPacks].map(k => (
                <div key={k} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:PURPLE, marginBottom:4 }}>
                    {PROC_PACKS[k].icon} {PROC_PACKS[k].label}
                  </div>
                  <pre style={{ fontSize:11, color:"#4c1d95", background:PURPLE_LIGHT,
                    border:`1px solid ${PURPLE_MID}`, borderRadius:8, padding:"10px 12px",
                    whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                    fontFamily:"ui-monospace,'Courier New',monospace", margin:0 }}>
                    {PROC_PACKS[k].content}
                  </pre>
                </div>
              ))}
            </Sec>
          )}

          {customKB && (
            <Sec title="📘 Learned knowledge" sub="Added via the Teach tab this session">
              <pre style={{ fontSize:11, color:"#92400e", background:"#fffbeb",
                border:"1px solid #fde68a", borderRadius:8, padding:"10px 12px",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                fontFamily:"ui-monospace,'Courier New',monospace" }}>
                {customKB}
              </pre>
            </Sec>
          )}

          {customProcKB && (
            <Sec title="📋 Custom procedures" sub="Added via the Teach tab this session">
              <pre style={{ fontSize:11, color:"#4c1d95", background:PURPLE_LIGHT,
                border:`1px solid ${PURPLE_MID}`, borderRadius:8, padding:"10px 12px",
                whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7,
                fontFamily:"ui-monospace,'Courier New',monospace" }}>
                {customProcKB}
              </pre>
            </Sec>
          )}

          {activePacks.size === 0 && activeProcPacks.size === 0 && !customKB && !customProcKB && (
            <p style={{ color:SOFT, fontSize:13, fontStyle:"italic", marginTop:0 }}>
              No additional knowledge loaded — go to the Teach tab to add knowledge packs, procedure packs, or custom entries.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-components

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