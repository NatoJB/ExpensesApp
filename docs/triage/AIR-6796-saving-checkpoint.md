# Triage: AIR-6796 — "Saving Checkpoint"

**Issue:** [AIR-6796](https://youtrack.jetbrains.com/issue/AIR-6796) · reported by `Jonas_Baumann` on 2026-08-12
**Report:** "The System always says saving checkpoint but never saves it" — Air build 262.132.34, Windows 11 (10.0, amd64)

> **This triage was not applied in YouTrack.** The automation runs with anonymous (`guest`) YouTrack
> access only — `GET /api/users/me` returns `{"login":"guest","guest":true}`, and `POST
> /api/issues/AIR-6796/comments` returns **HTTP 403 Forbidden**. No YouTrack token or MCP tool was
> available in the run environment, so the fields below could not be set and the comment could not be
> posted. Both are reproduced verbatim here for a human to apply. See "Applying this triage" at the end.

## Recommended field values

| Field | Current | Recommended |
|---|---|---|
| Priority | Normal | **Major** |
| Type | Bug | **Bug** (unchanged) |
| Subsystem | — | **Git** |
| Platform | — | **Windows** |
| Affected versions | — | **262.132.34** |
| State | Submitted | **Wait for reply** (needs workspace path + logs to confirm) |
| Links | — | Relates to **AIR-5811**, **AIR-6781**, **AIR-6469**, **AIR-6724** |

## Comment to post

Verbatim text intended for AIR-6796. Everything between the markers is the comment body.

<!-- BEGIN COMMENT -->

**Triage** — Priority: **Major** (from Normal) · Type: **Bug** · Subsystem: **Git** · Platform: **Windows** · Affected versions: **262.132.34**

### Most likely root cause: the workspace root is on a WSL/UNC path

The same reporter filed AIR-6781 one day earlier from the same build (262.132.34, Windows 11) with this stack trace:

```
IllegalArgumentException: Path should start with a drive letter or a UNC share
    [//wsl.localhost/Ubuntu/home/jbaumann/repos/<repo>/.git/index]
    at GitCheckpoints.withTempIndex(GitCheckpoints.kt:229)
```

`GitCheckpoints.withTempIndex` is the checkpoint code path. A git checkpoint is created at the start of every agent request and gates it (see AIR-6724), so if `withTempIndex` throws on the `//wsl.localhost/...` index path, the request never completes and the UI stays pinned at "Saving checkpoint" — on every request. That matches the report exactly: "always says saving checkpoint but never saves it". AIR-6781 was closed as a duplicate of AIR-5811 (WSL is not yet supported in Air).

**Workaround for the reporter:** open/clone the repository from a native Windows drive path (e.g. `C:\repos\<repo>`) rather than `\\wsl.localhost\...`.

**What would confirm it:** the workspace root path, plus logs (Help → Diagnostic Tools → Collect Logs). If the log contains the `IllegalArgumentException` above → this is AIR-5811. If it instead shows `Created generic ACP agent` with no following `Saved checkpoint` → this is AIR-6469.

### Why Major (not Normal, not Critical)

- **Deterministic and total.** "Always" — not intermittent. Since checkpointing gates every agent request, no agent work is possible at all; Air is unusable for this user, not degraded.
- **It fails silently.** No error reaches the UI — the request just hangs forever. AIR-6781 shows the exception exists and is simply never surfaced. A permanent silent hang is worse than an error message.
- **Consistency with precedent.** AIR-6469 — "Stuck in Saving checkpoint" (4 votes, Windows) — is Major for the same user-visible symptom.
- **Not Critical.** It is confined to WSL/UNC workspace roots — an explicitly unsupported configuration with a workaround. In this project Critical is reserved for product-wide breakage (cf. AIR-6532). For calibration: of the 379 currently open AIR bugs, 86% are Normal, 11% Major, 2% Minor, 1% Critical — Major is a real escalation here, not inflation.
- **Type stays Bug**, not Performance Problem: the report says *never*, not *slow*.

### Related issues

| Issue | Why it matters |
|---|---|
| AIR-6781 | Same reporter, same build — the exception behind this symptom. Closed as duplicate of AIR-5811. |
| AIR-5811 | Add WSL support to Air on Windows (Feature, Submitted, 26 votes). Likely the real parent. |
| AIR-6469 | Stuck in "Saving checkpoint" (Major, Open, Windows, Fix Version 262.579). Same symptom, different mechanism. |
| AIR-6648 | Duplicates AIR-6469. Contains two concrete diagnoses: `GitWatcher` deadlocking on the `git log -z --pretty=format:%ae %an` stdout pipe (Windows 64 KB pipe buffer, unbounded output), and a race where `Created generic ACP agent` beating `Saved checkpoint` means the checkpoint never happens (10/10 hung vs 4/4 fine). Workaround there: cancel and resend. |
| AIR-6724 | Optimize git checkpoint creation on large worktrees (Major, In progress, Git). Third candidate if the repo is monorepo-scale — checkpoints cost 40–130 s there, which can read as "never". |
| AIR-6287, AIR-6078, AIR-5565 | Same family of git-fails-on-WSL/UNC reports. |

### Suggested handling

Link this to AIR-5811 and AIR-6781 rather than closing it outright until the workspace path is confirmed. If it is then consolidated into AIR-5811, please split off the distinct defect it exposes — **checkpoint creation should fail fast with a clear "workspace root on a WSL/UNC path is not supported" message instead of hanging indefinitely** — so that it is not lost behind a feature request that has no fix version.

---
Produced by Air Automation. Name: Issue Triage / Run: https://air.jetbrains.cloud/org/05cf1a7f-6ab5-713b-abd3-29d0c8a05e2d/automations/eb0b59c1-07df-489c-ae0c-97b2cb94989e?run=c436af5b-b030-459c-aa22-e830d5352bcd

<!-- END COMMENT -->

## Applying this triage

To let this automation write to YouTrack directly in future runs, attach a YouTrack permanent token
(scoped to the `AIR` project, with `Update Issue` and `Create Comment` permissions) to the automation's
credentials, or connect a YouTrack MCP server. Everything above was derived from read-only public API
queries, which did work.

## Note on codebase context

The task asked for codebase context. The repository checked out for this run is `natojb/expensesapp`,
a React + TypeScript expense tracker — it is unrelated to the JetBrains Air product that AIR-6796 is
filed against, and contains no checkpoint, git-integration, or agent code. Every code reference in the
comment above (`GitCheckpoints.withTempIndex`, `GitWatcher`, `GenericAcpAgentProvider`) comes from stack
traces and log excerpts quoted in the YouTrack issues themselves, not from a local source checkout.
