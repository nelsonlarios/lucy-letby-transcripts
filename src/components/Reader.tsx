import { useEffect, useMemo, useRef, useState } from 'react'
import { PassageBlock } from './PassageBlock'
import { findMatchingPassages, parseQueryTerms } from '../lib/highlight'
import { citationFor } from '../lib/navigation'
import { bookmarkId, type Bookmark } from '../lib/storage'
import { pageAnchor } from '../parser/ids'
import type { TranscriptDocument } from '../parser/types'
import type { ReaderPrefs } from '../lib/storage'
import { CloseIcon, SearchIcon } from './Icons'

export function Reader({
	document: transcript,
	prefs,
	query,
	initialHash,
	bookmarks,
	onPosition,
	onCopyNotice,
	onBookmarksChange,
}: {
	document: TranscriptDocument
	prefs: ReaderPrefs
	query?: string
	initialHash?: string
	bookmarks: Array<Bookmark>
	onPosition: (passageId: string) => void
	onCopyNotice: (message: string) => void
	onBookmarksChange: (bookmarks: Array<Bookmark>) => void
}) {
	const [findOpen, setFindOpen] = useState(false)
	const [findQuery, setFindQuery] = useState(query ?? '')
	const [findIndex, setFindIndex] = useState(0)
	const [flashId, setFlashId] = useState<string | null>(null)
	const observerRef = useRef<IntersectionObserver | null>(null)

	useEffect(() => {
		if (query) {
			setFindQuery(query)
		}
	}, [query])

	const matches = useMemo(
		() => findMatchingPassages(transcript, findQuery),
		[transcript, findQuery],
	)

	useEffect(() => {
		if (!initialHash) {
			return
		}

		const id = initialHash.replace(/^#/, '')
		const node = window.document.getElementById(id)

		if (!node) {
			return
		}

		node.scrollIntoView({ block: 'start', behavior: 'auto' })
		setFlashId(id)
		const timer = window.setTimeout(() => setFlashId(null), 1800)
		return () => window.clearTimeout(timer)
	}, [initialHash, transcript.day])

	useEffect(() => {
		observerRef.current?.disconnect()
		observerRef.current = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

				if (visible?.target.id) {
					onPosition(visible.target.id)
				}
			},
			{
				rootMargin: '-20% 0px -70% 0px',
				threshold: 0.01,
			},
		)

		for (const node of window.document.querySelectorAll('.passage[id], .page-rule[id]')) {
			observerRef.current.observe(node)
		}

		return () => observerRef.current?.disconnect()
	}, [transcript.day, onPosition])

	async function copyPassage(blockId: string, page: number, text: string) {
		const citation = citationFor(transcript, page)
		await navigator.clipboard.writeText(`${citation}\n\n${text}`)
		onCopyNotice('Passage copied')
		void blockId
	}

	async function copyLink(blockId: string) {
		const url = `${window.location.origin}/transcripts/${transcript.day}#${blockId}`
		await navigator.clipboard.writeText(url)
		onCopyNotice('Link copied')
	}

	function toggleBookmark(blockId: string, page: number, text: string) {
		const id = bookmarkId(transcript.day, blockId)
		const exists = bookmarks.some((bookmark) => bookmark.id === id)
		const next = exists
			? bookmarks.filter((bookmark) => bookmark.id !== id)
			: [
					{
						id,
						day: transcript.day,
						passageId: blockId,
						page,
						title: transcript.title,
						excerpt: text.slice(0, 180),
						createdAt: Date.now(),
					},
					...bookmarks,
				]

		onBookmarksChange(next)
		onCopyNotice(exists ? 'Bookmark removed' : 'Bookmarked')
	}

	function jumpToMatch(index: number) {
		const id = matches[index]

		if (!id) {
			return
		}

		setFindIndex(index)
		window.document.getElementById(id)?.scrollIntoView({ block: 'center' })
		setFlashId(id)
	}

	const style = {
		['--reader-size' as string]: `${prefs.fontSize}px`,
		['--reader-leading' as string]: String(prefs.lineHeight),
		['--reader-measure' as string]: `${prefs.measure}ch`,
	}

	return (
		<div>
			{findOpen ? (
				<div className="find-bar">
					<SearchIcon />
					<input
						type="search"
						value={findQuery}
						placeholder="Find in this transcript"
						aria-label="Find in this transcript"
						onChange={(event) => {
							setFindQuery(event.target.value)
							setFindIndex(0)
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								const delta = event.shiftKey ? -1 : 1
								const next =
									matches.length === 0
										? 0
										: (findIndex + delta + matches.length) % matches.length
								jumpToMatch(next)
							}

							if (event.key === 'Escape') {
								setFindOpen(false)
							}
						}}
					/>
					<span className="muted">
						{parseQueryTerms(findQuery).length === 0
							? ''
							: matches.length === 0
								? 'No matches'
								: `${Math.min(findIndex + 1, matches.length)} / ${matches.length}`}
					</span>
					<button
						type="button"
						className="ghost-button"
						onClick={() =>
							jumpToMatch(
								matches.length === 0
									? 0
									: (findIndex + matches.length - 1) % matches.length,
							)
						}
					>
						Prev
					</button>
					<button
						type="button"
						className="ghost-button"
						onClick={() =>
							jumpToMatch(
								matches.length === 0 ? 0 : (findIndex + 1) % matches.length,
							)
						}
					>
						Next
					</button>
					<button
						type="button"
						className="icon-button"
						aria-label="Close find"
						onClick={() => setFindOpen(false)}
					>
						<CloseIcon />
					</button>
				</div>
			) : (
				<div className="reader-find-launch">
					<button
						type="button"
						className="ghost-button"
						onClick={() => setFindOpen(true)}
					>
						<SearchIcon />
						Search this transcript
					</button>
				</div>
			)}

			<div
				className="reader"
				data-font={prefs.font}
				style={style}
			>
				{transcript.pages.map((page) => (
					<section key={page.page} aria-label={`Source page ${page.page}`}>
						<p className="page-rule" id={pageAnchor(page.page)}>
							Page {page.page}
						</p>
						{page.blocks.map((block) => (
							<PassageBlock
								key={block.id}
								block={block}
								query={findQuery || query}
								bookmarked={bookmarks.some(
									(bookmark) =>
										bookmark.id === bookmarkId(transcript.day, block.id),
								)}
								active={flashId === block.id}
								onCopy={() => {
									void copyPassage(block.id, block.page, block.text)
								}}
								onLink={() => {
									void copyLink(block.id)
								}}
								onBookmark={() =>
									toggleBookmark(block.id, block.page, block.text)
								}
							/>
						))}
					</section>
				))}
			</div>
		</div>
	)
}
