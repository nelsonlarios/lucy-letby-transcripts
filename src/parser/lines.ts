import { collapseWhitespace } from './text'
import type { PageLine } from './types'

type PdfTextItem = {
	str: string
	transform: Array<number>
	width: number
	height: number
	hasEOL?: boolean
}

const LINE_Y_TOLERANCE = 2.4

export function reconstructLines(
	items: Array<PdfTextItem>,
	page: number,
): Array<PageLine> {
	const rows: Array<{ y: number; parts: Array<{ x: number; text: string }> }> =
		[]

	for (const item of items) {
		if (!item.str) {
			continue
		}

		const x = item.transform[4]
		const y = item.transform[5]
		const existing = rows.find(
			(row) => Math.abs(row.y - y) <= LINE_Y_TOLERANCE,
		)

		if (existing) {
			existing.parts.push({ x, text: item.str })
			existing.y =
				(existing.y * (existing.parts.length - 1) + y) /
				existing.parts.length
		} else {
			rows.push({
				y,
				parts: [{ x, text: item.str }],
			})
		}
	}

	rows.sort((a, b) => b.y - a.y)

	const lines: Array<PageLine> = []

	for (const row of rows) {
		row.parts.sort((a, b) => a.x - b.x)
		const text = collapseWhitespace(
			row.parts.map((part) => part.text).join(''),
		)

		if (!text) {
			continue
		}

		lines.push({
			text,
			y: row.y,
			page,
		})
	}

	return mergeWrappedParentheticals(lines)
}

function unmatchedOpens(text: string) {
	let count = 0

	for (const character of text) {
		if (character === '(') {
			count += 1
		}

		if (character === ')') {
			count = Math.max(0, count - 1)
		}
	}

	return count
}

export function mergeWrappedParentheticals(lines: Array<PageLine>) {
	const merged: Array<PageLine> = []

	for (const line of lines) {
		const current = merged.at(-1)

		if (
			current &&
			unmatchedOpens(current.text) > 0 &&
			current.page === line.page
		) {
			current.text = collapseWhitespace(`${current.text} ${line.text}`)
			continue
		}

		merged.push({ ...line })
	}

	return merged
}
