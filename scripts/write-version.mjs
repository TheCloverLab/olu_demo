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
const envShortSha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 7)

let version = `v${commitCount}-${shortSha}${dirtyMarker}`

if (shortSha === 'nogit') {
  try {
    const existing = readFileSync(outputPath, 'utf8')
    const match = existing.match(/APP_VERSION = '([^']+)'/)
    if (envShortSha) {
      const existingCount = match?.[1]?.match(/^v(\d+)-/)?.[1] || '0'
      version = `v${existingCount}-${envShortSha}`
    } else if (match?.[1] && match[1] !== 'dev') {
      version = match[1]
    }
  } catch {
    if (envShortSha) {
      version = `v0-${envShortSha}`
    }
  }
}

writeFileSync(outputPath, `export const APP_VERSION = '${version}'\n`)

console.log(`Wrote ${outputPath} with ${version}`)
