---
kit-version: {{KIT_VERSION}}
plan-file: {{PLAN_FILE}}
branch-pattern: {{BRANCH_PATTERN}}
verify-step: {{VERIFY_STEP}}
test-command: {{TEST_COMMAND}}
archive-after: {{ARCHIVE_AFTER}}
session-types: {{SESSION_TYPES}}
---

# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

Session-kit config for this project. `/open-session` and `/close-session` read this file
first; a key missing here falls back to the default documented in the `session-kit` plugin's
`session-protocol` skill. Bump `kit-version` only when the shape of this file changes.

## Notes

Free-form project notes.
