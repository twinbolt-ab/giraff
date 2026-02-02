// Parse changelog data generated at build time

import changelogData from './changelog-data.json'

export interface ChangelogEntry {
  version: string
  date: string
  summary: string
  improvements: string[]
  bugFixes: string[]
  newFeatures: string[]
  technical: string[]
}

interface ChangelogData {
  generatedAt: string
  entries: ChangelogEntry[]
}

const data = changelogData as ChangelogData

function isWithinDays(dateStr: string, days: number): boolean {
  const entryDate = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - entryDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= days
}

export function getRecentNews(withinDays: number = 30): ChangelogEntry[] {
  return data.entries.filter((entry) => isWithinDays(entry.date, withinDays))
}

export function hasRecentNews(withinDays: number = 30): boolean {
  return getRecentNews(withinDays).length > 0
}

export function getLatestEntry(): ChangelogEntry | null {
  return data.entries[0] || null
}
