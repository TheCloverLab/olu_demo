import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function runGit(command, fallback) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim() || fallback
  } catch {
    return fallback
  }
}

const commitCount = runGit('git rev-list --count HEAD', '0')
const shortSha = runGit('git rev-parse --short HEAD', 'nogit')
const dirtyMarker = runGit('git status --porcelain', '') ? '-dirty' : ''
const outputPath = resolve('src/lib/version.ts')

let version = `v${commitCount}-${shortSha}${dirtyMarker}`

if (shortSha === 'nogit') {
  try {
    const existing = readFileSync(outputPath, 'utf8')
    const match = existing.match(/APP_VERSION = '([^']+)'/)
    if (match?.[1] && match[1] !== 'dev') {
      version = match[1]
    }
  } catch {
    // Fall back to the derived no-git version.
  }
}

writeFileSync(outputPath, `export const APP_VERSION = '${version}'\n`)

console.log(`Wrote ${outputPath} with ${version}`)
