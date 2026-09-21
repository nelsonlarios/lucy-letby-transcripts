import type { TranscriptManifest, TranscriptManifestEntry } from '../parser/types'

export function adjacentDays(
	days: Array<number>,
	current: number,
) {
	const sorted = [...days].sort((a, b) => a - b)
	const index = sorted.indexOf(current)

	return {
		previous: index > 0 ? sorted[index - 1] : undefined,
		next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined,
	}
}

export function findTranscript(
	manifest: TranscriptManifest,
	day: number,
) {
	return manifest.transcripts.find((entry) => entry.day === day) ?? null
}

export function nearestTranscripts(
	manifest: TranscriptManifest,
	day: number,
) {
	const sorted = [...manifest.transcripts].sort((a, b) => a.day - b.day)
	const earlier = [...sorted].reverse().find((entry) => entry.day < day)
	const later = sorted.find((entry) => entry.day > day)

	return { earlier, later }
}

export function groupedSections(manifest: TranscriptManifest) {
	return manifest.sections.map((section) => ({
		name: section.name,
		transcripts: section.days
			.map((day) => findTranscript(manifest, day))
			.filter((entry): entry is TranscriptManifestEntry => entry !== null),
	}))
}

export function citationFor(
	entry: Pick<TranscriptManifestEntry, 'day' | 'date'>,
	page: number,
) {
	return `${formatDayCitation(entry.day)} — ${formatCitationDate(entry.date)} — p. ${page}`
}

function formatDayCitation(day: number) {
	return `Day ${day}`
}

function formatCitationDate(isoDate: string) {
	const [year, month, day] = isoDate.split('-').map(Number)

	if (!year || !month || !day) {
		return isoDate
	}

	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(year, month - 1, day))
}
