# Triage — AIR-6815 "Update junie models"

| | |
|---|---|
| Issue | [AIR-6815](https://youtrack.jetbrains.com/issue/AIR-6815) |
| Reported by | Valerii Tepliakov, 2026-08-14 |
| Description (verbatim) | `* Grok 4.6` / `* Gemini 3.7 Flash` |
| Triaged | 2026-08-14 by Air Automation "Issue Triage" |

---

## ⚠️ The labels and the comment were NOT applied to YouTrack

The automation was asked to label the issue and post a comment. It could do neither. This run reaches
YouTrack **anonymously, as `guest`** — enough to read most of the `AIR` project, not enough to write.
Verified rather than assumed:

| Check | Result |
|---|---|
| `GET /api/users/me` | `{"login":"guest"}` — anonymous |
| YouTrack MCP server | none — provisioning config is `[{"id":"claude","protocol":"jetbrains","models":[]}]` |
| `yt` CLI | not installed |
| YouTrack token in env / config | none found |
| `FLEET_WORKSPACE_AI_ACCESS_TOKEN` → YouTrack | **401** invalid token |
| `AGENT_SPAWNER_SIDECAR_TOKEN` → YouTrack | **401** invalid token |
| `FLEET_WORKSPACE_ADDITIONAL_TOKENS` → YouTrack | **401** invalid token |
| `POST /api/issues/AIR-6815/comments` | **404** not accessible |
| `POST /api/commands` (set Priority) | **403** "No accessible issues provided" |

The three workspace tokens are JetBrains AI-platform credentials with a different audience.
**To let this automation apply triage directly, attach a YouTrack MCP server (or a permanent token) with
comment + issue-update rights on `AIR`.** Until then the ready-to-paste comment is at the bottom of this file.

One further limit worth stating plainly: **AIR-6815 itself is not readable by `guest`** — nor is anything
above AIR-6809. So the issue's *current* field values could not be observed, and the recommendations below
are stated as target values rather than as diffs. Everything about AIR-6815 in this report comes from the
webhook payload; everything about other issues is read live from YouTrack.

---

## Recommendation

| Field | Recommended |
|---|---|
| **Type** | **`Task`** |
| **Priority** | **`Major`** |
| **Subsystem** | **`Agent Integration`** |
| Links | `Relates to` [AIR-6122](https://youtrack.jetbrains.com/issue/AIR-6122), [AIR-6757](https://youtrack.jetbrains.com/issue/AIR-6757); `Duplicates`-style follow-on of [AIR-6308](https://youtrack.jetbrains.com/issue/AIR-6308) |

### Type → `Task`

Unanimous in the precedent set. Every "add/refresh a model in the list" issue in `AIR` is typed `Task`,
never `Feature`:

| Issue | Summary | Type |
|---|---|---|
| [AIR-6444](https://youtrack.jetbrains.com/issue/AIR-6444) | Add support for Gemini 3.6 Flash | `Task` |
| [AIR-6308](https://youtrack.jetbrains.com/issue/AIR-6308) | Sync Junie agent model list in Air `agent-model-configuration.json` | `Task` |
| [AIR-5247](https://youtrack.jetbrains.com/issue/AIR-5247) | Gemini 3.1 Flash Lite | `Task` |
| [AIR-4121](https://youtrack.jetbrains.com/issue/AIR-4121) | Add GPT-5.4 model and set as default | `Task` |

`Feature` is reserved in this project for a genuinely new capability — [AIR-6122](https://youtrack.jetbrains.com/issue/AIR-6122)
*Support xAI Grok*, [AIR-5256](https://youtrack.jetbrains.com/issue/AIR-5256) *Connecting Local Model providers*.
Extending an existing config-driven list is not that. **Caveat:** if the Grok half turns out to need a new
provider integration rather than a config entry (see *Risk* below), that part is a `Feature` and belongs in
AIR-6122, not here.

### Priority → `Major`

**Calibration** (counts read live from YouTrack on 2026-08-14; the project is active, so they drift by a
few). `Normal` is the intake default in `AIR` and carries almost no signal — of **776** issues created
2026-06-01 → 2026-08-14: **660 `Normal` (85%), 83 `Major` (11%), 30 `Critical` (4%)**. Narrowing to `Task`:
**52 `Normal` / 15 `Major` / 0 `Critical`** (n=67). So `Major` is a real, used tier for tasks — roughly the
top quarter — not an escalation.

What `Major` actually means for a `Task` here, from the 15 in that window: committed, scheduled delivery —
the `Compose:` migration epic (AIR-6084/6085/6086/6101–6104/6111), AIR-5846 *AI Quota widget*, AIR-5575
*Share Task*, AIR-6583 *env var interpolation in .mcp.json*. And one model issue.

That one is decisive: **[AIR-6444](https://youtrack.jetbrains.com/issue/AIR-6444) "Add support for Gemini 3.6 Flash" — `Task` / `Major` / Verified**, filed 2026-07-21. AIR-6815 asks for **Gemini 3.7 Flash**: the direct successor of that exact model line, 3½ weeks later. Triaging the successor lower than its predecessor would be an inconsistency, absent a reason — and there isn't one; if anything the case is stronger now.

Three supporting arguments:

1. **Live user-visible pain.** [AIR-6757](https://youtrack.jetbrains.com/issue/AIR-6757) *"[Junie] Smaller list of available models compared to Junie"* (`Usability Problem`, open, *Wait for reply*) is users complaining that Air's model list already lags Junie's. This issue is a direct remedy, and every week it waits the gap widens.
2. **It decays.** Both models shipped within 48 hours of the report (Grok 4.6 on 2026-08-12, Gemini 3.7 Flash on 2026-08-13). Gemini's Flash cadence is ~3 weeks (3.6 → 3.7). A model-currency task that sits in the backlog isn't deferred, it's obsoleted — and per press reports Grok 4.7 is expected within weeks.
3. **Cheap.** For the Gemini half this is a JSON entry plus a jbai mapping on a well-trodden path (AIR-6308). High value, low cost — exactly what should be scheduled rather than parked.

**The honest counter-argument**, so whoever reviews this can overrule on the evidence: the *majority* of
model-add tasks were `Normal` — AIR-5247, AIR-6308, AIR-4121. If AIR-6444's `Major` was incidental rather
than deliberate, `Normal` is defensible and this is a one-tier disagreement, not a serious one. It should
not be `Critical`: nothing is broken, no user is blocked, and every existing model keeps working.

### Subsystem → `Agent Integration`

The value used by the neighbouring config-file issues: [AIR-6302](https://youtrack.jetbrains.com/issue/AIR-6302)
(`thinkingLevels` in `agent-model-configuration.json`), [AIR-4121](https://youtrack.jetbrains.com/issue/AIR-4121),
[AIR-6200](https://youtrack.jetbrains.com/issue/AIR-6200), [AIR-6168](https://youtrack.jetbrains.com/issue/AIR-6168),
[AIR-5394](https://youtrack.jetbrains.com/issue/AIR-5394). AIR-6308 was left empty — that looks like an oversight
rather than a precedent.

---

## For whoever picks this up

### The file

From [AIR-6308](https://youtrack.jetbrains.com/issue/AIR-6308)'s own resolution notes — the last time this
exact job was done, 2026-07-14:

> Synced the Junie agent's model list in Air (Fleet AI plugin) with Junie's authoritative source of truth, the
> `ModelOption.Specific` enum in the junie-agent repo.
> - File changed: `fleet/plugins/ai/resources/common/agent-model-configuration.json` (the `"id": "junie"` agent block only).
> - Added 9 previously-missing models + their jbai mappings […] Junie now exposes 20 models. Default stays Claude Opus 4.8.
> - Verified: `fleet.ai.test.AgentModelConfigurationTest` passes.

So the loop is:

1. **`ModelOption.Specific` in `junie-agent` is the source of truth** — check it first. If Junie hasn't added
   the model, Air can't expose it, and this issue is blocked on Junie rather than on Air.
2. Edit the `"id": "junie"` block in `fleet/plugins/ai/resources/common/agent-model-configuration.json`.
3. Each entry needs a **jbai mapping** — the JetBrains AI gateway must actually route the model. This is the
   step that turns "config one-liner" into "cross-team dependency"; confirm it before estimating.
4. Consider `thinkingLevels` — Grok 4.6 adds a **new `xhigh` reasoning effort** on top of low/medium/high.
   Air's handling of effort levels is live work in [AIR-6200](https://youtrack.jetbrains.com/issue/AIR-6200)
   and [AIR-6302](https://youtrack.jetbrains.com/issue/AIR-6302); a value Air doesn't know about is a
   plausible failure mode. See also [AIR-6758](https://youtrack.jetbrains.com/issue/AIR-6758).
5. Run `fleet.ai.test.AgentModelConfigurationTest`.
6. Leave the default alone. AIR-6308 kept Claude Opus 4.8 as default; nothing in AIR-6815 asks to change it.
   Contrast AIR-4121, where "and set as default" was stated explicitly.

### Risk: the two halves are not equal

**Gemini 3.7 Flash — low risk.** Air already ships Gemini/Antigravity
([AIR-5993](https://youtrack.jetbrains.com/issue/AIR-5993)), and 3.6 Flash landed three weeks ago via
[AIR-6444](https://youtrack.jetbrains.com/issue/AIR-6444). Same path, one version bump.

**Grok 4.6 — needs a decision before it can be estimated.**
[AIR-6122](https://youtrack.jetbrains.com/issue/AIR-6122) *"Support xAI Grok"* is **`Feature` / `Normal` /
Submitted — still open**. Air has no xAI provider integration. Two different readings, and they cost very
different amounts:

- *If* Junie exposes Grok 4.6 through the **jbai gateway**, this is a config entry like any other and
  AIR-6122 (direct xAI provider support) is a separate concern.
- *If* it does not, "add Grok 4.6 to Junie's list" is not achievable here and the Grok bullet belongs in
  AIR-6122.

**Check `ModelOption.Specific` for a Grok entry first.** The 9 models AIR-6308 added were all Claude/GPT —
no Grok, no Gemini — which is weak evidence for the second reading, but it is only weak evidence: that list
was "previously-missing", not exhaustive. If the second reading holds, **split the issue**: ship Gemini 3.7
Flash under AIR-6815 and move Grok 4.6 to AIR-6122, so the cheap half isn't held hostage by the expensive one.

### Model facts, verified against vendor announcements

| | Grok 4.6 | Gemini 3.7 Flash |
|---|---|---|
| Vendor | xAI / SpaceXAI | Google |
| Released | 2026-08-12 | 2026-08-13 |
| API id | `grok-4.6` | see Google model card |
| Context | 500K | 1M (64K output) |
| Reasoning effort | low / medium / high / **xhigh** *(new)* | — |
| Knowledge cutoff | 2026-02-01 | 2026-03 |
| Notes | post-training upgrade over 4.5, tuned for long-running agents | refinement of 3.6 Flash, coding/agents focus |

Sources: [x.ai/news/grok-4-6](https://x.ai/news/grok-4-6),
[blog.google — Introducing Gemini 3.7 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/).

### Related issues

| Issue | Why it matters |
|---|---|
| [AIR-6308](https://youtrack.jetbrains.com/issue/AIR-6308) | The playbook. Same job, done 2026-07-14. Read this first. |
| [AIR-6444](https://youtrack.jetbrains.com/issue/AIR-6444) | Gemini 3.6 Flash — the direct predecessor; sets the `Major` precedent. |
| [AIR-6122](https://youtrack.jetbrains.com/issue/AIR-6122) | **Open.** xAI Grok support — potential blocker for the Grok half. |
| [AIR-6757](https://youtrack.jetbrains.com/issue/AIR-6757) | **Open.** Users report Air's model list lags Junie's — the pain this fixes. |
| [AIR-6302](https://youtrack.jetbrains.com/issue/AIR-6302) | **Open.** `thinkingLevels` in the same config file — touches the same block. |
| [AIR-6200](https://youtrack.jetbrains.com/issue/AIR-6200) | **Open.** Model variants / effort levels — relevant to Grok's `xhigh`. |
| [AIR-5247](https://youtrack.jetbrains.com/issue/AIR-5247) | Gemini 3.1 Flash Lite — the `Normal` counter-precedent. |

---

## Why this is a file in an unrelated repo

This automation's checkout is `NatoJB/ExpensesApp`, a React + Vite expense tracker with no relation to the
Air product. It was searched anyway: `src/` contains zero occurrences of `grok`, `gemini`, `model`, or
`junie`. The only hits are three GitHub workflows that *invoke* `JetBrains/junie-github-action` with a
`JUNIE_API_KEY`; none of them configures a model, so none is affected by AIR-6815. `JetBrains/junie-agent`
and `JetBrains/fleet` are not accessible from this run, so the file-level evidence above comes from
AIR-6308's YouTrack record rather than from source.

---

## Ready-to-paste YouTrack comment

> **Automated triage** — Type `Task`, Priority `Major`, Subsystem `Agent Integration`.
>
> **Type:** every model-add issue in AIR is a `Task` — AIR-6444, AIR-6308, AIR-5247, AIR-4121. `Feature` is
> reserved for new capabilities (AIR-6122).
>
> **Priority:** `Normal` is the intake default and carries little signal (85% of the 776 AIR issues filed
> since 2026-06-01; 52 of 67 Tasks). The decisive precedent is **AIR-6444 "Add support for Gemini 3.6 Flash" —
> `Task`/`Major`**, filed 3½ weeks ago for the direct predecessor of one of the two models requested here.
> Supporting: AIR-6757 (open) shows users already report Air's model list lagging Junie's; both models shipped
> within 48h of this report and Gemini's Flash cadence is ~3 weeks, so this work decays rather than defers.
> Not `Critical` — nothing is broken and existing models keep working.
>
> **Implementation** — AIR-6308 is the playbook for exactly this job (2026-07-14): source of truth is the
> `ModelOption.Specific` enum in `junie-agent`; the change is the `"id": "junie"` block of
> `fleet/plugins/ai/resources/common/agent-model-configuration.json`, plus a jbai mapping per model; verify with
> `fleet.ai.test.AgentModelConfigurationTest`. Leave the default (Claude Opus 4.8) alone — this issue doesn't ask
> to change it.
>
> **⚠️ The two bullets are not equally cheap.** Gemini 3.7 Flash follows AIR-6444's path exactly — low risk.
> Grok 4.6 may not: **AIR-6122 "Support xAI Grok" is still open**, and Air has no xAI provider integration. If
> Junie exposes Grok 4.6 via the jbai gateway this is a normal config entry; if it doesn't, the Grok bullet
> belongs in AIR-6122. **Please check `ModelOption.Specific` for a Grok entry before estimating** — and if it's
> absent, consider splitting so Gemini 3.7 Flash can ship without waiting on xAI provider work.
>
> Also worth a look: Grok 4.6 introduces a new `xhigh` reasoning effort beyond low/medium/high — see AIR-6200
> and AIR-6302 on `thinkingLevels`.
>
> Suggested links: `Relates to` AIR-6122, AIR-6757, AIR-6308, AIR-6444.

---

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=8980faa8-6032-49c8-a807-8bc2d1b162bd
