import { passageId } from './ids'
import {
	isDateHeading,
	isMostlyParenthetical,
	joinWrappedLines,
} from './text'
import type { PageLine, TranscriptBlock, TranscriptBlockType } from './types'

const SPEAKER_PATTERN =
	/^(?<speaker>(?:(?:MR|MRS|MS|MISS|DR|PROF|PROFESSOR|DAME|LADY|SIR|THE)\s+)?(?:JUSTICE\s+)?[A-Z][A-Z'’\-]{1,}(?:\s+[A-Z][A-Z'’\-]{1,}){0,4}):(?:\s+(?<rest>[\s\S]*))?$/

const QA_PATTERN = /^(?<speaker>Q|A|QUESTION|ANSWER)[.:]\s*(?<rest>[\s\S]*)$/

const HEADING_PATTERN =
	/^(CONTENTS|SUMMING-?UP|Housekeeping|Discussion|Directions to the Jury)$|^(?:Examination-in-chief|Cross-examination|Re-examination|Further (?:examination|cross-examination)|Closing Speech|Opening Speech)\b|\((?:sworn|affirmed|continued|recalled|read)\)\s*$/i

export type ParseCarry = {
	speaker: string | null
}

export function parseSpeakerLine(text: string) {
	const qa = text.match(QA_PATTERN)

	if (qa?.groups) {
		return {
			speaker: qa.groups.speaker,
			rest: (qa.groups.rest ?? '').trim(),
			kind: qa.groups.speaker === 'Q' || qa.groups.speaker === 'QUESTION'
				? ('question' as const)
				: ('answer' as const),
		}
	}

	const match = text.match(SPEAKER_PATTERN)

	if (!match?.groups) {
		return null
	}

	return {
		speaker: match.groups.speaker.replace(/\s+/g, ' ').trim(),
		rest: (match.groups.rest ?? '').trim(),
		kind: 'speaker' as const,
	}
}

export function isHeadingLine(text: string) {
	if (parseSpeakerLine(text)) {
		return false
	}

	if (isMostlyParenthetical(text)) {
		return false
	}

	if (isDateHeading(text)) {
		return true
	}

	return HEADING_PATTERN.test(text)
}

export function isStageDirectionLine(text: string) {
	return isMostlyParenthetical(text)
}

function median(values: Array<number>) {
	if (values.length === 0) {
		return 14
	}

	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)

	if (sorted.length % 2 === 0) {
		return (sorted[mid - 1] + sorted[mid]) / 2
	}

	return sorted[mid]
}

function paragraphBreakThreshold(lines: Array<PageLine>) {
	const gaps: Array<number> = []

	for (let index = 1; index < lines.length; index += 1) {
		const gap = Math.abs(lines[index - 1].y - lines[index].y)

		if (gap > 2) {
			gaps.push(gap)
		}
	}

	const typical = median(gaps.filter((gap) => gap < 22))
	return Math.max(20, typical * 1.65)
}

type OpenBlock = {
	type: TranscriptBlockType
	speaker?: string
	lines: Array<string>
}

function flushBlock(
	open: OpenBlock | null,
	page: number,
	blockIndex: number,
): TranscriptBlock | null {
	if (!open) {
		return null
	}

	const text = joinWrappedLines(open.lines)

	if (!text) {
		return null
	}

	const block: TranscriptBlock = {
		id: passageId(page, blockIndex),
		type: open.type,
		text,
		page,
	}

	if (open.speaker) {
		block.speaker = open.speaker
	}

	return block
}

export function buildPageBlocks(
	lines: Array<PageLine>,
	page: number,
	carry: ParseCarry,
) {
	const blocks: Array<TranscriptBlock> = []
	const breakAt = paragraphBreakThreshold(lines)
	let open: OpenBlock | null = null
	let speaker = carry.speaker

	function pushOpen() {
		const block = flushBlock(open, page, blocks.length + 1)

		if (block) {
			blocks.push(block)
		}

		open = null
	}

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index]
		const text = line.text
		const previous = lines[index - 1]
		const gap = previous ? Math.abs(previous.y - line.y) : 999
		const speakerLine = parseSpeakerLine(text)
		const heading = isHeadingLine(text)
		const stage = isStageDirectionLine(text)
		const hardBreak = gap >= breakAt

		if (stage) {
			pushOpen()
			speaker = null
			open = {
				type: 'stageDirection',
				lines: [text],
			}
			pushOpen()
			continue
		}

		if (heading) {
			pushOpen()
			speaker = null
			open = {
				type: 'heading',
				lines: [text],
			}
			pushOpen()
			continue
		}

		if (speakerLine) {
			pushOpen()
			speaker = speakerLine.speaker
			open = {
				type: 'speaker',
				speaker: speakerLine.speaker,
				lines: speakerLine.rest ? [speakerLine.rest] : [],
			}
			continue
		}

		if (!open || hardBreak) {
			pushOpen()
			open = {
				type: 'paragraph',
				speaker: speaker ?? undefined,
				lines: [text],
			}
			continue
		}

		open.lines.push(text)
	}

	pushOpen()

	return {
		blocks,
		carry: { speaker },
	}
}

export function collectSpeakers(blocks: Array<TranscriptBlock>) {
	const speakers: Array<string> = []
	const seen = new Set<string>()

	for (const block of blocks) {
		if (!block.speaker || seen.has(block.speaker)) {
			continue
		}

		seen.add(block.speaker)
		speakers.push(block.speaker)
	}

	return speakers
}
