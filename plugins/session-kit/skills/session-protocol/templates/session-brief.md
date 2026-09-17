# Template: Session Brief

Copy this file to `sessions/NNN. <Title> — Brief.md` at the start of a session. This is the
whole brief — there is no separate base prompt. Delete this header block in the copy.

Two shapes — pick the one that fits, per the `session-protocol` skill:

- **Plan-backed** (the common case). The session executes an entry in the plan file. That
  entry is canonical for scope, success criterion, prerequisites, and artifact — this brief
  is a **delta** against it. Most sections below can shrink or be omitted.
- **Stub-driven.** No plan-file entry yet — an emergent or one-off session. Use the fuller
  shape: explicit phases, open questions, out-of-scope.

---

# Session NNN — <Title> — Brief

**Type:** feature | housekeeping | code-review | test-audit | planning
**Shape:** plan-backed | stub-driven
**Branch:** <this session's branch, per `branch-pattern` in `sessions/config.md`>

## Goal

One or two sentences: what this session builds, audits, or plans, and the state the project
reaches by the end.

## Plan reference *(plan-backed sessions)*

This session executes the plan file's entry for <name>. Read that entry first — it is
canonical for scope, success criterion, prerequisites, and artifact.

## Session-specific deltas *(plan-backed sessions, only if there are any)*

Anything the plan entry doesn't cover: constraints surfaced since it was written, choices
deferred to session time, references to fresh context. Omit this section if the plan entry
stands alone.

## Phases *(stub-driven sessions)*

What gets built in each phase, not how.

### Phase 1 — ...

### Phase 2 — ...

## Reading list

Read these before touching anything, in order:

1. The plan file's entry for this session (plan-backed), or the stub / conversation this
   session comes from (stub-driven).
2. This brief.
3. The previous session's log, `sessions/(NNN-1). <Title> — Log.md` — "What was built" and
   "Deferred / carried forward."
4. The files this session will modify (list them).

## Starting state

One line each — the handoff from the previous session:

- What already exists that this session builds on.
- Anything left unfinished or deferred last session.
- Housekeeping inbox posture for this session's type — whether it absorbs inbox items (see
  the skill's per-type rules) and which ones, if so.

## Out of scope

What this session deliberately does not touch. Omit if the plan entry already says.

## Open questions

The small set of decisions that need to be settled before implementation. Omit if none.

---

## Process rules

Follow the `session-protocol` skill's process rules in full. Restated here because they
govern the work directly:

- A question from the user is a question, not an instruction to act. Answer it, then wait.
- Read every file you intend to modify before editing it.
- Adapt silently to small drift between this brief and the code; note the adaptation in one
  line. Pause and ask only for decisions that are genuinely expensive to reverse — data
  shape, new abstractions, anything cross-cutting. If a reasonable reading of the surrounding
  code lands on the same answer, just decide.
- When implementation is complete, run `test-command` (from `sessions/config.md`) and fix
  failures before announcing completion. If there's no `test-command`, follow `verify-step`
  instead.
- Verify objective outcomes yourself — don't hand the user something to run and report back
  when you can observe the result directly. Pull the user in only for judgment only a human
  can make: visual design, UX, whether an interaction feels right.
- Match existing code conventions. No comments or type annotations on code you didn't write.
- Speak to the user in the project's language, not this brief's. Session numbers, plan
  entries, config keys, file paths — that's this document's register, not something to
  repeat back. Follow the project's own `CLAUDE.md` for how to talk to them, and translate
  on the way out. This applies to what you say, not what you write to disk.

## Session Open Gate

After the reading list, starting state, and process rules are read — and before any task
work — post a short orientation: what shape this session is, the work plan, anything that
needs clarifying. Write it in the project's language, not this brief's — see the process
rule above. Then wait for the user to confirm. Do not pipeline from reading into
implementation.

## Session Close Gate

Everything below happens only when the user runs `/close-session`. See the `session-protocol`
skill for the full Close Gate steps; this brief adds no session-specific steps beyond those.
