import type { TranscriptDocument } from '../parser/types'

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseQueryTerms(query: string) {
	const terms: Array<string> = []
	const pattern = /"([^"]+)"|(\S+)/g

	for (const match of query.matchAll(pattern)) {
		const term = (match[1] ?? match[2] ?? '').trim()

		if (term.length > 1) {
			terms.push(term)
		}
	}

	return terms
}

export function highlightParts(text: string, query: string) {
	const terms = parseQueryTerms(query)

	if (terms.length === 0) {
		return [{ text, match: false }]
	}

	const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
	const parts: Array<{ text: string; match: boolean }> = []
	let last = 0

	for (const match of text.matchAll(pattern)) {
		const index = match.index ?? 0

		if (index > last) {
			parts.push({ text: text.slice(last, index), match: false })
		}

		parts.push({ text: match[0], match: true })
		last = index + match[0].length
	}

	if (last < text.length) {
		parts.push({ text: text.slice(last), match: false })
	}

	return parts.length > 0 ? parts : [{ text, match: false }]
}

export function textMatches(text: string, query: string) {
	return highlightParts(text, query).some((part) => part.match)
}

export function findMatchingPassages(
	document: TranscriptDocument,
	query: string,
) {
	if (!parseQueryTerms(query).length) {
		return []
	}

	return document.pages.flatMap((page) =>
		page.blocks
			.filter((block) => textMatches(block.text, query) || textMatches(block.speaker ?? '', query))
			.map((block) => block.id),
	)
}
