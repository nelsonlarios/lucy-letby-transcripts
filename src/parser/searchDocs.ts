import { escapeHtml } from './text'
import type { TranscriptDocument } from './types'

export function searchDocumentHtml(
	transcript: TranscriptDocument,
	pageNumber: number,
) {
	const page = transcript.pages.find((entry) => entry.page === pageNumber)

	if (!page) {
		return null
	}

	const body = page.blocks
		.map((block) => {
			const speaker = block.speaker
				? `<span data-speaker="${escapeHtml(block.speaker)}">${escapeHtml(block.speaker)}: </span>`
				: ''
			return `<p id="${escapeHtml(block.id)}">${speaker}${escapeHtml(block.text)}</p>`
		})
		.join('\n')

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Day ${transcript.day} — ${escapeHtml(transcript.title)} — p. ${pageNumber}</title>
	<meta data-pagefind-meta="day:${transcript.day}">
	<meta data-pagefind-meta="date:${escapeHtml(transcript.date)}">
	<meta data-pagefind-meta="title:${escapeHtml(transcript.title)}">
	<meta data-pagefind-meta="section:${escapeHtml(transcript.section)}">
	<meta data-pagefind-meta="page:${pageNumber}">
	<meta data-pagefind-meta="filename:${escapeHtml(transcript.filename)}">
</head>
<body>
	<div data-pagefind-ignore>
		<p data-pagefind-filter="section">${escapeHtml(transcript.section)}</p>
		<p data-pagefind-filter="day">${transcript.day}</p>
	</div>
	<article data-pagefind-body>
		${body}
	</article>
</body>
</html>
`
}

export function searchDocumentPath(day: number, page: number) {
	return `d/${String(day).padStart(3, '0')}/p/${String(page).padStart(3, '0')}.html`
}
