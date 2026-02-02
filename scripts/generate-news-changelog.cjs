#!/usr/bin/env node

/**
 * Generates src/lib/changelog-data.json from CHANGELOG.md
 * Used by release.sh to include latest news in the app
 */

const fs = require('fs')
const path = require('path')

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md')
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'lib', 'changelog-data.json')

function extractSection(content, sectionName) {
  const regex = new RegExp(`\\*\\*${sectionName}\\*\\*\\s*\\n([\\s\\S]*?)(?=\\*\\*|$)`, 'i')
  const match = content.match(regex)
  if (!match) return []

  return match[1]
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter((line) => line.length > 0)
}

function parseChangelog(raw) {
  const entries = []
  const versionRegex = /## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/g

  let match
  const positions = []

  while ((match = versionRegex.exec(raw)) !== null) {
    positions.push({
      version: match[1],
      date: match[2],
      start: match.index + match[0].length,
    })
  }

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    // Find the start of the next version header (## [) to determine where this entry ends
    const nextHeaderMatch = raw.slice(pos.start).match(/\n## \[/)
    const endIndex = nextHeaderMatch ? pos.start + nextHeaderMatch.index : raw.length
    const content = raw.slice(pos.start, endIndex).trim()

    // Extract summary (first paragraph before any ** section)
    const summaryMatch = content.match(/^([^*\n]+(?:\n[^*\n]+)*)/m)
    const summary = summaryMatch ? summaryMatch[1].trim() : ''

    // Extract sections
    const improvements = extractSection(content, 'Improvements')
    const bugFixes = extractSection(content, 'Bug Fix(?:es)?')
    const newFeatures = extractSection(content, 'New Features')
    const technical = extractSection(content, 'Technical')

    entries.push({
      version: pos.version,
      date: pos.date,
      summary,
      improvements,
      bugFixes,
      newFeatures,
      technical,
    })
  }

  return entries
}

function main() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error('CHANGELOG.md not found at', CHANGELOG_PATH)
    process.exit(1)
  }

  const raw = fs.readFileSync(CHANGELOG_PATH, 'utf-8')
  const entries = parseChangelog(raw)

  // Only keep entries from the last 60 days for smaller bundle size
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const recentEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= sixtyDaysAgo
  })

  const output = {
    generatedAt: new Date().toISOString(),
    entries: recentEntries,
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
  console.log(`Generated ${OUTPUT_PATH} with ${recentEntries.length} entries`)
}

main()
