<!--
Ready-to-post YouTrack comment for AIR-6780.
Could not be posted automatically: this run has only unauthenticated (guest) read access to
youtrack.jetbrains.com. Paste as-is into https://youtrack.jetbrains.com/issue/AIR-6780
-->

**Triage: keeping Type = Bug, recommending Priority Normal → Major, and adding links to AIR-6671 / AIR-5452 / AIR-5679 / AIR-6404.**

**Why Major.** Calibrated against this subsystem rather than in the abstract: of 37 open *Agent Integration* issues, 31 are Normal and 6 are Major, and the Major bar here is "an agent is unusable, or is silently wrong for every agent" (AIR-6167 transcript freeze, AIR-6228 hang after auth, AIR-5638 Windows `PATH` collision). This report clears that bar on one ground — it is the **generic ACP request-executor path**, and its failure mode is **silent false success**:

- Not agent-specific: the fallback warning appears 9 times across two independent implementations — 7 custom Claude ACP, 2 built-in **codex**.
- "Default to success" maps *unknown outcome* → *Done*. Here the work had actually finished, so the damage stops at stale spinners. **AIR-6671 is the same fallback when the work had not finished** — zero files changed, no plan approved, still `Status=FINISHED`. Same invariant, much worse outcome. This ticket is the one that fixes the invariant.
- Unrecoverable by the user: replay re-creates the tool call as `PENDING`, so the wrong state survives every restart.
- Anything downstream of `TaskLifecycleReports` inherits the false `Done`.

**The counter-argument, so the call is reviewable:** in this report nothing is lost and nothing is blocked. If we scope this ticket narrowly to "stale spinners render after restart", **Normal is right**. Major is the recommendation for the scope actually requested under *Expected behavior* — a reconciliation barrier on the shared executor path. Feel free to set the priority from the scope decision.

**Two separable root causes** (the split in the description is worth keeping as two fixes):

1. `AgentRequestExecutorKt` takes the "no execution result" branch and completes the task **without settling tool calls still open at that moment**. Fix shape: reconcile every non-terminal tool call for the request (`FAILED`/`CANCELLED`/neutral *interrupted*) before completing — or report the task interrupted.
2. Replay re-emits the same `toolCallId` as a fresh `ToolCall(status=PENDING)` that can never receive a terminal `ToolCallUpdate`. Fix shape: distinguish *live* from *reconstructed* tool calls and render the latter as interrupted.

That this is reconciliation and not rendering is well established by the report: a comparable `Terminal` call in the same chat walks `PENDING → IN_PROGRESS → COMPLETED` correctly, and the backing transcript has 87 `tool_use` blocks matched by 87 `tool_result` blocks with zero pending. The agent side finished cleanly.

**Where to start:** `f.a.w.agents.AgentRequestExecutorKt` (the "Will default to success" branch — the barrier belongs here) → `f.a.f.agents.acp.AcpAgentFrontend` (owns the replay path that re-emits `PENDING`; check whether the `toolCallId` map distinguishes live from reconstructed) → `f.a.f.agents.chat.AgentChatWorker` (state feeding the spinner) → `f.a.c.telemetry.TaskLifecycleReports` (where the false `Done` escapes).

**Worth doing before anything else:** the affected version here is **262.132.29, which predates 262.531** — the build that fixed the adjacent session-level ghosting in AIR-5679 and AIR-6404 (confirmed as *Fixed in builds: 262.531*). **Could the reporter retest on ≥ 262.531?** That isolates the genuinely untracked per-tool-call reconciliation gap from the session-level ghosting already shipped, and stops this being closed as a duplicate of completed work.

**On links:** AIR-6671 is the closest sibling — same user-visible symptom from a different trigger (dropped `tool_progress`/`ExitPlanMode` events). Different cause, *same missing invariant*, so a turn-end reconciliation barrier would very likely close both; strong candidate for one shared fix rather than two. AIR-5452 (missing terminal ACP messages) is effectively the parent of the tool-call half.

*Caveat on this triage:* the repository available to this automation was `natojb/expensesapp`, which contains no Air/Fleet source. The code pointers above come from the loggers in the attached logs plus YouTrack cross-referencing, not from reading source — treat them as leads to confirm.

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=afb10b79-617f-4def-ad2c-e74cd9e78d57
