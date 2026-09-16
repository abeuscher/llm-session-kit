---
description: Run the session Close Gate to completion in one pass
disable-model-invocation: true
---

Close the current session. This is the explicit close signal — run the Close Gate below now,
in one pass, on the current session branch. Do not ask whether to close or re-confirm the
next brief's contents; running this command is the only gate.

First read `sessions/config.md` for `plan-file`, `archive-after`, and `branch-pattern`. If the
file doesn't exist, say "run session-init first" and stop.

Follow the Close Gate as documented in the `session-protocol` skill:

1. **Write the log.** Copy `templates/session-log.md` (from the skill's `templates/`
   directory) to `sessions/NNN. <Title> — Log.md` and fill every section from what actually
   happened. Copy the template structure exactly — do not base the log on a previous
   session's log.
2. **Update the plan file** (`plan-file` from config). Mark this session's entry done; edit
   scope that shifted during the session.
3. **Digest the housekeeping capture buffer.** Read `sessions/housekeeping-incoming.md`.
   For each captured item, check it against current code (already fixed? duplicate? refers to
   code that's gone?), surface anything questionable to the user, then fold the survivors
   into `sessions/housekeeping-inbox.md` under `## Inbox`, keeping each item's capture stamp.
   Reset the incoming file back to its header. If the buffer only holds its header, say so in
   one line and move on.
4. **Draft the next brief.** Copy `templates/session-brief.md` to
   `sessions/(NNN+1). <Title> — Brief.md`, picking the plan-backed or stub-driven shape per
   the skill, informed by what this session learned and by the plan file / inbox.
5. **Archive.** Move any brief or log older than `archive-after` sessions into
   `sessions/archived/`.
6. **Commit** on the current session branch (per `branch-pattern`): stage the log, the plan
   file, the inbox and cleared incoming buffer, the next brief, and anything moved into
   `archived/`. Commit with a message naming the session. Never push, never merge to main —
   that stays the user's call.

Tell the user it's done in one short line once the commit lands.
