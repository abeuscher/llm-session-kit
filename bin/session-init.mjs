#!/usr/bin/env node
// session-init — scaffold the session-kit protocol into an existing git project.
//
// Usage:
//   session-init [--dry-run]
//
// Runs inside an existing git repo; never creates one. Resolves the repo root via
// `git rev-parse --show-toplevel`, finds this plugin's templates through its own real path
// (following the npm-link symlink), asks a short set of questions (Enter accepts the
// detected default), and writes the sessions/ scaffold plus a project CLAUDE.md and
// .claude/settings.json — without ever overwriting a file that's already there. An existing
// CLAUDE.md or settings.json gets merged instead of skipped. See sessions/README.md (once
// written) for what each file is for.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline'

const DRY_RUN = process.argv.includes('--dry-run')

// ---- locate the plugin's templates through this script's real path, not process.cwd() ----
const scriptRealPath = realpathSync(fileURLToPath(import.meta.url))
const kitRoot = join(dirname(scriptRealPath), '..')
const templatesDir = join(kitRoot, 'plugins', 'session-kit', 'skills', 'session-protocol', 'templates')

// ---- locate the target repo ----
let repoRoot
try {
  repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
} catch {
  console.error('session-init must be run inside a git repository.')
  process.exit(1)
}

const sessionsDir = join(repoRoot, 'sessions')

function readTemplate(name) {
  return readFileSync(join(templatesDir, name), 'utf8')
}

// Plain split/join substitution — no regex, no shell. Templates contain `$`, backticks, and
// slashes of their own; a regex or shell-based replace would trip over those.
function fill(text, values) {
  for (const [token, value] of Object.entries(values)) {
    text = text.split(`{{${token}}}`).join(value)
  }
  return text
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

const written = []
const skipped = []
const merged = []

function writeIfAbsent(path, content, label) {
  if (existsSync(path)) {
    skipped.push(label ?? path)
    return
  }
  if (!DRY_RUN) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }
  written.push(label ?? path)
}

// ---- detect defaults ----

function detectProjectName() {
  const pkg = readJsonIfExists(join(repoRoot, 'package.json'))
  if (pkg?.name) return pkg.name
  const composer = readJsonIfExists(join(repoRoot, 'composer.json'))
  if (composer?.name) return composer.name
  return basename(repoRoot)
}

function detectDescription() {
  const pkg = readJsonIfExists(join(repoRoot, 'package.json'))
  if (pkg?.description) return pkg.description
  const composer = readJsonIfExists(join(repoRoot, 'composer.json'))
  if (composer?.description) return composer.description
  return ''
}

function hasRojoProject() {
  if (!existsSync(repoRoot)) return false
  return readdirSync(repoRoot).some((f) => f.endsWith('.project.json'))
}

// composer.json before package.json: a repo carrying both (a Laravel app with an npm-built
// frontend, say) is tested through the PHP suite, not `npm test`.
function detectTestCommand(rojo) {
  if (rojo) return ''
  if (existsSync(join(repoRoot, 'composer.json'))) return 'php artisan test'
  if (existsSync(join(repoRoot, 'package.json'))) return 'npm test'
  return ''
}

// ---- ask questions (six at most; branch pattern is the only one beyond the five the kit
// doc names — plan-file always defaults to sessions/plan.md and is never asked) ----
//
// Interactive (a real terminal) uses readline's normal question/answer loop. Piped stdin
// (answers fed in for a scripted or automated run) is read up front and doled out line by
// line instead — Node's readline can stall after the first question when stdin isn't a TTY.

function createAsker() {
  const isTTY = Boolean(process.stdin.isTTY)
  const rl = isTTY ? createInterface({ input: process.stdin, output: process.stdout }) : null
  let pipedLines = null

  function nextPipedLine() {
    if (pipedLines === null) {
      let data = ''
      try {
        data = readFileSync(0, 'utf8')
      } catch {
        data = ''
      }
      pipedLines = data.split('\n')
    }
    return pipedLines.shift() ?? ''
  }

  return {
    ask(question, fallback) {
      const suffix = fallback ? ` [${fallback}]` : ''
      if (rl) {
        return new Promise((resolve) => {
          rl.question(`${question}${suffix}: `, (answer) => resolve(answer.trim() || fallback || ''))
        })
      }
      const line = nextPipedLine()
      process.stdout.write(`${question}${suffix}: ${line}\n`)
      return Promise.resolve(line.trim() || fallback || '')
    },
    close() {
      if (rl) rl.close()
    },
  }
}

async function main() {
  console.log(DRY_RUN ? 'session-init --dry-run — no files will be written.\n' : 'session-init\n')

  const rojo = hasRojoProject()
  const detectedTestCommand = detectTestCommand(rojo)
  const detectedVerifyStep = rojo
    ? 'Sync to Studio and run a playtest'
    : detectedTestCommand
      ? 'run test-command'
      : ''

  const asker = createAsker()

  const projectName = await asker.ask('Project name', detectProjectName())
  const description = await asker.ask('One-line description', detectDescription())
  const testCommand = await asker.ask('Test command (blank if none)', detectedTestCommand)
  const verifyStep = await asker.ask('Verify step', detectedVerifyStep)
  const sizeAnswer = (await asker.ask('Project size — small or long', 'small')).toLowerCase()
  const branchPattern = await asker.ask('Branch pattern', 'session-{NNN}')

  asker.close()

  const size = sizeAnswer.startsWith('l') ? 'long' : 'small'
  const sessionTypes =
    size === 'long'
      ? '[feature, housekeeping, code-review, test-audit, planning]'
      : '[feature, housekeeping]'
  const planFile = 'sessions/plan.md'
  const archiveAfter = '2'
  const kitVersion = '1'

  // ---- sessions/config.md ----
  const configContent = fill(readTemplate('config.md'), {
    KIT_VERSION: kitVersion,
    PLAN_FILE: planFile,
    BRANCH_PATTERN: branchPattern,
    VERIFY_STEP: verifyStep,
    TEST_COMMAND: testCommand,
    ARCHIVE_AFTER: archiveAfter,
    SESSION_TYPES: sessionTypes,
    PROJECT_NAME: projectName,
    PROJECT_DESCRIPTION: description,
  })
  writeIfAbsent(join(sessionsDir, 'config.md'), configContent, 'sessions/config.md')

  // ---- sessions/README.md ----
  const readmeContent = fill(readTemplate('sessions-readme.md'), {
    PLAN_FILE_NAME: basename(planFile),
  })
  writeIfAbsent(join(sessionsDir, 'README.md'), readmeContent, 'sessions/README.md')

  // ---- plan file skeleton ----
  writeIfAbsent(join(repoRoot, planFile), readTemplate('plan.md'), planFile)

  // ---- housekeeping ----
  writeIfAbsent(
    join(sessionsDir, 'housekeeping-inbox.md'),
    readTemplate('housekeeping-inbox.md'),
    'sessions/housekeeping-inbox.md',
  )
  writeIfAbsent(
    join(sessionsDir, 'housekeeping-incoming.md'),
    readTemplate('housekeeping-incoming.md'),
    'sessions/housekeeping-incoming.md',
  )

  // ---- archived/.gitkeep ----
  writeIfAbsent(join(sessionsDir, 'archived', '.gitkeep'), '', 'sessions/archived/.gitkeep')

  // ---- kickoff brief ----
  writeIfAbsent(
    join(sessionsDir, '000. Kickoff — Brief.md'),
    readTemplate('kickoff-brief.md'),
    'sessions/000. Kickoff — Brief.md',
  )

  // ---- CLAUDE.md: write fresh, or append the marked section only ----
  handleClaudeMd()

  // ---- .claude/settings.json: write fresh, or merge the marketplace + plugin keys in ----
  handleSettingsJson()

  report()
}

function handleClaudeMd() {
  const path = join(repoRoot, 'CLAUDE.md')
  const template = readTemplate('CLAUDE.md')
  const marker = '<!-- session-kit -->'

  if (!existsSync(path)) {
    if (!DRY_RUN) writeFileSync(path, template)
    written.push('CLAUDE.md')
    return
  }

  const existing = readFileSync(path, 'utf8')
  if (existing.includes(marker)) {
    skipped.push('CLAUDE.md (session-kit section already present)')
    return
  }

  const belowMarker = template.slice(template.indexOf(marker))
  if (!DRY_RUN) {
    writeFileSync(path, existing.replace(/\s*$/, '') + '\n\n' + belowMarker)
  }
  merged.push('CLAUDE.md (appended the session protocol section)')
}

function handleSettingsJson() {
  const path = join(repoRoot, '.claude', 'settings.json')
  const marketplaceEntry = { source: { source: 'github', repo: 'abeuscher/llm-session-kit' } }
  const pluginKey = 'session-kit@abeuscher'

  if (!existsSync(path)) {
    const fresh = {
      extraKnownMarketplaces: { abeuscher: marketplaceEntry },
      enabledPlugins: { [pluginKey]: true },
    }
    if (!DRY_RUN) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify(fresh, null, 2) + '\n')
    }
    written.push('.claude/settings.json')
    return
  }

  const existing = readJsonIfExists(path)
  if (existing === null) {
    skipped.push('.claude/settings.json (not valid JSON — left alone)')
    return
  }

  existing.extraKnownMarketplaces = existing.extraKnownMarketplaces || {}
  existing.enabledPlugins = existing.enabledPlugins || {}
  const alreadyRegistered =
    existing.extraKnownMarketplaces.abeuscher !== undefined && existing.enabledPlugins[pluginKey] !== undefined

  existing.extraKnownMarketplaces.abeuscher = marketplaceEntry
  existing.enabledPlugins[pluginKey] = true

  if (!DRY_RUN) writeFileSync(path, JSON.stringify(existing, null, 2) + '\n')
  merged.push(
    alreadyRegistered
      ? '.claude/settings.json (already registered)'
      : '.claude/settings.json (merged in the marketplace + plugin keys)',
  )
}

function report() {
  console.log('\n' + (DRY_RUN ? 'Would write:' : 'Written:'))
  for (const w of written) console.log('  + ' + w)
  if (merged.length) {
    console.log(DRY_RUN ? 'Would merge:' : 'Merged:')
    for (const m of merged) console.log('  ~ ' + m)
  }
  if (skipped.length) {
    console.log('Skipped (already present):')
    for (const s of skipped) console.log('  - ' + s)
  }
  console.log('\nNext: write sessions/proposal.md, then run /open-session 000.')
}

main()
