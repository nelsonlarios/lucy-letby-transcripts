import { highlightParts } from '../lib/highlight'
import { BookmarkIcon, CopyIcon, LinkIcon } from './Icons'
import type { TranscriptBlock } from '../parser/types'

export function PassageBlock({
	block,
	query,
	bookmarked,
	active,
	onCopy,
	onLink,
	onBookmark,
}: {
	block: TranscriptBlock
	query?: string
	bookmarked: boolean
	active: boolean
	onCopy: () => void
	onLink: () => void
	onBookmark: () => void
}) {
	const hasSpeaker = Boolean(block.speaker)
	const classes = [
		'passage',
		`passage--${block.type}`,
		hasSpeaker && block.type === 'speaker' ? 'passage--turn' : null,
		hasSpeaker && block.type === 'paragraph' ? 'passage--follow' : null,
		active ? 'is-flash' : null,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<article
			id={block.id}
			className={classes}
			tabIndex={-1}
		>
			{hasSpeaker ? (
				<div className="passage__speaker">{block.speaker}</div>
			) : null}
			<div className="passage__text">
				<HighlightedText text={block.text} query={query} />
				<div className="passage-actions">
					<button
						type="button"
						className="icon-button"
						aria-label="Copy passage"
						onClick={onCopy}
					>
						<CopyIcon />
					</button>
					<button
						type="button"
						className="icon-button"
						aria-label="Copy link to passage"
						onClick={onLink}
					>
						<LinkIcon />
					</button>
					<button
						type="button"
						className="icon-button"
						aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark passage'}
						aria-pressed={bookmarked}
						onClick={onBookmark}
					>
						<BookmarkIcon fill={bookmarked ? 'currentColor' : 'none'} />
					</button>
				</div>
			</div>
		</article>
	)
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
	if (!query) {
		return text
	}

	return highlightParts(text, query).map((part, index) =>
		part.match ? <mark key={index}>{part.text}</mark> : part.text,
	)
}
