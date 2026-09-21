export const PREFS_KEY = 'letby.reader.prefs'
export const READING_KEY = 'letby.reading'
export const BOOKMARKS_KEY = 'letby.bookmarks'

export type ReaderTheme = 'white' | 'paper' | 'sepia' | 'grey' | 'dark'
export type ReaderFont = 'serif' | 'sans'

export type ReaderPrefs = {
	font: ReaderFont
	fontSize: number
	lineHeight: number
	measure: number
	theme: ReaderTheme
}

export type ReadingPosition = {
	day: number
	passageId: string | null
	updatedAt: number
}

export const DEFAULT_PREFS: ReaderPrefs = {
	font: 'serif',
	fontSize: 19,
	lineHeight: 1.62,
	measure: 62,
	theme: 'paper',
}

const THEMES: Array<ReaderTheme> = ['white', 'paper', 'sepia', 'grey', 'dark']
const FONTS: Array<ReaderFont> = ['serif', 'sans']

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

export function isDarkTheme(theme: ReaderTheme) {
	return theme === 'dark'
}

export function parsePrefs(value: unknown): ReaderPrefs {
	if (!value || typeof value !== 'object') {
		return { ...DEFAULT_PREFS }
	}

	const record = value as Record<string, unknown>
	const font = FONTS.includes(record.font as ReaderFont)
		? (record.font as ReaderFont)
		: DEFAULT_PREFS.font
	const theme = THEMES.includes(record.theme as ReaderTheme)
		? (record.theme as ReaderTheme)
		: DEFAULT_PREFS.theme

	return {
		font,
		theme,
		fontSize: clamp(Number(record.fontSize) || DEFAULT_PREFS.fontSize, 16, 28),
		lineHeight: clamp(
			Number(record.lineHeight) || DEFAULT_PREFS.lineHeight,
			1.35,
			2,
		),
		measure: clamp(Number(record.measure) || DEFAULT_PREFS.measure, 48, 78),
	}
}

export function loadPrefs(): ReaderPrefs {
	try {
		const raw = localStorage.getItem(PREFS_KEY)
		return parsePrefs(raw ? JSON.parse(raw) : null)
	} catch {
		return { ...DEFAULT_PREFS }
	}
}

export function savePrefs(prefs: ReaderPrefs) {
	localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function loadReadingPosition(): ReadingPosition | null {
	try {
		const raw = localStorage.getItem(READING_KEY)

		if (!raw) {
			return null
		}

		const parsed = JSON.parse(raw) as ReadingPosition

		if (!parsed.day) {
			return null
		}

		return parsed
	} catch {
		return null
	}
}

export function saveReadingPosition(position: ReadingPosition) {
	localStorage.setItem(READING_KEY, JSON.stringify(position))
}

export type Bookmark = {
	id: string
	day: number
	passageId: string
	page: number
	title: string
	excerpt: string
	createdAt: number
}

export function loadBookmarks(): Array<Bookmark> {
	try {
		const raw = localStorage.getItem(BOOKMARKS_KEY)
		const parsed = raw ? (JSON.parse(raw) as Array<Bookmark>) : []
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

export function saveBookmarks(bookmarks: Array<Bookmark>) {
	localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
}

export function bookmarkId(day: number, passageId: string) {
	return `${day}:${passageId}`
}
