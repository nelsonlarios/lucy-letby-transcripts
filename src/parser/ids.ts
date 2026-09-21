export function passageId(page: number, blockIndex: number) {
	return `p${page}-b${blockIndex}`
}

export function parsePassageId(id: string) {
	const match = id.match(/^p(\d+)-b(\d+)$/)

	if (!match) {
		return null
	}

	return {
		page: Number(match[1]),
		block: Number(match[2]),
	}
}

export function pageAnchor(page: number) {
	return `p${page}`
}

export function parsePageAnchor(hash: string) {
	const value = hash.replace(/^#/, '')
	const passage = parsePassageId(value)

	if (passage) {
		return passage
	}

	const pageMatch = value.match(/^p(\d+)$/)

	if (!pageMatch) {
		return null
	}

	return {
		page: Number(pageMatch[1]),
		block: null,
	}
}

export function transcriptPath(day: number, hash?: string) {
	const path = `/transcripts/${day}`

	if (!hash) {
		return path
	}

	return `${path}#${hash.replace(/^#/, '')}`
}

export function originalPdfPath(filename: string) {
	return `/originals/${filename}`
}

export function transcriptDataPath(day: number) {
	return `/data/transcripts/${day}.json`
}

export function pagefindPathToLocation(url: string) {
	const match = url.match(/\/d\/(\d+)\/p\/(\d+)/)

	if (!match) {
		return null
	}

	return {
		day: Number(match[1]),
		page: Number(match[2]),
	}
}

export function searchResultPath(day: number, page: number, query: string) {
	const params = new URLSearchParams({ q: query })
	return `/transcripts/${day}?${params.toString()}#${pageAnchor(page)}`
}
