const MONTHS =
	'January|February|March|April|May|June|July|August|September|October|November|December'

export function collapseWhitespace(value: string) {
	return value.replace(/[ \t\u00a0]+/g, ' ').trim()
}

export function joinWrappedLines(lines: Array<string>) {
	if (lines.length === 0) {
		return ''
	}

	let result = lines[0].trimEnd()

	for (const raw of lines.slice(1)) {
		const next = raw.trim()

		if (!next) {
			continue
		}

		if (/[‐–—-]$/.test(result) && /^[‐–—-]/.test(next)) {
			result =
				result.replace(/[‐–—-]+$/, '').trimEnd() +
				' — ' +
				next.replace(/^[‐–—-]+/, '').trimStart()
			continue
		}

		if (result.endsWith('-') && /^[a-zà-öø-ÿ]/.test(next)) {
			result = result.slice(0, -1) + next
			continue
		}

		result = `${result} ${next}`
	}

	return collapseWhitespace(result)
}

export function isMostlyParenthetical(text: string) {
	return /^\([^()]*(?:\([^()]*\)[^()]*)*\)$/.test(text)
}

export function isDateHeading(text: string) {
	return (
		new RegExp(
			`^(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS}),?\\s+\\d{4}$`,
			'i',
		).test(text) ||
		new RegExp(`^\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4}$`, 'i').test(text)
	)
}

export function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
}

export function uniqueInOrder(values: Array<string>) {
	const seen = new Set<string>()
	const result: Array<string> = []

	for (const value of values) {
		if (seen.has(value)) {
			continue
		}

		seen.add(value)
		result.push(value)
	}

	return result
}
