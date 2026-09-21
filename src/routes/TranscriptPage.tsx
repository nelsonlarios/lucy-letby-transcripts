import { Drawer } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { useCallback, useEffect, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { DocumentTitle } from '../components/DocumentTitle'
import { Reader } from '../components/Reader'
import { ReaderSettings } from '../components/ReaderSettings'
import { TranscriptNav } from '../components/TranscriptNav'
import { loadManifest, loadTranscript } from '../lib/api'
import { formatDayLabel, formatLongDate } from '../lib/dates'
import { adjacentDays, findTranscript, nearestTranscripts } from '../lib/navigation'
import { originalPdfPath, transcriptPath } from '../parser/ids'
import { usePrefs } from '../lib/prefs'
import {
	loadBookmarks,
	saveBookmarks,
	saveReadingPosition,
	type Bookmark,
	type ReaderPrefs,
} from '../lib/storage'
import { PdfIcon } from '../components/Icons'
import type { TranscriptDocument, TranscriptManifest } from '../parser/types'

export function TranscriptPage() {
	const { day: dayParam } = useParams()
	const location = useLocation()
	const [searchParams] = useSearchParams()
	const day = Number(dayParam)
	const query = searchParams.get('q') ?? undefined
	const [manifest, setManifest] = useState<TranscriptManifest | null>(null)
	const [transcript, setTranscript] = useState<TranscriptDocument | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [missing, setMissing] = useState(false)
	const { prefs, setPrefs } = usePrefs()
	const [bookmarks, setBookmarks] = useState<Array<Bookmark>>(() =>
		loadBookmarks(),
	)
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [navOpen, setNavOpen] = useState(false)
	const [toast, setToast] = useState<string | null>(null)
	const compact = useMediaQuery('(max-width: 768px)')
	const entry = manifest ? findTranscript(manifest, day) : null
	const adjacent = manifest
		? adjacentDays(
				manifest.transcripts.map((item) => item.day),
				day,
			)
		: { previous: undefined, next: undefined }

	useEffect(() => {
		let cancelled = false
		setError(null)
		setMissing(false)
		setTranscript(null)

		Promise.all([loadManifest(), loadTranscript(day)])
			.then(([loadedManifest, loadedTranscript]) => {
				if (cancelled) {
					return
				}

				setManifest(loadedManifest)

				if (!loadedTranscript) {
					setMissing(true)
					return
				}

				setTranscript(loadedTranscript)
			})
			.catch((caught: unknown) => {
				if (!cancelled) {
					setError(
						caught instanceof Error
							? caught.message
							: 'The transcript could not be loaded.',
					)
				}
			})

		return () => {
			cancelled = true
		}
	}, [day])

	const onPosition = useCallback(
		(passageId: string) => {
			saveReadingPosition({
				day,
				passageId,
				updatedAt: Date.now(),
			})
		},
		[day],
	)

	function updatePrefs(next: ReaderPrefs) {
		setPrefs(next)
	}

	function notify(message: string) {
		setToast(message)
		window.setTimeout(() => setToast(null), 1600)
	}

	function updateBookmarks(next: Array<Bookmark>) {
		setBookmarks(next)
		saveBookmarks(next)
	}

	if (!Number.isInteger(day) || day < 1) {
		return (
			<>
				<AppHeader />
				<main className="status">No transcript for that day.</main>
			</>
		)
	}

	if (missing && manifest) {
		const nearby = nearestTranscripts(manifest, day)

		return (
			<>
				<AppHeader />
				<main className="page">
					<DocumentTitle title={`Day ${day} unavailable`} />
					<h1 className="index-heading">No transcript for day {day}</h1>
					<p className="lede">
						That sitting day is not in this archive. The missing days are
						gaps in the published set.
					</p>
					<p>
						{nearby.earlier ? (
							<Link to={transcriptPath(nearby.earlier.day)}>
								{formatDayLabel(nearby.earlier.day)}
							</Link>
						) : null}
						{nearby.earlier && nearby.later ? ' · ' : null}
						{nearby.later ? (
							<Link to={transcriptPath(nearby.later.day)}>
								{formatDayLabel(nearby.later.day)}
							</Link>
						) : null}
					</p>
				</main>
			</>
		)
	}

	return (
		<div data-reader-theme={prefs.theme}>
			<a className="skip-link" href="#content">
				Skip to content
			</a>
			<AppHeader onOpenNav={() => setNavOpen(true)} />
			{manifest && entry && transcript ? (
				<div className="reader-shell">
					<DocumentTitle
						title={`${formatDayLabel(entry.day)} · ${entry.title}`}
					/>
					<aside className="reader-nav">
						<TranscriptNav manifest={manifest} currentDay={day} />
					</aside>
					<main className="reader-main" id="content">
						<div className="reader-chrome">
							<div className="reader-chrome__meta">
								<div className="reader-chrome__day">
									{formatDayLabel(entry.day)}
								</div>
								<span className="reader-chrome__title">{entry.title}</span>
							</div>
							<div className="reader-actions">
								<button
									type="button"
									className="ghost-button type-button"
									onClick={() => setSettingsOpen(true)}
									aria-label="Reading settings"
								>
									Aa
								</button>
								<a
									className="ghost-button"
									href={originalPdfPath(entry.filename)}
									target="_blank"
									rel="noreferrer"
								>
									<PdfIcon />
									<span>PDF</span>
								</a>
							</div>
						</div>
						<header className="reader-toolbar">
							<div>
								<p className="reader-meta">
									{formatLongDate(entry.date)} · {entry.section}
								</p>
								<h1>{entry.title}</h1>
								<p className="reader-meta">
									{adjacent.previous ? (
										<Link to={transcriptPath(adjacent.previous)}>
											Previous day
										</Link>
									) : (
										<span>Previous day</span>
									)}
									{' · '}
									{adjacent.next ? (
										<Link to={transcriptPath(adjacent.next)}>Next day</Link>
									) : (
										<span>Next day</span>
									)}
								</p>
							</div>
						</header>
						<Reader
							document={transcript}
							prefs={prefs}
							query={query}
							initialHash={location.hash}
							bookmarks={bookmarks}
							onPosition={onPosition}
							onCopyNotice={notify}
							onBookmarksChange={updateBookmarks}
						/>
					</main>
				</div>
			) : (
				<main className="status">
					{error ?? 'Loading transcript…'}
				</main>
			)}

			<Drawer
				opened={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				position={compact ? 'bottom' : 'right'}
				title="Reading settings"
				padding="lg"
				size={compact ? 280 : '22rem'}
			>
				<ReaderSettings prefs={prefs} onChange={updatePrefs} />
			</Drawer>
			<Drawer
				opened={navOpen}
				onClose={() => setNavOpen(false)}
				position="left"
				title="Trial days"
				padding={0}
				size="18rem"
			>
				{manifest ? (
					<TranscriptNav manifest={manifest} currentDay={day} />
				) : null}
			</Drawer>
			{toast ? <div className="toast" role="status">{toast}</div> : null}
		</div>
	)
}
