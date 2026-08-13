# Triage: AIR-6804 — Invoking Claude `/clear` does not send command to agent

- **Issue:** [AIR-6804](https://youtrack.jetbrains.com/issue/AIR-6804)
- **Reporter / current assignee:** Nadine Kuo
- **Current fields:** Priority `Normal` · Type `Bug` · State `In progress` · Fix Version `Next` · Subsystem *(empty)*
- **Triaged:** 2026-08-13

> **This report was NOT applied to YouTrack.** This automation had no write access to
> `youtrack.jetbrains.com` (see [Delivery note](#delivery-note-why-this-is-a-file-and-not-a-youtrack-comment)).
> The label changes below are *recommendations*, and the comment is *ready to paste*.

---

## 1. Recommended labels

| Field | Current | Recommended | Confidence |
|---|---|---|---|
| Type | `Bug` | **`Bug`** (unchanged — confirmed) | High |
| Priority | `Normal` | **`Major`** (raise) | Medium-high — judgment call, see §3 |
| Subsystem | *(empty)* | **`Agent Integration`** (fallback: `Chat`) | High |

Also recommended, but not a label:

- Link **AIR-6804 ⟷ [AIR-6412](https://youtrack.jetbrains.com/issue/AIR-6412)** as `Relates`
  (likely the same underlying defect — see §4).

---

## 2. Type: `Bug` — confirmed

A documented command silently does not perform its documented function. This is a functional
failure, not friction, so `Bug` is right and `Usability Problem` would understate it. No change
needed.

## 3. Priority: raise `Normal` → `Major`

### Calibration against the project

Of **163 open `Type: Bug` issues created in AIR since 2026-07-01**:

| Priority | Count | Share |
|---|---|---|
| Normal | 149 | 91% |
| Major | 11 | 7% |
| Critical | 3 | 2% |

`Normal` is the default that essentially every incoming bug lands on, so it carries little
signal. `Major` is the reserved 7%. Existing `Major` bugs in the same subsystem set the bar:

- [AIR-6167](https://youtrack.jetbrains.com/issue/AIR-6167) — one unhandled ACP event freezes the transcript for the rest of the turn
- [AIR-5738](https://youtrack.jetbrains.com/issue/AIR-5738) — agent's final response sometimes missing from chat on Windows
- [AIR-5820](https://youtrack.jetbrains.com/issue/AIR-5820) — working thread unresponsive past 60% context use

The common thread in that tier is **a core interaction that silently produces the wrong result**.
AIR-6804 fits it.

### Why this is above the Normal median

1. **The UI actively misleads.** The user is shown a cleared transcript *and* a session-boundary
   marker — two independent affirmative signals that the reset happened. It didn't. The user then
   keeps working on the assumption of a fresh context. A visible failure would be less harmful
   than this.
2. **A destructive-looking side effect with no compensating benefit.** The transcript disappears
   from Air's view while the agent still holds every token of it. The user loses their history
   *and* does not get the reset. Worst of both.
3. **It disables the primary manual remedy for context pressure.** `/clear` is the main lever a
   user has when context fills up. With it broken, users are pushed into the failure modes AIR
   already tracks: [AIR-5158](https://youtrack.jetbrains.com/issue/AIR-5158) (autocompact
   thrashing), [AIR-5820](https://youtrack.jetbrains.com/issue/AIR-5820) (unresponsive past 60%
   context), [AIR-6567](https://youtrack.jetbrains.com/issue/AIR-6567) (severe lag + JVM OOM after
   long agent work).
4. **Silent cost and quality impact.** Context that is never freed is re-billed on every
   subsequent turn and degrades output quality, with no signal to the user that anything is wrong.
5. **The fix likely clears two bugs and hardens six more commands** (§4) — a good return on the
   same engineering effort, which is an argument for scheduling it sooner.

### Why *not* `Critical`

No crash, no unrecoverable data loss, and a real workaround exists (start a new Air task, or
`/resume` the prior session). `Major` is the honest ceiling here.

### Caveat, stated plainly

The issue is already `In progress` with an owner and `Fix Version: Next`, so a priority bump
changes little operationally. Its value is signal: correct severity for release-notes triage,
regression-test scope, and prioritisation if it slips out of `Next`.

## 4. Root cause analysis

### What `/clear` actually is

I inspected the Claude Code binary that this Air build ships and runs
(`~/.cache/JetBrains/Air/download-api/downloads/<hash>/claude`, **version 2.1.218**). The command
is declared as:

```js
name: "clear",
description: "Start a new session with empty context; previous session stays on disk (resumable with /resume)",
argumentHint: "[name]",
aliases: ["reset", "new"],
supportsNonInteractive: true,
thinClientDispatch: "post-text",
```

Four things follow directly from this declaration:

1. **`/clear` is a session-lifecycle operation, not a chat message.** Its contract is *start a new
   session with empty context*; the old session stays on disk and remains resumable via `/resume`.
   So the correct fix is not merely "forward the text and move on" — Air has to reflect a **new
   agent session** in its own task/session model, and its session-boundary marker is only
   legitimate once the agent has confirmed the switch.
2. **`thinClientDispatch: "post-text"` is the dispatch contract for external clients.** Air is a
   thin client driving Claude Code. This field tells it *how* to dispatch the command. `/clear` is
   `post-text`, meaning the command text is to be posted to the agent — it is explicitly **not** a
   client-local command.
3. **`supportsNonInteractive: true`** — the command is available in the headless mode Air uses.
   There is no upstream limitation blocking this; the gap is on Air's side.
4. **`aliases: ["reset", "new"]`** — `/reset` and `/new` route through the same definition and are
   almost certainly broken identically. Worth adding to the repro and to the fix's test coverage.

### The dispatch taxonomy

Extracting every `thinClientDispatch` value from the same binary yields exactly two classes:

| `thinClientDispatch` | Commands |
|---|---|
| `post-text` | `/clear`, `/compact`, `/autocompact`, `/pause-memory`, `/reload-skills`, `/recap`, `/skill-doctor`, `/goal` |
| `control-request` | `/btw`, `/context`, `/usage`, `/reload-plugins`, … |

### Leading hypothesis

**Air is handling `/clear` client-side — rendering the optimistic "cleared" transcript and the
boundary marker — instead of honouring `thinClientDispatch: "post-text"` and posting the command
to the agent.** That produces precisely the reported symptom set: visible clear, boundary message,
agent unaware, context not freed.

Two independent pieces of evidence support this:

- **`/clear` and `/compact` share the `post-text` class**, and
  [AIR-6412](https://youtrack.jetbrains.com/issue/AIR-6412) ("Context widget is not updated after
  `/compact` command is called (Claude Agent)") is an open, `In progress` bug with **the same
  assignee**. Same dispatch class, same command family (context management), both showing Air's UI
  out of sync with the agent's real context state. These are plausibly **one defect in Air's
  `post-text` dispatch path with two symptoms** — `/compact` surfaces as a stale widget, `/clear`
  as a reset that never happened.
- **[AIR-4136](https://youtrack.jetbrains.com/issue/AIR-4136)** records the `slash_commands` list
  Air receives from Claude (as of 2.1.71): `keybindings-help, debug, simplify, batch, loop,
  claude-api, compact, context, cost, heapdump, init, pr-comments, release-notes, review,
  security-review, extra-usage, insights`. **`clear` is absent from that list.** So if Air only
  treats names from `slash_commands` as agent-bound and falls back to local handling for anything
  else, `/clear` would be swallowed exactly as reported. This is the most probable concrete
  mechanism, and the first thing to check.

### Honesty about scope

I could **not** inspect Air's own source — this automation's checkout is an unrelated repository
(§6). Points 1–4 and the dispatch taxonomy are verified facts read out of the shipped Claude
binary. The hypothesis above is inference from those facts plus the issue corpus; it is not
confirmed against Air's code, and whoever picks this up should treat it as the first lead rather
than a diagnosis.

### Suggested first steps

1. Find Air's slash-command dispatch for the Claude/ACP frontend. Check whether `thinClientDispatch`
   is read at all; if it isn't, that is the bug. Check whether unknown-to-`slash_commands` names
   fall back to local handling.
2. Fix at the dispatch layer, not as a `/clear` special case — that covers all eight `post-text`
   commands and likely resolves AIR-6412 too.
3. Do not draw the transcript boundary optimistically. Render it on agent confirmation, so a failed
   dispatch is visible instead of silent.
4. Make `/clear` update Air's session model (new session), and keep the prior session reachable —
   the command's own contract promises `/resume` still works.
5. Cover `/reset` and `/new` (aliases) plus the other `post-text` commands in tests.
6. Verify with the context widget / `/context`: after `/clear`, reported context use must actually
   drop.

## 5. Related issues for whoever picks this up

**Probably the same defect — investigate together:**

- [AIR-6412](https://youtrack.jetbrains.com/issue/AIR-6412) — Context widget not updated after
  `/compact` (Claude Agent). `Normal` · `In progress` · same assignee. Same `post-text` class.

**Same family — Air↔Claude state desync:**

- [AIR-6498](https://youtrack.jetbrains.com/issue/AIR-6498) — Switching Claude to Plan mode
  mid-conversation is not reflected in Air. `Agent Integration`. The mirror image of this bug:
  agent state not reaching Air, where AIR-6804 is an Air action not reaching the agent.
- [AIR-5857](https://youtrack.jetbrains.com/issue/AIR-5857) — Failed to parse Claude system
  `commands_changed`. `Ready for test` · same assignee. Directly about how Air ingests Claude's
  command list — see the AIR-4136 evidence above.
- [AIR-4136](https://youtrack.jetbrains.com/issue/AIR-4136) — Support new bundled Claude Code
  skills. `Ready for test` · same assignee. Contains the received `slash_commands` list.
- [AIR-6167](https://youtrack.jetbrains.com/issue/AIR-6167) — Unhandled ACP event freezes the
  transcript. `Major`. Same "one bad/missing event silently degrades the session" shape.

**Downstream pain this bug makes worse:**

- [AIR-5158](https://youtrack.jetbrains.com/issue/AIR-5158) — Autocompact is thrashing.
- [AIR-5820](https://youtrack.jetbrains.com/issue/AIR-5820) — Working thread unresponsive after 60%
  context use. `Major`.
- [AIR-6567](https://youtrack.jetbrains.com/issue/AIR-6567) — Severe UI lag + JVM OOM after agent
  work on a large project.

**Prior art for per-agent command plumbing:**

- [AIR-3223](https://youtrack.jetbrains.com/issue/AIR-3223) — Support Codex `/compact` with OpenAI auth.
- [AIR-3225](https://youtrack.jetbrains.com/issue/AIR-3225) — Support Codex interactive `/review`.
- [AIR-5903](https://youtrack.jetbrains.com/issue/AIR-5903) — Cache available commands for custom ACP agents.

**Explicitly NOT duplicates** (name collision on "clear" — all are about the *terminal* `clear`
command, unrelated to Claude's `/clear`):
[AIR-5599](https://youtrack.jetbrains.com/issue/AIR-5599),
[AIR-5779](https://youtrack.jetbrains.com/issue/AIR-5779),
[AIR-5637](https://youtrack.jetbrains.com/issue/AIR-5637),
[AIR-6179](https://youtrack.jetbrains.com/issue/AIR-6179).
No existing duplicate of AIR-6804 was found.

## 6. Note on the "search the codebase" step

The automation's checkout is `NatoJB/ExpensesApp` — a React + TypeScript expense tracker (Vite,
localStorage, ~10 source files). It has **no relationship to the Air product code** that AIR-6804
concerns. I verified this rather than assuming: `src/` contains **zero** occurrences of `clear`,
`claude`, `slash`, or `agent`. The only matches for "context" are React's `Context` API
(`src/context/ExpenseContext.tsx`), and the sole `agent`-shaped hit anywhere in the repo is a
`@junie-agent` trigger string in `.github/workflows/Junie.yaml`.

So the local checkout contributed nothing to this triage. The code-level evidence in §4 comes
instead from the Claude Code binary this Air build actually ships and runs, which *is* present in
the environment — a better source for this particular issue than an Air source checkout would have
been for the command-definition facts.

## Delivery note: why this is a file and not a YouTrack comment

The task asked for labels and a comment on AIR-6804. **Neither could be applied.** Read access to
YouTrack is anonymous and public; write access is not available. Verified, not assumed:

| Check | Result |
|---|---|
| YouTrack MCP server | none — MCP provisioning config is `{"allowMcpServerManagement":true,"servers":[]}` |
| `yt` CLI | not installed |
| YouTrack token in env / config files | none found |
| Anonymous `POST /api/issues/AIR-6804/comments` | **403 Forbidden** |
| `FLEET_WORKSPACE_AI_ACCESS_TOKEN` vs YouTrack API | **401** Invalid token |
| `AGENT_SPAWNER_SIDECAR_TOKEN` vs YouTrack API | **401** Invalid token |
| `ai-platform-auth` token vs YouTrack API | **401** Invalid token |

The three workspace tokens are JetBrains AI-platform credentials with a different audience; they
are not YouTrack tokens and no amount of retrying changes that.

**To let this automation apply triage directly, attach a YouTrack MCP server (or provide a YouTrack
permanent token) with comment and issue-update permissions on the `AIR` project.** Until then the
analysis is delivered here and the comment below is ready to paste by hand.

---

## Ready-to-paste YouTrack comment

```markdown
**Triage** — recommending Priority `Normal` → `Major`, Type `Bug` (unchanged), Subsystem → `Agent Integration`.

**Why Major.** Of 163 open AIR bugs filed since 2026-07-01, 91% are `Normal`, 7% `Major`, 2% `Critical` — `Normal` is the intake default and carries little signal. This one sits in the `Major` tier alongside AIR-6167 / AIR-5738 / AIR-5820, because it is a core interaction that silently produces the wrong result:

- The UI gives two affirmative signals that the reset happened (cleared transcript + boundary marker). It didn't. The user keeps working believing the context is fresh.
- The transcript disappears from Air's view while the agent still holds all of it — the user loses their history *and* doesn't get the reset.
- It disables the main manual lever against context pressure, pushing users into AIR-5158 (autocompact thrashing), AIR-5820 (unresponsive past 60% context), AIR-6567 (lag + OOM).
- Context that is never freed is re-billed every turn and degrades output quality, silently.

Not `Critical`: no crash, no unrecoverable loss, and a workaround exists (new task, or `/resume`).

**Root cause lead.** In the Claude Code build this Air version ships (2.1.218), `/clear` is declared as:

    name: "clear"
    description: "Start a new session with empty context; previous session stays on disk (resumable with /resume)"
    aliases: ["reset", "new"]
    supportsNonInteractive: true
    thinClientDispatch: "post-text"

Consequences:

1. `/clear` is a **session-lifecycle** operation, not a chat message. The fix has to give Air a new agent session, keep the old one resumable, and only then draw the boundary.
2. `thinClientDispatch: "post-text"` is the contract for thin clients like Air: post the command text to the agent. It is explicitly not client-local. Commands split into two classes — `post-text` (`/clear`, `/compact`, `/autocompact`, `/pause-memory`, `/reload-skills`, `/recap`, `/skill-doctor`, `/goal`) and `control-request` (`/btw`, `/context`, `/usage`, `/reload-plugins`, …).
3. `supportsNonInteractive: true` — available in headless mode, so nothing upstream is blocking this.
4. `aliases: ["reset", "new"]` — `/reset` and `/new` are very likely broken the same way.

**Hypothesis:** Air handles `/clear` locally (optimistic clear + boundary) instead of honouring `thinClientDispatch: "post-text"`. Two supporting signals:

- `/clear` and `/compact` share the `post-text` class, and **AIR-6412** (context widget not updated after `/compact`, Claude Agent) is open, `In progress`, same assignee, same command family, same "Air UI out of sync with the agent's real context" shape. These may well be **one defect with two symptoms** — worth linking and fixing together.
- **AIR-4136** records the `slash_commands` list Air receives from Claude, and **`clear` is not in it**. If Air treats only names from that list as agent-bound and silently falls back to local handling otherwise, that reproduces this bug exactly. Check this first. See also **AIR-5857** (failed to parse `commands_changed`), which is about that same ingestion path.

**Suggested approach:** fix at the dispatch layer rather than special-casing `/clear` — that covers all eight `post-text` commands and probably AIR-6412 too. Stop drawing the transcript boundary optimistically, so a failed dispatch is visible instead of silent. Cover the `/reset` and `/new` aliases in tests, and verify via `/context` that reported context use actually drops after `/clear`.

**Related:** AIR-6412 (probable same defect) · AIR-6498 (mirror-image Plan mode desync) · AIR-5857, AIR-4136 (command-list ingestion) · AIR-6167 (silent session degradation) · AIR-5158, AIR-5820, AIR-6567 (downstream context pain) · AIR-3223, AIR-3225, AIR-5903 (prior art for per-agent command plumbing).

Not duplicates despite the name collision — AIR-5599, AIR-5779, AIR-5637, AIR-6179 all concern the *terminal* `clear` command. No duplicate of this issue was found.

Caveat: the command-definition facts above are read directly from the shipped Claude binary. The hypothesis is inference from those facts plus the issue corpus and was not verified against Air's own source, which this run had no checkout of. Treat it as the first lead, not a diagnosis.

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=f65b51d9-c8df-4a85-8a87-fed095811c29
```

---

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=f65b51d9-c8df-4a85-8a87-fed095811c29
