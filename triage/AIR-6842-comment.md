<!--
Ready-to-paste YouTrack comment for AIR-6842.
Could not be posted automatically: this automation run had only anonymous (guest) read access to
youtrack.jetbrains.com; POST /api/issues/AIR-6842/comments returns HTTP 403.
Paste the body below (everything after the marker line) as a single comment.
Field + link changes to apply alongside it are listed at the top of ./AIR-6842.md.
-->

--- 8< --- comment body starts here --- 8< ---

**Triage: Priority `Normal` (keep) · Type `Feature` (keep) · Subsystem `UX` → `Agent Integration` (change)**

**Priority.** Keeping `Normal`, but ranking it at the top of that bucket. Calibrating against the tracker: of 645 open AIR issues, 89% are `Normal` and only ~9% are `Major`/`Critical` — and that top band is reserved for crashes, hard locks and data loss (AIR-6532 breaks the app entirely; AIR-5570, also in this flow, deletes the parent task). Here the diff and selected changes survive and the review is re-runnable, so the loss is a wasted run and lost review context rather than lost work. Decisively, the two closest siblings are strictly worse failures and both sit at `Normal`: AIR-6413 (credits exhausted → Codex session *crashed*) and AIR-3928 (quota exhausted with *no indication at all*, spinners spinning forever). Rating this above a silent hang and a crash would be inconsistent. What does argue for urgency within `Normal`: it is customer-reported, it is on the BYO-subscription path, and `Retry` being the only offered action is actively misleading since it is guaranteed to hit the same limit.

Please **escalate to `Major`** if any of these turns out to be true — I could not confirm them from the description: the limit failure also destroys or orphans the review task (cf. AIR-5570), uncommitted changes are lost, or this reproduces on the JetBrains AI subscription rather than only BYO Codex/ChatGPT.

**Type.** `Feature` is right, though it is close to `Usability Problem`. Nothing malfunctions — the limit error is detected and reported accurately; all three requested recovery paths are capability that does not exist yet, and options 2 and 3 need new state handling (persisting review context across an agent restart, plus a resume scheduler). The counter-argument is real, though: a `Retry` that cannot succeed is a designed-in dead end, which is exactly how AIR-3928 was classified. Suggestion — keep `Feature` for the umbrella, and split out "don't offer a `Retry` that cannot succeed; show the reset time and a switch action instead" as a small `Usability Problem` subtask. That is independently shippable and it is the part the customer actually hit.

**Subsystem.** Moving from `UX` to `Agent Integration`. There is a UI surface, but the substance is agent/session lifecycle: classifying a provider usage-limit error as recoverable rather than terminal, swapping model/credentials mid-flight, and preserving ACP session context across a restart. That matches where the enabling mechanism and the neighbouring failure class already live (AIR-6168, AIR-6228, AIR-6167, AIR-6780). `Licensing` will need to help enumerate "other available subscriptions", and `UX` owns the replacement affordance.

---

**Notes for whoever picks this up**

**Start with AIR-6168 — it is very likely most of the answer.** It is already fixed (`Ready for test`) and it established that mid-session model switching must go through `session/set_config_option` with config id `model`, not the non-spec `session/set_model` that agents reject with `-32601`. Its description calls out this exact trap: *"If that model has hit a rate/usage limit, the conversation is trapped ('session limit reached') with no way to switch out."* AIR-6168 solved that for general chat; AIR-6842 is the same trap in the Review with Agent flow. **The first question to answer is whether the review flow can reach that code path at all** — if it can, recovery option 2 may be nearly free. I'd suggest promoting the existing `Relates` link to `Depends on`.

**Related issues worth linking:** AIR-6413 (same trigger, worse outcome — credit exhaustion crashed a Codex session with a raw provider `477`; it also has an attached log bundle that probably shows how the limit error propagates) and AIR-6155 (`Major` — "quota exhausted" banner shown when BYOK is used).

**AIR-6155 is a sequencing risk for automatic fallback.** Read together with AIR-6413 and AIR-5355, the pattern is that Air's accounting of *which* subscription is paying and how much is left is unreliable on BYO setups. Recovery option 1 ("continue on another available subscription") is only safe if that enumeration is trustworthy — otherwise auto-fallback may switch away from a subscription that was never exhausted. Either fix AIR-6155 first or gate fallback behind explicit user confirmation.

**Likely root cause — hypothesis, not verified** (I had no access to the Air source in this run): the ACP layer probably maps a provider usage-limit response onto a *terminal* run failure instead of a typed recoverable condition. The evidence is that the reported text is the raw provider string ("You've hit your usage limit. Upgrade to Pro…") passed through verbatim and then followed by the generic "Agent execution finished with an error" — i.e. no classification step; the same signature shows up in AIR-6413. Once an error is terminal, `Retry` is the only affordance the UI can generically offer, which explains the symptom exactly. If that holds, the work splits into (1) classify usage-limit/rate-limit/quota errors as a distinct recoverable type carrying the provider's reset time, (2) hold review context (diff, selected changes, prompt) independently of the agent run so it can be re-driven against another agent, (3) offer switch / fallback / wait-and-resume in place of bare `Retry`, reusing the AIR-6168 path for the switch. Step 1 is shared with AIR-6413 and AIR-3928 and is where I'd start.

**Code landmarks** (from tracker references, not verified in source): `AcpAgentFrontend` is named in AIR-6167 as where an unhandled ACP agent event throws and freezes the transcript — the right neighbourhood for ACP error handling. Also grep for the `session/set_config_option` call added by AIR-6168 and for the string "Agent execution finished with an error".

**Cheapest useful increment:** keep the run failed, but replace bare `Retry` with the parsed reset time plus a "switch model and re-run this review" action that carries review context over. No scheduler, no auto-fallback, no dependency on AIR-6155 — and it removes the guaranteed-to-fail button.

---
*Produced by Air Automation. Name: Issue Triage / Run: [925097cd](https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=925097cd-b6ee-45c5-aa7f-4171abd0ab78)*
