import { Link } from 'react-router'
import { useMemo, useState } from 'react'
import { DocumentTitle } from '../components/DocumentTitle'
import { formatDayLabel } from '../lib/dates'
import { loadBookmarks, saveBookmarks, type Bookmark } from '../lib/storage'

export function BookmarksPage() {
	const [bookmarks, setBookmarks] = useState<Array<Bookmark>>(() =>
		loadBookmarks(),
	)
	const sorted = useMemo(
		() => [...bookmarks].sort((a, b) => b.createdAt - a.createdAt),
		[bookmarks],
	)

	function remove(id: string) {
		const next = bookmarks.filter((bookmark) => bookmark.id !== id)
		setBookmarks(next)
		saveBookmarks(next)
	}

	return (
		<main className="page search-page" id="content">
			<DocumentTitle title="Saved passages · Transcripts" />
			<p className="kicker">Local only</p>
			<h1 className="index-heading">Saved passages</h1>
			{sorted.length === 0 ? (
				<p className="empty">No bookmarks on this device yet.</p>
			) : (
				<div className="bookmark-list">
					{sorted.map((bookmark) => (
						<div key={bookmark.id} className="bookmark-item">
							<Link
								to={`/transcripts/${bookmark.day}#${bookmark.passageId}`}
							>
								<div className="search-result__meta">
									<span>{formatDayLabel(bookmark.day)}</span>
									<span>Source page {bookmark.page}</span>
								</div>
								<h2 className="search-result__title">{bookmark.title}</h2>
								<p className="search-result__excerpt">{bookmark.excerpt}</p>
							</Link>
							<button
								type="button"
								className="ghost-button"
								onClick={() => remove(bookmark.id)}
							>
								Remove
							</button>
						</div>
					))}
				</div>
			)}
		</main>
	)
}
