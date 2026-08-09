# Triage: AIR-6728 — Air auto-executes project-local `gradlew` on project open (RCE)

> **Delivery note:** this triage could not be applied directly to YouTrack — no YouTrack
> write access was available in this run (see "Delivery limitation" at the bottom). The
> assessment below is complete and the comment in §7 is ready to paste into AIR-6728.

| Field | Recommendation |
|---|---|
| **Type** | `Bug` (use `Security Problem` if that type is enabled for AIR) |
| **Priority** | `Critical` |
| **Severity** | High — CVSS 3.1 base **7.8–8.4** |
| **Subsystem** | `Language Support` (alternative: `Platform`) |
| **Tags** | `security`, `rce`, `external-report`, `project-trust`, `needs-visibility-review` |
| **Verified** | Yes — claim reproduced statically against shipped Air `262.132.34` bytecode |

---

## 1. What the report claims

Opening any project containing a `*.gradle` / `*.gradle.kts` file causes Air's Gradle
project configurator to execute the project-local `./gradlew --version`. Because `gradlew`
is an ordinary shell script shipped inside the project, an attacker who can get a victim to
open a directory (cloned repo, shared archive, phishing link) achieves arbitrary code
execution as the victim user. Reporter measured CVSS 8.4 High.

## 2. Independent verification

This run had an Air `262.132.34` installation available — **the exact build named in the
report** — so the claim was checked against the shipped artifact rather than taken on trust.
All of the following was confirmed by disassembling
`fleet.plugins.gradle.workspace.jar` (50,805 bytes):

- `fleet.gradle.workspace.GradleProjectConfigurator` **implements
  `fleet.plugins.smartMode.workspace.api.ProjectConfigurator`** — i.e. it is driven by the
  automatic *smart mode* background pipeline, not by a user-initiated build action.
- Constructor sets `projectFilePatterns = listOfNotNull(Pattern("*.gradle"), Pattern("*.gradle.kts"))`
  — matches the report exactly.
- `GradleProjectConfiguratorKt$getGradleVersion$2` holds the string constants
  `gradlew`, `gradlew.bat`, `--version`, `JAVA_HOME`, and calls:
  - `fleet.api.PlatformKt.isWindows(Os)` → selects `gradlew` vs `gradlew.bat`
  - `fleet.api.ProtocolPath.child(String[])` → builds `<projectRoot>/gradlew`
  - `fleet.topology.Host.getExec()` → `fleet.api.exec.ProcessKt.process(ExecApi, String, String[], Function1)`
- The version is recovered by regex-matching the child process's **stdout**
  (`((\d+)(\.\d+)+)(-(\p{Alpha}+)-(\w+))?(-(SNAPSHOT|\d{14}([-+]\d{4})?))?`), falling back to
  `IllegalStateException("Could not determine gradle version")`.

**The report's technical description is accurate.** Two additional findings that the report
does *not* mention are, in my view, more important than anything in it — see §4.

## 3. Why `Critical`

Calibrated against a 300-issue sample of project AIR:

- **Priority distribution:** `Normal` 230, `Major` 55, `Critical` 15, `Show-stopper` 0.
  `Critical` is the top ~5% band in actual use.
- **Comparable Criticals:** AIR-6532 (*MCP servers break the program completely*),
  AIR-5901 (*Claude output missing*), AIR-5380 (*Junie "Full Access" mode not working*).
  These are functional breakages with no security consequence.

Unconsented code execution as the user, triggered by the single most common action in an
IDE, is a strictly worse user outcome than any of those. It sits above the `Major` band.

Not `Show-stopper`: it needs user interaction (opening attacker-supplied content), the
attack vector is local, there is no privilege escalation beyond the user's own account, and
`Show-stopper` appears to be reserved for release blockers in this project (0 uses in the
sample).

**On the CVSS number:** the reporter's `8.4` depends on `S:C` (scope change). With `S:U` —
which is what JetBrains advisories typically use for IDE-executes-project-content — the same
vector yields **7.8**. Either way the rating is High; the disagreement is not worth arguing.

**Type:** `Security Problem` and `Vulnerability Problem` both exist in the shared Types
bundle but have **never been used in project AIR** (0 of 300). Ordinary AIR practice is
`Bug`, so `Bug` + a `security` tag is the least surprising choice unless the team wants to
start using the security types.

## 4. Root cause — and why the reporter's suggested fix is the wrong one

The reporter recommends "add a one-time user confirmation before executing `gradlew`". That
treats the symptom. Two things found during verification point somewhere better:

### 4.1 Air already has a trust gate. This code path just doesn't consult it.

Air ships a workspace-trust mechanism:

- `fleet.workspace.jar`, `fleet.ship.desktop.jar` → `TrustWorkspace`, `TrustWorkspaceOptions`, `TrustWorkspaceValue`
- `fleet.frontend.ui.jar` → `TrustDialog`, `TrustPopup`, `TrustStatus`, `"Safe Mode"`
- `fleet.frontend.jar` → `TrustCodeDialog`, `TrustDialogOpen`
- `fleet.plugins.ai.workspace.jar` → references trust (the agent path *does* honour it)

Whereas **`fleet.plugins.gradle.workspace.jar`, `fleet.plugins.smartMode.workspace.jar` and
`fleet.plugins.smartMode.common.jar` contain no reference to trust, consent, or safe mode at
all.** The configurator framework (`ProjectConfiguratorKt.configureProjects`) runs
configurators without ever asking.

So this is not a missing feature — it is an **existing security control that one subsystem
bypasses**. Air tells users "Agents can't run in untrusted folders" (AIR-6570) while a
different subsystem in the same process executes project-supplied scripts unconditionally.
The fix belongs at the framework level: gate `configureProjects` on `TrustWorkspace` state,
which fixes every configurator at once instead of bolting a bespoke dialog onto Gradle.

### 4.2 The Gradle version does not require executing anything

The plugin contains **no reference to `gradle-wrapper.properties` or `distributionUrl`** —
executing the script is currently the *only* way it learns the version. But for essentially
every wrapper-based project the version is already sitting in
`gradle/wrapper/gradle-wrapper.properties` as a declarative `distributionUrl`. Parsing that
file removes the execution primitive entirely for the common case, with no UX cost and no
dialog to train users to click through. Execution should be the trust-gated fallback, not
the default probe.

## 5. Two aggravating details the report misses

1. **It is not only "on open".** `GradleProjectConfigurator.watchProjectDirectories(...)`
   returns a `Flow<Set<FileAddress>>` — a continuous watch. Matching files appearing *later*
   (a `git pull`, a branch switch, a new worktree) can re-trigger configuration. A
   confirmation shown only during the initial open flow would therefore be insufficient.
2. **Windows is easier to exploit, not harder.** The macOS PoC needs the executable bit on
   `gradlew`. On Windows the code selects `gradlew.bat`, which needs no exec bit at all — so
   the precondition is weaker there than the report's single-platform PoC suggests.

Also worth recording: blast radius depends on where the workspace runs. A local project open
executes on the developer's machine (SSH keys, cloud credentials, source). A
Docker/remote-workspace open executes in the container, which is materially less severe.

## 6. The one question that decides the priority

**Does the `gradlew` exec happen before, or only after, the user accepts the Trust Folder dialog?**

Static analysis cannot answer this — the trust dialog lives in the frontend, the configurator
in the workspace backend, and the ordering between them is a runtime property. The reporter
states there was "no additional interaction during the open flow", but their PoC write-up does
not explicitly address the trust prompt.

- **Executes before / regardless of trust** → genuine bypass of an advertised security
  control. `Critical` stands.
- **Executes only after trust is granted** → downgrade to `Major` and reframe as hardening:
  granting trust to browse a repo should still not imply consent to run its build scripts
  during passive indexing.

I have assigned `Critical` because the report is credible, the static evidence corroborates
it, and even the second branch is a real defect. QA should settle this first.

## 7. Ready-to-paste YouTrack comment

```
Triaged: Type=Bug (security), Priority=Critical, Severity=High (CVSS 7.8-8.4), Subsystem=Language Support.

I verified the report against the shipped Air 262.132.34 artifact rather than taking it at
face value, and the technical description is accurate. In fleet.plugins.gradle.workspace.jar:
GradleProjectConfigurator implements fleet.plugins.smartMode.workspace.api.ProjectConfigurator
(so it runs from the automatic smart-mode pipeline, not a user build action); its
projectFilePatterns are exactly ["*.gradle", "*.gradle.kts"]; and
GradleProjectConfiguratorKt$getGradleVersion$2 selects gradlew/gradlew.bat via
PlatformKt.isWindows, builds <projectRoot>/gradlew via ProtocolPath.child, and runs it through
Host.getExec() -> ProcessKt.process with args ["--version"], parsing the version out of the
child process stdout by regex.

Two things matter more than what the report says:

1. We already have a trust gate and this path does not consult it. TrustWorkspace /
   TrustWorkspaceOptions / TrustWorkspaceValue live in fleet.workspace.jar and
   fleet.ship.desktop.jar; TrustDialog / TrustPopup / TrustStatus / "Safe Mode" in
   fleet.frontend.ui.jar; fleet.plugins.ai.workspace.jar honours trust for the agent path.
   But fleet.plugins.gradle.workspace.jar, fleet.plugins.smartMode.workspace.jar and
   fleet.plugins.smartMode.common.jar contain no trust/consent/safe-mode reference at all.
   So this is an existing security control being bypassed by one subsystem, not a missing
   feature - we say "Agents can't run in untrusted folders" (AIR-6570) while another
   subsystem in the same process executes project-supplied scripts unconditionally. The fix
   belongs in ProjectConfiguratorKt.configureProjects, gated on workspace trust, which
   covers every configurator at once.

2. We do not need to execute anything to get the version. The plugin has no reference to
   gradle-wrapper.properties or distributionUrl - running the script is currently the only
   way it learns the version. Parsing gradle/wrapper/gradle-wrapper.properties removes the
   execution primitive for virtually all wrapper projects, with no dialog for users to click
   through. Keep execution as a trust-gated fallback.

Two aggravating details the report omits:
- watchProjectDirectories() returns a Flow, so this is not strictly "on open" - matching
  files appearing later (git pull, branch switch, new worktree) can re-trigger it. A
  confirmation shown only during the initial open flow would not be enough.
- Windows is easier, not harder: gradlew.bat needs no executable bit, so the precondition is
  weaker than the macOS-only PoC suggests.

Blast radius depends on where the workspace runs: a local open executes on the developer's
machine (SSH keys, cloud credentials, source); a Docker/remote workspace open executes in the
container and is materially less severe.

Please settle this question first, it decides the priority: does the gradlew exec happen
before, or only after, the Trust Folder dialog is accepted? Static analysis can't tell -
the dialog is frontend, the configurator is workspace backend. If it runs before/regardless,
Critical stands as a bypass of an advertised control. If it only runs after trust is granted,
downgrade to Major and treat it as hardening (trusting a repo enough to read it should not
imply consent to run its build scripts during passive indexing).

Related open issues in the trust area, worth reading together with this one: AIR-6709
(improve trust dialog logic), AIR-6676 (trust dialogue on new worktree/docker task), AIR-6570
(untrusted-folder banner), and AIR-5589 (execution prompts are too vague - relevant if we do
add a consent prompt here).

Two process notes. First, the reporter says this is independent of an
eslint/prettier/stylelint auto-execution chain on project open - that implies a sibling report
exists. I could not see it or any other issue from this reporter, consistent with security
reports being visibility-restricted, so someone with access should link the two and consider
a meta-issue: the real defect class is "any ProjectConfigurator that calls ProcessKt.process
on a project-relative path", and Gradle is one instance. Second, AIR-6728 is not readable
anonymously even though project AIR is, so restricted visibility appears to be in place
already - please keep it that way, the description is a working exploit recipe. This came
from an external researcher, so the security team should own the disclosure/CVE timeline.

Note on CVSS: the reporter's 8.4 relies on S:C. With S:U, which is what our advisories
usually use for IDE-executes-project-content, the same vector is 7.8. High either way.
```

## 8. Where to look

| Path / artifact | Why |
|---|---|
| `fleet.plugins.gradle.workspace.jar` → `fleet/gradle/workspace/GradleProjectConfigurator` | `projectFilePatterns`, `watchProjectDirectories` |
| same jar → `GradleProjectConfiguratorKt.getGradleVersion` | the `ProcessKt.process` call that executes `gradlew` |
| `fleet.plugins.smartMode.workspace.jar` → `ProjectConfiguratorKt.configureProjects` | framework entry point; correct place for the trust gate |
| `fleet.workspace.jar` / `fleet.ship.desktop.jar` → `TrustWorkspace*` | the trust state the configurator should consult |
| `fleet.plugins.ai.workspace.jar` | an existing consumer of trust — reference implementation |
| `gradle/wrapper/gradle-wrapper.properties` (`distributionUrl`) | non-executing source for the wrapper version |

## 9. Related issues (public, project AIR)

| Issue | P | State | Relevance |
|---|---|---|---|
| AIR-6709 | Normal | open | Improve trust dialog logic |
| AIR-6676 | Major | open | Trust Folder dialogue on new worktree / docker task |
| AIR-6570 | Normal | open | "Agents can't run in untrusted folders" banner |
| AIR-5589 | Normal | resolved | Execution prompts are very vague — relevant if a prompt is added |
| AIR-5525 | Major | resolved | Agent not starting when workspace initially in Safe Mode |
| AIR-3967 | Minor | resolved | Trust workspace window focus on open |

No issue of type `Security Problem` or `Vulnerability Problem` exists in AIR, and no other
issue from this reporter is publicly visible — both consistent with security reports being
visibility-restricted.

---

## Delivery limitation

The automation asked for labels to be applied and a comment posted on AIR-6728. **Neither was
possible in this run**, and nothing was fabricated:

- The only MCP server attached (`Air`) exposes exactly one tool, `permission-tool`. There is
  no YouTrack tool, no YouTrack CLI, and no YouTrack credential in the environment.
- `AGENT_SPAWNER_SIDECAR_URL` is an S3 binary-download URL, not an issue-tracker API.
- YouTrack's public API allowed **read** access to project AIR (which is how §3 and §9 were
  produced) but `GET /api/issues/AIR-6728` returns *not found* anonymously, and anonymous
  access carries no write permission regardless.

So §1–§6 and §8–§9 are the triage, and §7 is the comment to paste. To let a future run apply
this directly, attach a YouTrack MCP server (or provide a token with comment + field-update
rights on AIR).

Also note: the repository cloned for this run is `natojb/expensesapp`, a React expense
tracker with no connection to Air's Gradle plugin — so "search the codebase for context"
could not be served by the checkout. The verification in §2 came from the Air `262.132.34`
installation present in the run environment instead.

---

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=39efb260-32e7-4270-b11f-bd8d040c8320
