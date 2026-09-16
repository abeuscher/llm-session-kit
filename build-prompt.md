# Build session-kit

This repo becomes **session-kit**: a single repo that holds (1) a Claude Code plugin with my
session protocol, (2) the templates that protocol uses, and (3) two global Node commands —
`logbug` (capture housekeeping items mid-session) and `session-init` (add the session layer to
a project). Work directly on main. Commit as you go; don't push.

## Already in place

- `CLAUDE.md` — rules for this repo. Follow it.
- `plugins/session-kit/skills/session-protocol/templates/CLAUDE.md` — the project CLAUDE.md
  template. Finished; don't rewrite it.
- `bin/logbug.mjs` — finished. Only change it if testing shows a bug.

## Check versions and docs before writing plugin files

Run `claude --version`, then read the current Claude Code docs for: `plugin.json`,
`marketplace.json`, command and skill frontmatter, how a command or skill references files
bundled inside its plugin, and the `extraKnownMarketplaces` / `enabledPlugins` settings. Write
every schema from the docs for that version, not from memory.

## Source material

Shallow-clone these into a temp directory outside this repo:

- `https://github.com/abeuscher/npc-beta` — the more mature version. Read `.claude/commands/`,
  everything under `sessions/` that defines process (templates, base prompt, README,
  release plan / outlines, housekeeping inbox), and the logbug entry in `package.json`.
- `https://github.com/abeuscher/robo-cc` — the lighter version. Read `.claude/commands/` and
  `sessions/` the same way.

Both repos evolved the same protocol separately, so they disagree in places. When they
conflict on real protocol, pick the better version; npc-beta's vocabulary wins ties (base
prompt, plan-backed vs. stub-driven session shapes). Leave out anything specific to Laravel,
Roblox, or either product.

## Step 1 — Classify, then stop

Sort every rule and every difference between the two repos into one of three buckets:

- **Protocol** — should be the same in every project. Goes in the plugin.
- **Config** — legitimately varies per project. Becomes a key in `sessions/config.md` with a
  default.
- **Leftover** — specific to one product. Dropped.

Report briefly: a table of config keys with their defaults, then one line for each protocol
conflict saying which version you picked and why. Then stop and wait. This is the only planned
stop; after I confirm, build everything below without checking in.

## Step 2 — Build

### Layout

```
session-kit/
├── .claude-plugin/marketplace.json      marketplace "abeuscher" → ./plugins/session-kit
├── plugins/session-kit/
│   ├── .claude-plugin/plugin.json
│   ├── commands/open-session.md
│   ├── commands/close-session.md
│   └── skills/session-protocol/
│       ├── SKILL.md
│       └── templates/                   the ONLY copy of every template
├── bin/logbug.mjs
├── bin/session-init.mjs
├── package.json                         private, no deps, bin: logbug + session-init
├── CLAUDE.md
└── README.md
```

### Plugin

**`session-protocol` skill.** `SKILL.md` is the canonical protocol. It covers the session
lifecycle and its Open and Close gates; the brief shapes (plan-backed delta vs. stub-driven);
the session types (feature, housekeeping, code review, test audit, planning) and how config
turns them on; branch naming taken from config; archiving; the logbug capture → digest flow;
and the kit-feedback rule. Kit-feedback means that protocol improvements noticed during a
project session get appended to `sessions/kit-feedback.md` instead of being edited into the
project. Document the default for every config key here.

**`/open-session <NNN>`.** Keep the existing behaviour. It reads the session's brief, works the
reading list, and stops at the Open Gate. If there's no brief, it says so and stops without
improvising one.

**`/close-session`.** It does the following:

1. Writes the log from the template.
2. Updates the plan file.
3. Digests `housekeeping-incoming.md` into `housekeeping-inbox.md`. Each item is checked against
   current code, questionable ones are surfaced, and the incoming file is reset to its header.
4. Drafts the next brief.
5. Archives briefs and logs older than `archive-after`.
6. Commits on the session branch. No push, no merge.

**Both commands** read `sessions/config.md` first. A missing key falls back to its documented
default. A missing config file means they say "run session-init" and stop.

### `sessions/config.md`

Markdown with YAML frontmatter; the body is for free-form project notes. Start from the keys
you settled in Step 1. At minimum: `kit-version`, `plan-file`, `branch-pattern`, `verify-step`,
`test-command`, `archive-after`, `session-types`.

### `bin/session-init.mjs`

Node, no dependencies, `readline` for questions.

- **Runs inside an existing git repo; never creates projects.** Resolve the repo root with
  `git rev-parse --show-toplevel`.
- **Finds templates through its own real path.** Follow the `npm link` symlink with
  `realpathSync`, then go to `plugins/session-kit/skills/session-protocol/templates/`.
- **Detects defaults so Enter accepts them.** `package.json` → `npm test`. `composer.json` →
  `php artisan test`. A Rojo project file → Studio playtest as the verify step.
- **Asks six questions at most.** Project name, one-line description, verify step, test
  command, and project size (small = feature + housekeeping; long = all session types). Branch
  pattern and plan file take their defaults unless changed.
- **Writes these files:**
  - `sessions/config.md`
  - a thin `sessions/README.md` that points to the plugin and doesn't restate the protocol
  - the plan file skeleton
  - `housekeeping-inbox.md`
  - `housekeeping-incoming.md` with its header
  - `sessions/archived/.gitkeep`
  - `sessions/000. Kickoff — Brief.md`, a planning session that turns `sessions/proposal.md`
    into the plan file
  - `CLAUDE.md`
  - `.claude/settings.json`, which registers the `abeuscher/session-kit` marketplace and
    enables the plugin
- **Safe on existing repos: never overwrite.**
  - An existing file is skipped and reported.
  - If `CLAUDE.md` exists, append only the section below the `<!-- session-kit -->` marker, and
    only if that marker isn't already there.
  - If `settings.json` exists, merge keys and keep everything else.
- **Fills placeholders with plain string replacement.** Use split/join. No regex, no shell:
  templates contain `$`, backticks, and slashes.
- **Supports `--dry-run`**, which prints what would happen without writing anything.
- **Ends with a short report.** List what was written, skipped, and merged, then the next step:
  add `sessions/proposal.md`, then `/open-session 000`.

### `README.md`

Short. Cover:

- **Install:** clone, `npm link`, add the marketplace, install the plugin.
- **Dev loop:** `claude --plugin-dir ./plugins/session-kit`.
- **Using `session-init`:** in a new project (after the framework's own starter) or an existing
  one.

## Done means

- The `bin/` scripts are executable. All JSON parses. If this Claude Code version has a plugin
  validation command, it passes.
- In a throwaway git repo under `/tmp`:
  - `session-init --dry-run`, then a real run (pipe the answers), produces the expected files.
  - A second run overwrites nothing.
  - `logbug "test item"` appends a stamped line.
  - A second throwaway repo with an existing `CLAUDE.md` and `.claude/settings.json` gets
    appended and merged, not clobbered.
- Work is committed on main in a few logical commits.
- Final report: a few sentences. Include anything you couldn't verify.