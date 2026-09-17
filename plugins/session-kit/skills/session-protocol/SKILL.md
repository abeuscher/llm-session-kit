---
name: session-protocol
description: The canonical session-kit protocol — session lifecycle, the Open and Close Gates, brief shapes, session types, the housekeeping capture-to-inbox flow, and every sessions/config.md key with its default. Read this before /open-session or /close-session, or whenever a session-kit project's process rules need checking.
---

# Session protocol

This is the canonical protocol for projects using the `session-kit` plugin. `/open-session`
and `/close-session` both point here for the mechanics; a project's own `sessions/config.md`
supplies the settings this protocol reads.

If a project has no `sessions/config.md`, it hasn't been set up yet — say so and point at
`session-init`, rather than improvising the protocol from this doc alone.

## Config keys

Every key below has a default. A project's `sessions/config.md` only needs to name the keys
it wants to override.

| Key | Default | Meaning |
|---|---|---|
| `kit-version` | `1` | Bumped when the shape of `config.md` itself changes; lets an older project's config keep working against a newer plugin. |
| `plan-file` | `sessions/plan.md` | The single source of truth for scope and sequencing. See "Brief shapes" below. |
| `branch-pattern` | `session-{NNN}` | One branch per session. `session-{NNN}/{N}` is available for projects that want iteration sub-branches within a session. |
| `verify-step` | *(none)* | Human-readable description of how a session verifies its work at close, used when `test-command` doesn't cover it (e.g. "sync and run a two-player playtest"). |
| `test-command` | *(none)* | The literal shell command that runs this project's automated checks. Run it when implementation is complete, before announcing completion. |
| `archive-after` | `2` | A brief or log more than this many sessions old moves to `sessions/archived/` at close. |
| `session-types` | `[feature, housekeeping]` | Which of the five session types (below) this project uses. `session-init` offers the full set for larger projects. |

`verify-step` and `test-command` can both be set — `test-command` is what gets run;
`verify-step` describes what to do when there's nothing to automate, or names the step in
addition to the automated command (e.g. a visual check after tests pass).

## Session lifecycle

A session is one unit of work, recorded as one brief and, once closed, one log:

1. **`/open-session NNN`** reads `sessions/config.md`, then
   `sessions/NNN. <Title> — Brief.md`. There is no separate base prompt — the brief is the
   whole thing: reading list, starting state, plan, process rules, and its own gates.
2. The agent works the brief's reading list, then stops at the **Open Gate** for
   confirmation before any task work begins.
3. Work happens. The agent verifies its own work per the process rules below, and pauses
   only for decisions or judgment calls that genuinely need the user.
4. **`/close-session`** runs the **Close Gate**: write the log, update the plan file, digest
   the housekeeping buffer, draft the next brief, archive old records, commit. No push, no
   merge to main — ever, from either gate.

If no brief exists for the requested session number, say so and stop. Don't improvise one —
that's what `/close-session`'s Close Gate is for, or a planning session.

## Brief shapes

Every brief is one of two shapes:

- **Plan-backed** (the common case). The session executes an entry in `plan-file`. That
  entry is canonical for scope, success criterion, prerequisites, and artifact. The brief is
  a **delta** against it — anything the plan entry doesn't already say. Most of the brief's
  sections shrink or disappear.
- **Stub-driven.** No plan-file entry yet — an emergent session, a one-off, or a forcing
  function (an unblocker, a maintenance pass). Use the fuller shape: explicit phases, open
  questions, out-of-scope, spelled out directly in the brief since there's no entry to defer
  to.

A stub-driven session that turns out to need real sequencing gets promoted to its own
plan-file entry — see the housekeeping inbox's disposition rules, which use the same
promotion path for inbox items.

## Session types

`session-types` in config gates which of these a project uses. `feature` and `housekeeping`
are the default pair — small projects rarely need more. A project sized for the full set
turns on all five.

- **feature** — builds something. The default shape for ordinary work.
- **housekeeping** — batches small items out of `housekeeping-inbox.md`. This is the one
  type that's expected to absorb inbox items as part of its own scope rather than treating
  them as a distraction from a feature's scope (see "Housekeeping flow" below).
- **code-review** — an audit pass over the existing codebase for shape and fit: files or
  modules that have grown disproportionately, patterns that no longer match how the project
  actually works, dead code. Keep a rolling disposition note (in the plan file or a doc it
  points at) of what was looked at and why it was kept, changed, or deliberately left — so
  the next code-review session picks up from dispositions already made instead of
  relitigating them. Audit and apply can be one session or split into two (audit first,
  apply once reviewed) depending on size.
- **test-audit** — a signal-driven pass over the test suite, distinct from writing new
  tests. Use whatever the project's language and tools offer for an external signal on which
  tests carry weight (a mutation-testing tool, a coverage-delta report, or absent either, an
  adversarial read of what each test actually asserts) rather than a subjective re-read —
  the point is to catch tests that pass without testing anything, not to re-eyeball what's
  already there. Every deletion needs a one-line rationale tied to that signal, not "this
  looks redundant."
- **planning** — turns a proposal, a forward-looking conversation, or a stale plan file into
  plan-file entries. Session 000 (the kickoff brief `session-init` scaffolds) is this type;
  so is any later replanning pass. A planning session's artifact is the plan file itself,
  updated — not the work the plan describes. Planning work (and any other editing of
  `plan-file`) is worth the project's best available model even when day-to-day sessions use
  something faster — the plan is read by every session after it.

## Process rules

These apply inside every session, whatever its type or shape:

- **A question is a question, not an instruction.** When the user asks something, answer it
  and wait. Don't read a question as an implicit directive to act — that reads as
  passive-aggressive-adjacent even when it isn't meant that way, and produces friction where
  none is needed.
- **Read before you write.** Read every file you intend to modify before editing it.
- **Adapt to drift; don't ask about it.** A brief is a snapshot of the code at the time it
  was written — expect small inaccuracies (a renamed field, a changed signature). Default to
  adapting silently and noting the adaptation in one line. Only surface drift when it's a
  real decision point: two reasonable readings would produce meaningfully different
  behavior, it reveals a likely bug, or resolving it would expand scope.
- **Decision threshold scales with project maturity.** In a young, loose project, more
  things are worth asking about. In an established one, reserve "pause and ask" for
  decisions that are genuinely expensive to reverse — data shape, new abstractions, anything
  cross-cutting. If a reasonable reading of the surrounding code lands on the same answer,
  just decide and note it. If sessions start feeling like a loop of obvious-answer
  confirmations, that's a sign to recalibrate this threshold for the project, the same way
  drift and decision-threshold rules themselves got added after an older, stricter version of
  this protocol was found to over-ask.
- **Verify objective outcomes yourself; pull the user in for judgment.** When you can
  observe the result directly — command output, a file's contents, a test run — do that
  instead of asking the user to run something and report back. Run `test-command` when
  implementation is complete and fix failures before announcing completion; fall back to
  `verify-step` when there's nothing to automate. Pull the user in only for what only a human
  can judge: visual design, UX, whether something feels right.
- **Follow existing conventions.** Match the code that's already there. No comments or type
  annotations on code you didn't write. Don't add a feature, refactor, or dependency beyond
  what the session's brief specifies.
- **Speak to the user in the project's language, not this protocol's.** A brief and this skill
  are written in a denser register on purpose — session numbers, entry/milestone codes,
  config keys, file paths — because that's what operating on them efficiently takes. None of
  that belongs in anything said *to* the user: the Open Gate orientation, a status update
  mid-session, a drift or decision flag, the Close Gate's done line. Follow the project's own
  `CLAUDE.md` for how to talk to them (plain language, no internal handles, describe changes
  by what they do) and translate on the way out — "the board and combat rules split across
  three sessions", not "M1 splits into three entries." This doesn't apply to what you *write
  to disk* — the brief, the log, the plan file — which stay in their working register for the
  next session to read.

## Housekeeping flow

`logbug "what you noticed"` (a global command from this plugin's package) stamps an item
with the date and appends it to `sessions/housekeeping-incoming.md`, without touching the
canonical inbox mid-session. At `/close-session`:

1. Read the incoming buffer. For each item, check it against current code — already fixed?
   duplicate of something already in the inbox? referring to code that's gone?
2. Surface anything questionable to the user before folding it in.
3. Fold the survivors into `housekeeping-inbox.md` under `## Inbox`, keeping each item's
   capture stamp so its age stays visible for the next re-verification.
4. Clear the incoming buffer back to its header.

A `housekeeping`-typed session's own scope is to walk the inbox: re-verify each candidate
item against current code (the premise may have gone stale since capture), batch what's
still valid, and note what got dropped or promoted under "Recently dispositioned."

## Open Gate

After a brief's reading list, starting state, and process rules are read — and before any
task work begins — post a short orientation: what shape this session is, the work plan, and
anything that needs clarifying. Then wait for the user to confirm. Never pipeline from
reading straight into implementation.

Write the orientation itself per "Speak to the user in the project's language, not this
protocol's" above — this is the single spot internal-handle language leaks through most
often, because it's written right after reading a brief full of it.

## Close Gate

Runs only when the user explicitly invokes `/close-session` — never suggested, never
pipelined into after tests pass or after manual verification completes. In order:

1. **Write the log** from `templates/session-log.md`, copied exactly — not reconstructed
   from a previous log.
2. **Update the plan file.** Mark this session's entry done; edit scope that shifted.
3. **Digest the housekeeping buffer** per "Housekeeping flow" above.
4. **Draft the next brief** from `templates/session-brief.md`, informed by what this session
   learned, the plan file, and the inbox.
5. **Archive.** Move any brief or log more than `archive-after` sessions old into
   `sessions/archived/`.
6. **Commit** on the session's branch (per `branch-pattern`): the log, the plan file, the
   inbox and cleared incoming buffer, the next brief, anything archived. Name the session in
   the commit message. **Never push, never merge to main** — that's the user's call, on
   their own cadence.

Tell the user it's done in one short line once the commit lands — per "Speak to the user in
the project's language, not this protocol's" above, not "closed session NNN, committed on
session-NNN."

## Kit-feedback

If a session surfaces a way this protocol itself should change — not something specific to
the project — don't edit it into the project's own copy of anything. There is no per-project
copy to edit: every project reads the same plugin. Append the observation to
`sessions/kit-feedback.md` instead (create it if it doesn't exist), with enough context to
act on later, and keep working the session. The kit's own maintainer picks these up
separately; a project session is never the place to change the protocol for everyone.
