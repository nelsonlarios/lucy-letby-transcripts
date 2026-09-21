import type { IngestWarning, TranscriptDocument } from './types'

export function suspiciousReasons(
	document: TranscriptDocument,
	characterCount: number,
	pageStats: { medianPages: number; medianCharsPerPage: number },
) {
	const reasons: Array<string> = []

	if (document.pageCount === 0 || document.blockCount === 0) {
		reasons.push('No extracted text')
	}

	if (
		pageStats.medianPages > 0 &&
		(document.pageCount < pageStats.medianPages * 0.15 ||
			document.pageCount > pageStats.medianPages * 4)
	) {
		reasons.push(
			`Unusual page count (${document.pageCount}; median ${pageStats.medianPages})`,
		)
	}

	const charsPerPage =
		document.pageCount === 0 ? 0 : characterCount / document.pageCount

	if (document.pageCount > 0 && charsPerPage < 80) {
		reasons.push(
			`Very little text per page (${Math.round(charsPerPage)} characters)`,
		)
	}

	if (
		pageStats.medianCharsPerPage > 0 &&
		charsPerPage > pageStats.medianCharsPerPage * 4
	) {
		reasons.push(
			`Unusually dense text (${Math.round(charsPerPage)} characters/page)`,
		)
	}

	return reasons
}

export function median(values: Array<number>) {
	if (values.length === 0) {
		return 0
	}

	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)

	if (sorted.length % 2 === 0) {
		return Math.round((sorted[mid - 1] + sorted[mid]) / 2)
	}

	return sorted[mid]
}

export function formatIngestSummary(input: {
	processed: number
	failed: number
	pageCount: number
	blockCount: number
	speakers: Array<string>
	warnings: Array<IngestWarning>
}) {
	const lines = [
		`${input.processed} transcripts processed`,
		`${input.pageCount} pages`,
		`${input.blockCount} text blocks`,
		`${input.speakers.length} speakers detected`,
		`${input.failed} failures`,
	]

	if (input.warnings.length > 0) {
		lines.push('', 'Flagged documents:')

		for (const warning of input.warnings) {
			lines.push(
				`  Day ${inputPad(warning.day)}  ${warning.filename}  ${warning.reason}`,
			)
		}
	}

	return lines.join('\n')
}

function inputPad(day: number) {
	return String(day).padStart(3, ' ')
}
