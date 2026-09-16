# session-kit

A Claude Code plugin carrying a session protocol (`/open-session`, `/close-session`), the
templates that protocol uses, and two global commands — `logbug` (capture a housekeeping item
mid-session without derailing it) and `session-init` (add the session layer to a project).

The protocol itself — brief shapes, session types, the Open/Close gates, the housekeeping
flow, and every config key — is documented in
`plugins/session-kit/skills/session-protocol/SKILL.md`. This file just covers getting set up.

## Install

```sh
git clone https://github.com/abeuscher/llm-session-kit.git
cd llm-session-kit
npm link
```

`npm link` puts `logbug` and `session-init` on your `PATH` globally.

In a project you want the plugin available in, register the marketplace and enable the
plugin — either by hand in `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "abeuscher": { "source": { "source": "github", "repo": "abeuscher/llm-session-kit" } }
  },
  "enabledPlugins": { "session-kit@abeuscher": true }
}
```

or by running `session-init` in that project, which writes (or merges) the same settings for
you.

## Dev loop

Working on the plugin itself — commands, the skill, the templates — without publishing
anything:

```sh
claude --plugin-dir ./plugins/session-kit
```

This loads the plugin straight from your checkout, so edits are visible on the next
`/open-session` or `/close-session` without reinstalling.

## Using `session-init`

Run it from inside the target project's git repo:

```sh
session-init          # asks a few questions, writes the sessions/ scaffold
session-init --dry-run # same questions, prints what would happen, writes nothing
```

Use it two ways:

- **A new project**, after its own framework starter has already run (so `session-init` can
  detect a test command from `package.json` or `composer.json`, or a Rojo project file).
- **An existing project**, to add the session layer without disturbing anything already
  there — an existing `CLAUDE.md` gets the session-protocol section appended below a marker
  rather than being rewritten, and an existing `.claude/settings.json` gets the marketplace
  and plugin keys merged in.

It never overwrites a file that's already there; it reports what it wrote, merged, and
skipped, and tells you the next step: write `sessions/proposal.md`, then run
`/open-session 000` to turn it into the plan.
