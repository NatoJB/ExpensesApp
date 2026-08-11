Paste-ready YouTrack comment for https://youtrack.jetbrains.com/issue/AIR-6761

Apply alongside these field changes:
  Priority: Normal -> Major
  Type:     Bug (unchanged)
  Links:    Relates -> AIR-6762, AIR-6759, AIR-6234, AIR-5715

--------------------------------- 8< ---------------------------------

**Triage: Priority `Normal` → `Major`, Type stays `Bug`.**

**Priority.** Of the 490 AIR issues created since 2026-07-01, 84% are `Normal` — it's the default and
carries little signal. `Major` is the band AIR actually uses for broken control paths: AIR-5715
("stop button does not work"), AIR-5700 (Ctrl-C in Terminal), AIR-4015. This issue qualifies because
it is 100% reproducible on the primary entry point (every Junie session starts with a first prompt),
has no workaround (you must let the turn finish), and is a safety property rather than a convenience
one — Junie edits files and runs commands, so losing the brake means a wrong-direction first turn
can't be halted. It also compounds with AIR-6759: no Brave/Safe guardrail *before* the turn and no
brake *during* it. Not `Critical` — nothing crashes and no data is lost; AIR reserves that for
AIR-6380 / AIR-5583 class blockers.

**Type.** Keeping `Bug`. The dominant element — can't interrupt a running agent — is missing
functionality that exists in the desktop client (AIR-3301, AIR-5715), so it's a parity defect, not a
`Feature` and not merely a `Usability Problem`.

⚠️ **Scope note:** this report bundles three different kinds of thing. stop/cancel is a bug;
follow-up-while-running is a bug in presentation (queueing happens but is invisible — AIR-6762);
but **editing an already-sent prompt has never existed anywhere in Air** and is tracked as a
`Feature` in AIR-6234. Suggest keeping this issue scoped to stop/cancel/follow-up and moving the
edit request to AIR-6234, otherwise this can't be closed.

**This is one of eight.** AIR-6757…AIR-6764 were all filed today by the same reporter as a
Junie-in-Air-Web parity audit against Junie in AIA/CLI. **AIR-6761 + AIR-6762 + AIR-6764 look like
one root cause** and are likely cheaper to fix together. A Meta Issue over the batch would make the
parity story visible to planning.

**Root-cause hypothesis (unverified — no codebase access in this run):** the first prompt is
submitted before an agent session exists, so the chat has no session to attach stop/edit/follow-up
controls to. AIR-6762 describes exactly this from the user side — "the prompt disappears into a queue
and the user sees a blank input again." A queued-but-not-yet-live message would explain all four
missing affordances at once, and explains AIR-6764 as the same input-state ownership problem.
Second, independent signal: AIR-6634 notes verbatim that *"Junie is the only agent not calling
`session/load` ever"* — if the Junie ACP adapter skips parts of the session lifecycle the other
agents implement, the cancel path is a strong candidate for the same gap. Worth checking whether
Air Web gates the Stop button on a capability the Junie adapter never advertises.

**Fastest way to narrow it:** reproduce in Air Web with Junie vs. Claude Code on the *first* prompt.
Stop present for Claude Code but not Junie → adapter capability negotiation. Missing for both → the
Air Web chat component's queued-message state. Then check whether the desktop client has the same
defect on the first prompt; if not, diff the two chat inputs rather than hunting in the agent layer.

**Related:** same suspected root cause — AIR-6762, AIR-6764. Same risk surface — AIR-6759.
Prior art on the missing affordances — AIR-6234 (edit last prompt, `Feature`/`Duplicate`), AIR-4715
(queueing + steering), AIR-5146. Interrupt-path history — AIR-5715 (`Major`, *Ready for test*),
AIR-6128, AIR-3301, AIR-5583. Junie/ACP gaps with the same likely owner — AIR-6634, AIR-6600,
AIR-6631, and AIR-6646 for the aggregate sentiment.

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=ed326b30-dbb9-4eb4-ba15-315424ef25dd

--------------------------------- >8 ---------------------------------
