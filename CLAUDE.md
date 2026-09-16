# CLAUDE.md

@plugins/session-kit/skills/session-protocol/templates/CLAUDE.md

## This repo

This repo is session-kit itself. The communication rules imported above apply here. Their
"Session protocol" section does not: this repo has no sessions, and work happens directly on
main.

- **One copy of every template.** Templates live only in
  `plugins/session-kit/skills/session-protocol/templates/`. The plugin and the `bin/` scripts
  both read from there. Never duplicate a template anywhere else in the repo.
- **The plugin folder is self-contained.** Installed plugins are copied to a cache, so nothing
  inside `plugins/session-kit/` may reference a file outside that folder.
- **`bin/` scripts are Node with no dependencies.** They're linked globally with `npm link`, so
  resolve paths from the script's real location (follow the symlink), never from `process.cwd()`
  when looking for kit files.
- **Scaffolded files belong to the project.** Keep what `session-init` writes thin — config,
  empty plan, inbox, kickoff brief. Protocol text belongs in the plugin, where updates reach
  every project.
- **Config changes are versioned.** When the shape of `sessions/config.md` changes, bump
  `kit-version` and give any new key a default so older projects keep working.