# Triage report — AIR-6794

> **This report was NOT applied to YouTrack.** The automation environment has read-only
> (anonymous `guest`) access to youtrack.jetbrains.com; field updates and comments return
> HTTP 403. The recommended field values and the ready-to-paste comment are below so a
> human with write access can apply them in under a minute. See
> [Why this wasn't applied automatically](#why-this-wasnt-applied-automatically).

**Issue:** [AIR-6794 — Add the ability to collapse the question widget to have more space to read a chat](https://youtrack.jetbrains.com/issue/AIR-6794)
**Reporter:** Pavel Shnyrin · **Created:** 2026-08-12 · **State:** Submitted

---

## Recommended field values

| Field | Current | Recommended | Change? |
|---|---|---|---|
| Priority | Normal | **Normal** | confirm, no change |
| Type | Usability Problem | **Usability Problem** | confirm, no change |
| Subsystem | *(empty)* | **Chat** | **set this** |
| Assignee | Ilya Tsoy | *see note* | flag for review |
| State | Submitted | Submitted | no change |

The only field that actually needs editing is **Subsystem → Chat**. Priority and Type were
already correct on submission; this report confirms them against project data rather than
changing them.

**Assignee note:** currently Ilya Tsoy. All prior work on this specific widget belongs to
Daniil Drukarev (AIR-3722, AIR-4636). Worth a second look — unless Ilya Tsoy holds it as
triage owner rather than implementer.

---

## Ready-to-paste comment

Everything between the rules below is intended to be pasted into AIR-6794 as a single comment.

---

**Triage: Priority `Normal` (confirmed) · Type `Usability Problem` (confirmed) · Subsystem `Chat` (newly set)**

**Why Normal.** Calibrated against a 400-issue sample of open AIR issues: 88% are `Normal`,
10% `Major`, 1.5% `Critical`. Every one of the 23 open `Usability Problem` issues in the
project is `Normal` — there is no precedent in this project for a usability issue above
Normal. `Major` here is reserved for functional breakage (AIR-3427 incorrect scroll position
after collapsing a diff, AIR-3345 jumpy streaming); `Critical` for backend/perf failures
(AIR-4219, AIR-6332). This report is a non-blocking space-allocation complaint with an
available workaround (scroll the chat), no data loss, and no broken behaviour, so Normal is
the consistent call.

One argument for *not* letting it sink to the bottom of the Normal bucket: the question
widget sits in the core agent interaction loop, so the friction recurs on every clarifying
question rather than in a corner case. High frequency, low per-instance severity.

**Why Usability Problem rather than Feature.** The summary is phrased as a feature ("Add the
ability to…"), and the closest open analogue — AIR-5333, collapsible code blocks in Chat —
is typed `Feature`. But the reporter's framing is that existing UI actively obstructs an
existing workflow ("they have very limited space"), which is the `Usability Problem` shape,
matching the AIR-3640 precedent (Auto Expand Snapshot Diff). Keeping `Usability Problem`.
If the team prefers to track it as roadmap work alongside AIR-5333, `Feature` is defensible
— worth aligning the two tickets either way.

**Likely root cause.** This is not a regression; it is an intentional layout decision now
showing its edge. The question widget is rendered as a fixed bottom widget sized to fit all
answer options, and per AIR-4636 its width was deliberately matched to the plan widget with
the plan widget hidden while it is visible. Nothing in that design gives the widget a
collapsed state, so a tall option list simply consumes chat viewport with no user recourse.

**Pointers for whoever picks this up:**

- **AIR-3722** — *Add Questions widget* (Major, Feature, Ready for test, Subsystem Chat,
  Daniil Drukarev). The origin ticket; has the Figma for the widget. Start here.
- **AIR-4636** — *Bottom widgets improvements* (Verified, Daniil Drukarev). Establishes the
  bottom-widget container rules: "hide the plan widget when the question widget is visible"
  and "make the width of the question widget same as plan widget". A collapse toggle almost
  certainly belongs in this container's logic, and its interaction with the plan-widget
  visibility rule needs deciding — if the question widget collapses, should the plan widget
  come back?
- **AIR-6499** — *Answers and MCP tool-call widgets have broken layout* (open, Subsystem UI,
  Aleksandr Chernokoz). Same layout surface. Sequence these two — a layout fix there may
  deliver part of this, or conflict with it.
- **AIR-5333** — *Make code blocks collapsable in Chat* (open, Feature). Same
  collapse-in-chat interaction. These should share one collapsible primitive and one
  keyboard affordance instead of growing two independent expanders.
- **AIR-4596** — *Not possible to set focus to the question widget back* (Verified,
  Usability Problem). Focus-management regression risk: a collapse/expand cycle must restore
  focus into the widget, which is exactly what broke before. Cover it in the fix.
- **AIR-6332** — *MCP Tool Call Widgets perform poorly in WASM* (Critical, Performance
  Problem). Tangential upside — a collapsed widget that skips rendering its option list
  reduces widget render cost.
- **AIR-3640** — *Auto Expand Snapshot Diff* (Planned, Usability Problem, Subsystem UX).
  Precedent for expand/collapse default-state decisions; worth matching its convention so
  collapse behaviour is consistent across the product.

**Design questions the implementer will hit:** should collapse state persist across
questions or reset per question; should it auto-collapse once an answer is submitted
(likely the cheapest 80% win, and may partly satisfy the request without a manual toggle);
and does a collapsed widget still need to signal that an answer is pending, so the request
isn't silently buried.

**Caveat on this triage:** the field/priority calibration and issue cross-references are
grounded in YouTrack data and are reliable. The root-cause paragraph is inferred from the
related tickets' descriptions, *not* from reading Air source — this automation had no access
to the Air codebase (see below). Treat the root cause as a starting hypothesis to verify.

---

## Why this wasn't applied automatically

Two environment problems blocked the automation from doing the job itself. Both are
configuration-level, not transient.

**1. No YouTrack write access.** The run authenticates to youtrack.jetbrains.com as
anonymous `guest` (`GET /api/users/me` → `{"login":"guest","guest":true}`). Public reads on
the AIR project succeed, which is why the analysis above was possible; every write is
rejected (`POST /api/issues/AIR-6794/comments` → HTTP 403). No YouTrack credential is
present in the environment — the only provisioned token is `ai-platform-auth`, a Grazie
AI-platform JWT unrelated to YouTrack. The connected MCP server (`Air`) exposes exactly one
tool, `permission-tool`, with no issue-tracker capability.

*To fix:* attach a YouTrack token with `Update Issue` and `Create Comment` permission on the
AIR project, or connect a YouTrack MCP server to this automation.

**2. The automation is pointed at the wrong repository.** The task says "search the codebase
for context", but the checkout is `natojb/expensesapp` — a React/TypeScript personal expense
tracker (`src/components/ExpenseForm`, `ExpenseList`, `Dashboard`, `utils/storage.ts`). It
contains no Air product code, no chat UI and no widget code; its only JetBrains references
are Junie GitHub Action workflows in `.github/workflows/`. Searches for `question widget`,
`collapse`, `chat` and `widget` across the checkout return zero source matches. The codebase
half of the triage was therefore impossible, and the root-cause analysis above is inferred
from YouTrack rather than read from source.

*To fix:* point this automation at the Air repository.

**3. Minor — output behaviour mismatch.** The automation's output behaviour is `create-pr`,
which is why this triage arrives as a pull request against the expenses app. For an issue
triage automation the natural output is a YouTrack comment plus field updates. Once item 1
is fixed, switching the output behaviour away from `create-pr` would stop these reports
landing as PRs in an unrelated repo. **This PR is a delivery vehicle, not a code change —
close it once the fields and comment are applied to AIR-6794.**

---

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=3c6e2cd0-16b4-460b-9fdf-39deb95ec9bf
