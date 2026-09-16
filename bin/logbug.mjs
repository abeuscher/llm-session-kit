#!/usr/bin/env node
// logbug — capture a housekeeping item into sessions/housekeeping-incoming.md
// without disrupting an in-flight session.
//
// Usage:
//   logbug "hero buttons can't be right-aligned"
//   logbug hero buttons cant be right aligned   (quotes optional)
//
// Appends one stamped line to the incoming scratch file. The stamp carries the
// repo-root VERSION marker + today's date so that when the item is later walked
// into a session, its age is visible and the premise can be re-verified against
// current code before any work is scheduled. The incoming file is digested into
// sessions/housekeeping-inbox.md at the next /close-session, so capture never
// edits the canonical inbox mid-session.

import { readFileSync, existsSync, appendFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

// The target project's root, not this script's own — logbug is a global command (linked via
// `npm link`) invoked from inside whatever project is capturing the item.
let repoRoot
try {
  repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
} catch {
  console.error('logbug must be run inside a git repository.')
  process.exit(1)
}
const incomingPath = join(repoRoot, 'sessions', 'housekeeping-incoming.md')
const versionPath = join(repoRoot, 'VERSION')

const description = process.argv.slice(2).join(' ').trim()
if (!description) {
  console.error('Usage: logbug "what you noticed"')
  process.exit(1)
}

const version = existsSync(versionPath)
  ? readFileSync(versionPath, 'utf8').trim()
  : 'unknown'
const date = new Date().toISOString().slice(0, 10)

const header = `# Housekeeping Incoming

Capture buffer for items noticed mid-session via \`logbug "…"\`. Each
line is stamped with the VERSION marker + date at capture time. This file is
NOT the canonical inbox — at the next session close the close gate digests these
items, verifies each against current code, surfaces anything questionable, and
folds the survivors into \`sessions/housekeeping-inbox.md\`, then clears this
file back to this header. Do not hand-curate here; capture and move on.

---
`

if (!existsSync(incomingPath)) {
  writeFileSync(incomingPath, header)
}

appendFileSync(incomingPath, `\n- [${version} · ${date}] ${description}`)
console.log(`Logged to housekeeping-incoming.md [${version} · ${date}]: ${description}`)
