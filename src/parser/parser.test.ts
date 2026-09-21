import { describe, expect, test } from 'vitest'
import { pagefindPathToLocation, parsePassageId, passageId, searchResultPath } from './ids'
import { reconstructLines } from './lines'
import { buildPageBlocks, parseSpeakerLine } from './structure'
import { joinWrappedLines } from './text'

describe('passage IDs', () => {
	test('create and parse stable passage identifiers', () => {
		expect(passageId(23, 7)).toBe('p23-b7')
		expect(parsePassageId('p23-b7')).toEqual({ page: 23, block: 7 })
		expect(parsePassageId('nope')).toBeNull()
	})

	test('map pagefind URLs and search results onto reader links', () => {
		expect(pagefindPathToLocation('/d/068/p/023.html')).toEqual({
			day: 68,
			page: 23,
		})
		expect(searchResultPath(68, 23, 'insulin')).toBe(
			'/transcripts/68?q=insulin#p23',
		)
	})
})

describe('line joining', () => {
	test('joins wrapped lines and repairs split dashes', () => {
		expect(
			joinWrappedLines([
				'They are not in court yet, my Lord -',
				'-',
			]),
		).toBe('They are not in court yet, my Lord —')

		expect(
			joinWrappedLines([
				'piles of paperwork -',
				'- and of course you can instantly',
			]),
		).toBe('piles of paperwork — and of course you can instantly')

		expect(joinWrappedLines(['environ-', 'mental benefits'])).toBe(
			'environmental benefits',
		)
	})
})

describe('structure', () => {
	test('detects speakers, continuation, headings and stage directions', () => {
		expect(parseSpeakerLine('MR JUSTICE GOSS: I am sorry')).toEqual({
			speaker: 'MR JUSTICE GOSS',
			rest: 'I am sorry',
			kind: 'speaker',
		})
		expect(parseSpeakerLine('BOHIN: Yes.')).toMatchObject({
			speaker: 'BOHIN',
			rest: 'Yes.',
		})
		expect(parseSpeakerLine('Agreed fact number 1 reads:')).toBeNull()

		const parsed = buildPageBlocks(
			[
				{ text: 'Friday, 14 October 2022', y: 800, page: 1 },
				{ text: '(10.30 am)', y: 770, page: 1 },
				{ text: 'DR DEWI EVANS (sworn)', y: 730, page: 1 },
				{
					text: 'Examination-in-chief by MR DRIVER',
					y: 700,
					page: 1,
				},
				{
					text: 'MR JUSTICE GOSS: I am sorry that the court is sitting slightly',
					y: 650,
					page: 1,
				},
				{
					text: 'late but I have a lot of material to look at.',
					y: 636,
					page: 1,
				},
				{
					text: 'I thought it important for the court to assemble.',
					y: 608,
					page: 1,
				},
				{ text: 'MR JOHNSON: Yes, thank you.', y: 580, page: 1 },
				{ text: '(A short adjournment)', y: 540, page: 1 },
			],
			1,
			{ speaker: null },
		)

		expect(parsed.blocks.map((block) => block.type)).toEqual([
			'heading',
			'stageDirection',
			'heading',
			'heading',
			'speaker',
			'paragraph',
			'speaker',
			'stageDirection',
		])
		expect(parsed.blocks[4]).toMatchObject({
			id: 'p1-b5',
			speaker: 'MR JUSTICE GOSS',
			text: 'I am sorry that the court is sitting slightly late but I have a lot of material to look at.',
		})
		expect(parsed.blocks[5]).toMatchObject({
			type: 'paragraph',
			speaker: 'MR JUSTICE GOSS',
		})
		expect(parsed.carry.speaker).toBeNull()
	})

	test('carries a speaker across a page boundary', () => {
		const first = buildPageBlocks(
			[
				{
					text: 'MR MYERS: We provided the note yesterday evening.',
					y: 120,
					page: 1,
				},
			],
			1,
			{ speaker: null },
		)
		const second = buildPageBlocks(
			[
				{
					text: 'That has been blown away by what has happened.',
					y: 760,
					page: 2,
				},
			],
			2,
			first.carry,
		)

		expect(second.blocks[0]).toMatchObject({
			id: 'p2-b1',
			type: 'paragraph',
			speaker: 'MR MYERS',
		})
	})
})

describe('PDF line reconstruction', () => {
	test('groups items on the same baseline', () => {
		const lines = reconstructLines(
			[
				{
					str: 'MR ',
					transform: [0, 0, 0, 0, 67, 650],
					width: 20,
					height: 12,
				},
				{
					str: 'JOHNSON:',
					transform: [0, 0, 0, 0, 88, 650.4],
					width: 40,
					height: 12,
				},
				{
					str: ' Yes.',
					transform: [0, 0, 0, 0, 140, 650],
					width: 20,
					height: 12,
				},
				{
					str: '(Pause)',
					transform: [0, 0, 0, 0, 67, 610],
					width: 40,
					height: 12,
				},
			],
			4,
		)

		expect(lines.map((line) => line.text)).toEqual([
			'MR JOHNSON: Yes.',
			'(Pause)',
		])
	})
})
