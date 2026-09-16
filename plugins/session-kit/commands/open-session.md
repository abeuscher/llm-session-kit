---
description: Open a session by loading its brief and stopping at the Open Gate
argument-hint: [session-number]
disable-model-invocation: true
---

Open session $ARGUMENTS.

First read `sessions/config.md`. If it doesn't exist, say "run session-init first" and stop.
A missing key in it falls back to the default documented in the `session-protocol` skill.

Then read `sessions/$ARGUMENTS. <Title> — Brief.md` — match on the session number even if the
title or casing differs. That brief is the authority for this session: its reading list,
starting state, plan, process rules, and its own Open and Close Gates.

Follow the `session-protocol` skill for how a brief is structured and what the Open Gate
requires. Work the reading list in order, then stop at the Open Gate and wait for
confirmation. Do not pipeline past the gate into task work.

If no brief exists for session $ARGUMENTS, say so and stop. Do not improvise one.
