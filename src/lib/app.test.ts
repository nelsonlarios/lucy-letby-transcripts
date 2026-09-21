import { describe, expect, test } from 'vitest'
import { adjacentDays, citationFor } from './navigation'
import { parseQueryTerms, highlightParts } from './highlight'
import { parsePrefs, bookmarkId, DEFAULT_PREFS } from './storage'
import { searchResultPath } from '../parser/ids'

describe('adjacent transcript navigation', () => {
	test('skips missing sitting days', () => {
		expect(adjacentDays([1, 2, 3, 4, 86, 88], 86)).toEqual({
			previous: 4,
			next: 88,
		})
		expect(adjacentDays([1, 2, 3], 1)).toEqual({
			previous: undefined,
			next: 2,
		})
	})
})

describe('search result links', () => {
	test('open the matching source page with the query preserved', () => {
		expect(searchResultPath(68, 23, 'insulin')).toBe(
			'/transcripts/68?q=insulin#p23',
		)
	})
})

describe('query highlighting', () => {
	test('handles multiple words and quoted phrases', () => {
		expect(parseQueryTerms('insulin "air embolus"')).toEqual([
			'insulin',
			'air embolus',
		])
		const parts = highlightParts('The insulin infusion and insulin level', 'insulin')
		expect(parts.filter((part) => part.match).map((part) => part.text)).toEqual([
			'insulin',
			'insulin',
		])
	})
})

describe('reader preferences', () => {
	test('rehydrates stored settings and rejects invalid values', () => {
		expect(
			parsePrefs({
				font: 'sans',
				fontSize: 22,
				lineHeight: 1.8,
				measure: 70,
				theme: 'dark',
			}),
		).toEqual({
			font: 'sans',
			fontSize: 22,
			lineHeight: 1.8,
			measure: 70,
			theme: 'dark',
		})
		expect(parsePrefs({ font: 'comic', theme: 'neon', fontSize: 99 })).toEqual({
			...DEFAULT_PREFS,
			fontSize: 28,
		})
	})

	test('bookmark ids are stable per passage', () => {
		expect(bookmarkId(68, 'p23-b7')).toBe('68:p23-b7')
	})
})

describe('citations', () => {
	test('include day, date and source page', () => {
		expect(citationFor({ day: 68, date: '2023-02-10' }, 23)).toBe(
			'Day 68 — 10 February 2023 — p. 23',
		)
	})
})
