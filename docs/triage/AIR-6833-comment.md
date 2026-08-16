<!--
Ready-to-paste YouTrack comment for AIR-6833.
Could not be posted automatically: this run had only anonymous (guest) read access to
youtrack.jetbrains.com. Copy the content below the line into the issue as-is.

Alongside it, apply: Priority Major -> Normal. Keep Type=Bug and Subsystem=Air Web.
-->

---

**Triage:** keeping `Type: Bug` and `Subsystem: Air Web`, and proposing `Priority: Major → Normal`.

**On priority.** Open `Air Web` issues currently sit at 0 Show-stopper / 1 Critical / 2 Major / 10 Normal, and the only other open Major in the subsystem is AIR-5700 (Ctrl-C dead in Terminal — a hard functional break with no workaround), with the lone Critical being AIR-6380 (an exception that crashes terminal/editor/navigation). Project-wide, `Normal` accounts for ~89% of unresolved issues and `Major` ~9%. This one doesn't sit alongside AIR-5700 or AIR-6380 — the cursor disappears but self-recovers and there's a workaround, so nothing is actually blocked. The closest precedent is AIR-6291 ("Pointer icon gets stuck in non-default state"), which was triaged and fixed as `Normal`. Happy to be overruled if it turns out to reproduce broadly rather than being a one-off — "my cursor vanished" is alarming to users even when recoverable.

**It is almost certainly the web app.** Two details in the report settle the reporter's own uncertainty: the cursor comes back when it leaves the wasm viewport, and it comes back on rapid movement inside it. If the OS or browser chrome had lost the cursor, leaving the canvas wouldn't fix it. A cursor that's wrong *only* over one element is that element's own `cursor` styling.

**Likely root cause.** Compose for web/wasm applies the pointer icon as a CSS `cursor` property on the hosting canvas. The pointer-icon state is most likely losing its current value and applying `none` (or a custom cursor the browser can't resolve, which renders as nothing). That explains both recovery paths exactly: exiting the canvas lets the browser restore the default from the parent element, and rapid movement floods `pointermove`, one of which re-runs the cursor-application path and repairs the state.

**Where I'd look:** the cursor/pointer-icon handling in the Compose UI layer (`androidx.compose.ui` / `fleet.noria.ui`) and its wasm/DOM backend. Best starting point is the **AIR-6291 fix, which landed in build `262.182`** — worth checking whether the web/wasm cursor path ever got the equivalent correction or still carries the pre-fix logic. Secondary candidates: a hover/tooltip or drag gesture that sets a hidden cursor and doesn't restore it when interrupted (cf. AIR-5008, AIR-5639), an unreleased pointer capture/lock, or a dropped `pointerenter`/`pointerleave` pair leaving the icon stale.

**Related, but not duplicates:** AIR-6291 (fixed in `262.182`, desktop/`UI`-scoped — same class of defect) and AIR-5226 ("Cursor became invisible…", `Obsolete`, Windows-desktop-scoped, closed as unreproducible rather than fixed). AIR-5238 is worth a glance too — same `IAE: Width and height must be greater than or equal to zero` family as AIR-5226, but on `Air Web`.

**To make this reproducible**, could you add your **browser + version**, **OS**, and **Air build**, plus whether it correlates with a tab switch, window resize, DPI/display change, or returning to a backgrounded tab? And one cheap diagnostic that skips the repro problem: next time it happens, inspect the canvas element in devtools and read its computed `cursor` value. If it's `none` or an unresolvable `url(...)`, the hypothesis above is confirmed and the OS is ruled out.

*Note: the code-level pointers here are inferred from tracker evidence (stack traces and fix metadata on the related issues), not from reading the Air source — this automation was run against an unrelated repository.*

Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=225819c4-25ac-4c0d-9341-331d0ae5131d
