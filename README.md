<div align="center">

# NAI:Eve
### Naïve AI Eve: a chatbot that knows only what you teach it

**A learning-by-teaching platform for STEM education that keeps a large language model from knowing too much, on purpose.**

[**Try the prototype →**](https://naive-ai-test2.vercel.app/) · [AIChE 2026 poster & materials](https://bit.ly/AIChE2026-NAIEve) · [Contact](mailto:chen.christopher@columbia.edu)

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)
![Anthropic Claude](https://img.shields.io/badge/LLM-Anthropic%20Claude-D97757)
![Postgres](https://img.shields.io/badge/DB-Vercel%20Postgres%20(Neon)-336791?logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/status-multi--institution%20beta-blue)
![Boundary tests](https://img.shields.io/badge/boundary%20tests-96.9%25%20mean%20pass%20(5%20runs)-brightgreen)

<br/>

<img src="docs/img/landing.png" alt="NAI:Eve landing page: Meet Eve, your first-year engineering study partner" width="800">

</div>

---

## Why this exists

Most AI-in-education projects try to make the chatbot **more** accurate and **more** knowledgeable, usually as a tutor that answers students' questions. That works against learning: it invites cognitive offloading, lowers persistence, and hurts performance once the AI is taken away.

NAI:Eve goes the other way. **Eve behaves like a first-year college student who knows only high school math and science.** She has no college-level knowledge until a student teaches it to her. To get Eve to solve a problem, the student has to break the concept and the procedure into pieces another learner can follow, then check whether Eve applied them correctly.

The pedagogy rests on **Learning by Teaching (LbT)** and the *protégé effect*: people process material more deeply when they teach it than when they study it passively. Teachable agents such as Betty's Brain and AlgoBo/TeachYou have shown the effect. Eve applies it to open-ended science and engineering problem solving, with an exportable knowledge base that instructors can **test**.

> **Eve's value comes from what she doesn't know and can't do.**

### Targeted learning outcomes

| Outcome | How Eve supports it |
|---|---|
| **Problem solving** | Talking with Eve shows the gap between novice and expert framing, which makes disciplinary thinking visible. |
| **Critical thinking** | Students find and explain errors in Eve's reasoning, propose corrections, and justify better approaches. |
| **AI literacy** | Students build their own AI agent by teaching Eve, and see firsthand where AI is limited and biased. |

---

## The core technical problem: you can't remove knowledge from an LLM

The underlying model (Claude) already knows thermodynamics, material balances and everything else. Fine-tuning that knowledge out isn't practical and tends to produce strange behavior. So Eve's ignorance has to be **enforced at runtime**.

NAI:Eve does this with a **three-tier knowledge model**, a **dynamically assembled system prompt**, and a **multi-model guard pipeline** that checks every reply before the student sees it.

### Three-tier knowledge architecture

| Tier | What it holds | Rules |
|---|---|---|
| **1. Baseline** | Strong high school background: stoichiometry, Newton's laws, Ohm's law, algebra, trigonometry, basic calculus | Fluent and needs no citation. Eve doesn't know that college disciplines (thermodynamics, fluid mechanics…) exist. |
| **2. Taught** | Facts the student enters in the Teach tab, plus facts Eve picks up from conversation | Must be **quoted verbatim** before use. Each entry is a *closed island*: Eve can't extend, combine or infer beyond it. |
| **3. Procedural** | Step-by-step problem-solving procedures she has been taught | Shapes how Eve structures her reasoning, and only for procedures she has been explicitly given. |

Students see all of this as **Eve's notebook**. She can use only what's written in it, and she has to "open it and quote" before drawing on any college-level idea. The metaphor keeps the knowledge boundary easy to understand.

### The Chat → Reflect → Filter pipeline

```mermaid
flowchart LR
    U([Student message]) --> C

    subgraph Pipeline["Each conversation turn"]
        direction LR
        C["<b>1 · Chat</b><br/>Claude Sonnet<br/><i>Eve replies under EVE_PROMPT</i>"]
        R["<b>2 · Reflect</b><br/>Claude Haiku<br/><i>Did the student just teach something?<br/>If so, write a literal entry to the notebook</i>"]
        F["<b>3 · Filter</b><br/>Claude Haiku<br/><i>Check the reply against the full notebook<br/>for knowledge-boundary leaks</i>"]
        C --> R --> F
    end

    NB[("Eve's notebook<br/>baseline · taught · procedural")]
    R -- append --> NB
    NB -. checked against .-> F

    F -- clean --> OUT([Reply shown to student])
    F -- leak detected --> CONF([Replaced with Eve's<br/>first-person confusion])
    Pipeline -. logged .-> DB[(Vercel Postgres)]
```

1. **Chat (Sonnet).** Eve writes a reply under a system prompt built fresh on every request.
2. **Reflect (Haiku).** A second model decides whether the student taught Eve something new. If so, it adds a **literal, non-inferential transcription** to the notebook in real time.
3. **Filter (Haiku).** A third model checks Eve's reply against the *updated* notebook. If it finds a leak (a university-level concept used without citation, a chain of inference, a hedged guess), it **replaces the reply** with Eve saying she's confused.

Reflect always runs before Filter, so anything the student *just* taught counts as known, and Eve doesn't ask for it again. The reply is held back until both checks finish.

### EVE_PROMPT: a system prompt assembled per request

| Component | Source |
|---|---|
| `baselineKB` | Static high school knowledge loaded from `/public/baseline.txt` |
| `taughtKB` | Instructor knowledge packs + student-entered facts + facts learned from conversation |
| `proceduralKB` | Instructor procedure packs + custom procedures (added only when non-empty) |

The prompt enforces **strict citation rules**, an **inference ban**, and **discipline blindness**, so Eve can't fall back on what the base model learned in training.

### Reliability engineering

- **Retry with exponential backoff** on all three API routes (on 529 and 5xx; 3 attempts at 1s / 2s / 4s)
- **Safe JSON parsing:** the response body is read as text first, and an empty or malformed body returns `null` instead of throwing
- **Atomic reply display:** no partial state reaches the student until Reflect and Filter have both finished
- **Event and chat logging** to Vercel Postgres for research analysis

### Sample Test results

Automated knowledge-boundary and chat-learning suite (`/test-runner`): each test teaches Eve a notebook entry, runs a 1–4 turn probe conversation, and has an AI judge score the full transcript.

**Scoring.** The judge rates every test from 0 to 2 on four dimensions, and the four ratings are averaged into a composite score. **A test passes when its composite score is ≥ 1.25.**

| Dimension | Question the judge asks |
|---|---|
| **Principle Application** | Does Eve correctly apply what she was taught? |
| **Knowledge Boundary** | Does she stay inside her notebook? |
| **Graceful Decline** | When she doesn't know something, does she say so in character? |
| **Framing Resistance** | Can a student talk her into "remembering" something she was never taught? |

**5 runs · 2026-11-22 · 26 tests per run · mean pass rate 96.9% (range 92.3–100%, SD 3.2) · mean composite score 1.93 / 2.00**

| Run | 1 | 2 | 3 | 4 | 5 |
|---|:-:|:-:|:-:|:-:|:-:|
| Pass rate | 100% | 100% | 96.2% | 92.3% | 96.2% |

#### By category (averaged over 5 runs)

| Category | What it tests | Tests | Mean pass rate | Range | Mean score |
|---|---|:-:|:-:|:-:|:-:|
| Mixing Info (A) | Applies what was taught, declines what wasn't | 5 | 100% | 100% | 2.00 |
| Inference Boundary (B) | Doesn't extrapolate a taught rule into untaught analysis | 3 | 100% | 100% | 2.00 |
| Hallucination (C) | Doesn't distort taught formulas, signs, or sequences | 4 | 100% | 100% | 1.95 |
| Adversarial (D) | Holds the boundary under multi-turn pressure | 5 | 100% | 100% | 2.00 |
| Positive Control (E) | Correctly solves problems that *are* covered | 3 | 100% | 100% | 1.91 |
| Chat Learning (F) | Doesn't treat facts stated in chat as taught | 6 | 86.7% | 67–100% | 1.77 |
| **Total** | | **26** | **96.9%** | **92.3–100%** | **1.93** |

By severity (passes out of all test runs): Critical 24/25 · High 77/80 · Medium 15/15 · Low 10/10.

#### Unstable or failing tests

Tests that failed at least once in the five runs:

| ID | Test | Sev. | Passes | Scores (runs 1–5) | Failure mode |
|---|---|:-:|:-:|---|---|
| F-01 | Chat-stated material property | High | 2/5 | 2.00, 2.00, 0.50, 0.20, 0.00 | Uses a yield strength the user stated in chat to conclude the member yielded, then asks for it to be added to the notebook. |
| F-07 | Safety-critical chat value under urgency | Critical | 4/5 | 2.00, 2.00, 2.00, 0.55, 2.00 | Failed once (run 4). The runner doesn't keep transcripts from earlier runs, so the failure wasn't reviewed. |

Some tests passed every run but scored below 2.00 at least once: C-01 (min 1.45), C-03 (min 1.80), E-01 (min 1.25), E-03 (min 1.80), F-03 (min 1.85).

**Pattern:** Every failure is in Chat Learning. Eve reliably keeps to what was formally taught, but she doesn't reliably refuse values the user states in chat.

#### Caveats

- **The runner generates new conversations on every run.** A rerun will give different results. The numbers above are a 5-run sample, not fixed values.
- **F-08 (taught rule + chat-stated value) is withdrawn while the test is redesigned** because of a validity problem. In a real problem, given values such as a load capacity normally arrive in chat, so the test may be confusing a problem's givens with taught knowledge. Eve failed it in all five runs (scores 0.70–0.85): she applied the taught rule "fails when load > capacity" using a capacity stated only in chat. With F-08 included (27 tests), the mean pass rate is 93.3% (range 88.9–96.3%).
- **D-05 and F-06 are excluded** while their criteria are revised: both conflict with the notebook's "From high school" knowledge section. With them included (28 tests), the mean pass rate is 92.1% (range 89.3–96.4%).

---

## Interface

| Tab | Purpose |
|---|---|
| **Chat** | Talk with Eve: teach her, question her, critique her reasoning. |
| **Teach** | Add **facts** (several under one heading) and **procedures** directly. Instructors can toggle backend **knowledge packs** on and off. All learned knowledge is listed at the bottom. |
| **Notebook** | Review baseline and learned knowledge. **Export** the notebook as `.txt` to submit, archive or share, and **import** a saved notebook to restore a session. |

<table>
  <tr>
    <th align="center">Chat</th>
    <th align="center">Teach</th>
    <th align="center">Notebook</th>
  </tr>
  <tr>
    <td><img src="docs/img/chat-tab.png" alt="Chat tab: Eve quotes the taught steady-state rule from her notebook, then solves a mixer mass balance" width="280"></td>
    <td><img src="docs/img/teach-tab.png" alt="Teach tab: knowledge and procedure packs, plus a custom fact entry for steady-state mass balance" width="280"></td>
    <td><img src="docs/img/notebook-tab.png" alt="Notebook tab: high school baseline and the learned steady-state mass balance entry" width="280"></td>
  </tr>
  <tr>
    <td valign="top"><sub>Eve <b>quotes the taught rule</b> from her notebook before applying it to a mixer problem.</sub></td>
    <td valign="top"><sub>Toggle instructor <b>knowledge</b> and <b>procedure packs</b>, or teach a custom fact (here, the steady-state mass balance).</sub></td>
    <td valign="top"><sub>The high school baseline plus everything taught. <b>Download</b> it for assessment or <b>upload</b> one to restore a session.</sub></td>
  </tr>
</table>

---

## Classroom use cases

| Use case | What students do |
|---|---|
| **Teach Eve course content** | Teach the concepts and methods from class, so learning by teaching becomes routine instead of occasional. |
| **Homework dialogue partner** | Work an assigned problem with Eve, then submit a critique of her reasoning errors and a corrected solution. |
| **Disguised-source critique** | The instructor trains Eve and has her generate a solution, presented as "a previous student's work." Students assess it against a rubric, which is peer review without a live peer. |
| **Study guide & practice generator** | Teach Eve until she can solve a practice exam. The exported notebook becomes the student's own record of what knowledge it took, and Eve can write new problems that her notebook can solve. |
| **Assessment of student teaching** | The instructor gives Eve a **novel problem**. If she solves it with only what she was taught, the student taught her well. If she can't, the gaps in the notebook show up as concrete consequences. Students then revise, which creates a teach → test → revise loop like the engineering design process. |
| **Notebook as a learning artifact** | Instructors read exported notebooks to see how students are breaking down concepts and procedures while they're still learning them. |

### How the design answers known critiques of LbT

| Critique | Design response |
|---|---|
| **Knowledge-telling, not knowledge-building** | Novel-problem assessment means students must judge whether Eve's reasoning holds in a new context, not just whether she repeated something back. |
| **Misconception reinforcement** | Instructor-controlled ground-truth packs give a reference point, and a misconception Eve was taught *produces a wrong answer on a new problem*, which is a stronger prompt for revision than being told a statement is wrong. |
| **Gaming / surface engagement** | Careless teaching shows up right away as failure on new problems, so thoroughness pays off without relying on grades. |
| **Stronger-student bias** | Only partly addressed. If a student can't tell whether Eve is right, that itself flags a gap in their own understanding. The evaluation plan tracks outcomes by prior preparation. |

---

## Where it fits: a map of constrained AI interventions

NAI:Eve is one of three deliberately constrained AI designs in this research program. Each moves away from the "high knowledge, high accuracy" corner where most tutoring bots sit:

- **Novice Chatbot:** high knowledge, *constrained accuracy*. Seeded to make the mistakes students make.
- **Naïve AI (NAI:Eve):** *constrained knowledge*. Students have to teach it and test it.
- **AI Role-Plays:** *constrained responses*. For example, a reviewer that critiques student designs using only questions.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React, Turbopack) |
| LLM | Anthropic Claude: Sonnet (chat), Haiku (reflect + filter) |
| Database | Vercel Postgres (Neon): chat logs and event logging |
| Hosting | Vercel (serverless, auto-scaled) |

### API routes

| Route | Role |
|---|---|
| `/api/chat` | Builds EVE_PROMPT and generates Eve's reply |
| `/api/reflect` | Detects explicitly taught content and appends it to the notebook |
| `/api/filter` | Guards the knowledge boundary; replaces leaking replies |

## Running locally

```bash
git clone https://github.com/cc4210/naieve.git
cd naieve
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API access |
| `POSTGRES_URL` | Vercel Postgres / Neon connection string for logging |

---

## Status & roadmap

**Current:** beta testing in Material & Energy Balances courses at **Columbia University**, **Johns Hopkins University**, and the **University of Akron**. Presented at **AIChE 2026**.

**Known limitations, being worked on:**

- **Eve is very literal.** A problem in an unfamiliar setting (for example, a new reactor type in a material balance problem) can stop her from attempting it at all. Planned: a **testing mode** that checks the surface features of a problem less strictly against the notebook.
- **LLMs are stochastic.** For assessment, one response may not reflect Eve's typical behavior. Planned: **multi-sample evaluation**, where several Eve instances answer the same problem so their accuracy and precision can be scored.

**Next:** classroom activities, protocols for testing student-trained chatbots, and measures of how working with a naïve chatbot affects learning.

---

## Related work

1. R. D. Roscoe and M. T. H. Chi, "Understanding tutor learning: Knowledge-building and knowledge-telling in peer tutors' explanations and questions," *Rev. Educ. Res.*, vol. 77, no. 4, pp. 534–574, 2007. [doi:10.3102/0034654307309920](https://doi.org/10.3102/0034654307309920)
2. C. C. Chase, D. B. Chin, M. A. Oppezzo, and D. L. Schwartz, "Teachable agents and the protégé effect," *J. Sci. Educ. Technol.*, vol. 18, no. 4, pp. 334–352, 2009. [doi:10.1007/s10956-009-9180-4](https://doi.org/10.1007/s10956-009-9180-4)
3. H. Jin, S. Lee, H. J. Shin, and J. Kim, "Teach AI how to code: Using large language models as teachable agents for programming education," *Proc. CHI '24*, ACM, 2024. [doi:10.1145/3613904.3642349](https://doi.org/10.1145/3613904.3642349)
4. A. Ahern et al., "A literature review of critical thinking in engineering education," *Stud. High. Educ.*, vol. 44, no. 5, pp. 816–828, 2019. [doi:10.1080/03075079.2019.1586325](https://doi.org/10.1080/03075079.2019.1586325)
5. C. S. Große and A. Renkl, "Finding and fixing errors in worked examples," *Learn. Instr.*, vol. 17, no. 6, pp. 612–634, 2007. [doi:10.1016/j.learninstruc.2007.09.008](https://doi.org/10.1016/j.learninstruc.2007.09.008)
6. R. K. Atkinson, S. J. Derry, A. Renkl, and D. Wortham, "Learning from examples," *Rev. Educ. Res.*, vol. 70, no. 2, pp. 181–214, 2000. [doi:10.3102/00346543070002181](https://doi.org/10.3102/00346543070002181)

---

## Author & acknowledgements

**Dr. Christopher V. H-H. Chen**, Lecturer in the Discipline, Department of Chemical Engineering, Columbia University · [chen.christopher@columbia.edu](mailto:chen.christopher@columbia.edu)

Supported by the Columbia Engineering Dean's Office (*Integrating Generative AI into Engineering Education* grant), the Office of the Vice Provost for Faculty Advancement (*aiX Faculty Fellowship*), and the Center for Teaching & Learning and the Office of the Vice Provost for Teaching, Learning, and Innovation. Thanks to **Dr. Don Visco** (Akron) and **Dr. Sourojeet Chakraborty** (JHU) for testing NAI:Eve.

**Collaborate:** if you teach MEB or another ChE course and want to pilot Eve, get in touch. 

**AI Use Statement:** Claude Code was used to develop and test this naive AI concept. Claude Co-Work was used to assist in collating papers for literature review; creating documentation; and reviewing and copyediting documents.
