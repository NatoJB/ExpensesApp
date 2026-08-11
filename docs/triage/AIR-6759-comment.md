# Ready-to-paste artifacts for AIR-6759

## A. Field values to apply

| Field | Current | Set to |
|---|---|---|
| Type | `Bug` | `Bug` — no change |
| Priority | `Normal` | `Normal` — no change |
| Subsystem | *(empty)* | `Agent Integration` |
| State | `Submitted` | `Wait for reply` |
| Tags | *(none)* | *(none — AIR uses tags only for platform/regression)* |
| Links | *(none)* | `relates to` AIR-6212, AIR-6297, AIR-4789, AIR-5332, AIR-4870, AIR-4409, AIR-3630 |

> Field state changed during triage (Subsystem `Air Web` and Assignee were set, then cleared ~10:55 UTC on 2026-08-11). Re-check before applying.

---

## B. Comment body — copy everything below this line

Triage notes. **Recommendation: keep `Type: Bug` / `Priority: Normal`, set `Subsystem: Agent Integration`.** The interesting finding isn't the fields, though — it's that the control you're asking for already exists in Air and is switched off by a feature gate, and that a related fix may already have shipped.

**Please check this first: AIR-6212** (*Show native permission options for ACP agents*) is `Ready for test`, **fixed in build `262.175`**. Junie is an ACP agent in Air, so that may already be this ticket's fix. Worth reproducing on `262.175`+ before any development — if it's fixed there, this is a duplicate of AIR-6212.

**Root cause (verified against the shipped `262.132.34` artifacts).** `fleet.frontend.ai.AiChatGlobalSettings` declares a Boolean UI-feature attribute `ShowAutonomySettings`. It has exactly two writers: stock Fleet init (`fleet.ship.desktop.InitAppEntitiesKt`) sets it **`true`**, and the Air product profile (`fleet.ship.desktop.air.AirShipLauncherKt`) sets it **`false`** — one of ~38 `AiChatGlobalSettings` attributes that launcher overrides to define Air's profile. So this is a deliberate gate rather than missing functionality. Whether disabling it was a considered product decision is really the question this ticket should answer.

**The backend is already complete.** `fleet.ai.protocol.agents.junie.JunieMode` = `ASK` / `PLAN` / `FULL_ACCESS`; Brave mode specifically is wired via `JunieApiCommands.setBraveMode` → command `acp/set-brave-mode` → `JunieSetBraveModeApiCommandHandler` → ACP `SetSessionConfigOptionRequest(configId = "brave_mode")` (constant `JunieModesKt.BraveModeConfigId`). A picker's data model exists too, complete with display strings — `AgentModelConfiguration.Agent.PermissionMode(id, name, description, isJcpDefault)` — converted by `AcpSessionConfigOptionsKt.toPermissionModeState()` into an ACP `SessionModeState`, right beside `toModelState()`, which *does* have a shipped picker. And `permission_mode` (`{enum:FullAccess|PlanOnly|AutoEdit|ManualApproval|Unknown}`) is already recorded per prompt in FUS on `userPromptSubmitted`, next to `model` and `thinking_level`. Telling detail: `AiFrontendActionIds` contains `ai/select-model` and `ai/toggle-model-selector`, but a scan of all 549 jars finds **no** `ai/select-permission-mode`.

**So the work is UI exposure, not plumbing:** (1) render the picker in the Air Web client from the `SessionModeState` that's already sent, mirroring the model selector, and add an `ai/select-permission-mode` action id; (2) flip `ShowAutonomySettingsAttr` to `true` for the Air profile in `AirShipLauncherKt` — a one-line change; (3) review the default mode, which is set through `PermissionMode.isJcpDefault` and configured *remotely* via `agent-model-configuration.json` from `plugins.jetbrains.com/fleet-parts` (overridable with the `ai.custom.agent.model.configuration` setting), so likely a data change rather than code.

**Consider handling AIR-6758 (*No explicit reasoning/effort control*) together with this.** Same shape and same gating layer: FUS records `thinking_level` and `permission_mode` side by side per prompt, yet only `model` has a selector. One UI change plausibly closes both.

**On priority.** `Normal` is where every comparable issue in AIR sits — AIR-4789, AIR-5332, AIR-5949, AIR-4409, AIR-4870, AIR-6455, AIR-3733, AIR-6212 are all permission-model gaps at `Normal`, and no UX-gap issue in `Air Web` is above `Normal` (above-`Normal` there is reserved for hard breakage: AIR-5461, AIR-6387, AIR-6380). Across the 1705 anonymously-visible AIR issues, `Normal` is 82%. Keeping `Bug` rather than re-typing to `Feature` because the capability exists and is gated off, and because the nearest precedent — AIR-6212 — is also a `Bug`.

**One thing that would change that call:** if interactive Air Web sessions launch in a full-access/bypass mode with no visible indicator, this becomes "the user can't see or control what the agent may do", which is the bar AIR-4794 and AIR-6458 were both set at as `Major`. I couldn't verify the interactive default — the Air Web client isn't present in the environment I could inspect, and the one session I *could* observe was an unattended automation, where `bypassPermissions` is the correct default and says nothing about interactive use. Worth a one-step check.

**Also relevant:** AIR-6297 (`Verified`) records the mapping in Air's own words — *"Junie doesn't have traditional permission modes anymore. Instead, there is a boolean config option `brave_mode` which corresponds to `full-access` permission mode"* — and it was specifically about the web path. AIR-3889 / AIR-4119 / AIR-6435 confirm a permission-mode widget already ships somewhere in Air, supporting "not surfaced in this surface" over "doesn't exist". No duplicate of this ticket exists (`summary: brave` in AIR returns only this issue). In project JUNIE, JUNIE-2833 (*hide Brave Mode switch from the UI*) is worth reading before designing the control.

No tags recommended: AIR uses tags only for platform/regression (6 tags, 9.9% of issues), so there's no triage convention to apply here.

*Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=f374e7ba-0870-447f-80db-f8077e6f9613*
