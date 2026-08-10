# Ready-to-paste YouTrack comment for AIR-6745

Fields to set manually:

- **Type:** `Task`
- **Priority:** `Major`
- **Subsystem:** `Platform`

Comment body (YouTrack Markdown) below the line.

---

**Triage: Type `Task` · Priority `Major` · Subsystem `Platform`**

**Type — Task.** This is a research/decision spike, not a defect: no repro, no regression, four candidate
approaches and an open **Open questions** checklist. Implementation should be split into follow-ups once a
direction is chosen. (`Feature` was the runner-up, but the ticket is scoped to *choosing* an approach, not
shipping one.)

**Priority — Major.** Above the `Normal` baseline because it gates a shipping decision: if Windows distribution
switches to MSIX before an update path exists, everyone who installs from that package is stranded with no in-app
route forward. Every comparable distribution/installer issue in this project is also `Major` — AIR-5406,
AIR-5755, AIR-3561, AIR-6465, AIR-5231. Not `Critical`, which here is reserved for present-tense breakage
(AIR-6727, AIR-6699, AIR-6678); nothing is broken for users today. **Escalate to `Critical` if an MSIX build is
cut for a release channel before this is resolved.**

**Subsystem — Platform.** Matches the closest analogues (AIR-3561, AIR-6465) and all recent distribution work
from this reporter.

---

**Context for whoever picks this up**

- **AIR-5406** is the most relevant prior art — the exact failure mode of the current updater on Windows
  installer builds. Its stack trace lands in `fleet.dock.desktop.SparkleApi.init` with native
  `HRESULT(0x80070716)` *"The specified resource name cannot be found in the image file."* That shows WinSparkle
  resolving update resources out of the packaged image — the assumption MSIX containerisation breaks. Read it
  before evaluating options 1 and 2.

- **AIR-3561** (*Support package manager installation*, In design) explicitly covers `winget` on Windows and
  **overlaps this ticket directly**. `winget` consumes MSIX and updates natively. Deciding these separately risks
  building an updater that `winget` supersedes — worth aligning with @titouan.bion before committing.

- **AIR-6465** defers *"notification in Air when a new version is available"* to **AIR-6633**. Option 3.1 here
  says *"UI for it needs to be implemented manually"*, and option 4 is a new UI outright — check AIR-6633 for
  reuse before scoping either.

- **AIR-5755** is recent WinSparkle-facing work (native-style update dialog buttons); whoever did it has the
  current integration paged in, and it indicates how much UI options 3 and 4 would re-implement.

**Likely root cause of the difficulty.** WinSparkle assumes it can locate update resources inside the app image
*and* run an installer that overwrites the install directory in place. MSIX breaks both: packages live in a
system-managed read-only location under `WindowsApps`, are signature- and identity-bound, and can only be
serviced through the platform deployment stack (`PackageManager` / App Installer). The `HRESULT(0x80070716)` in
AIR-5406 is that first assumption failing even in the *pre*-MSIX build — so **option 2 is the one most likely to
dead-end**, and option 3 (App Installer + embedded `.appinstaller` manifest) is the only path that does not fight
MSIX's servicing model. Suggest prototyping it first.

**Also worth a look:** MSIX filesystem virtualisation and per-user install locations affect more than the
updater — a Windows path-handling regression pass after the packaging switch would be prudent (cf. AIR-6277).

Finally, the **Open questions** checklist is empty — as written it is a blocker for anyone but the reporter.

*Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=a8d5b020-4754-4351-b496-bda0123a9cdb*
