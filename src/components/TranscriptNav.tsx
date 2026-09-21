import { NavLink } from 'react-router'
import type { TranscriptManifest } from '../parser/types'
import { groupedSections } from '../lib/navigation'
import { formatDayLabel } from '../lib/dates'

export function TranscriptNav({
	manifest,
	currentDay,
}: {
	manifest: TranscriptManifest
	currentDay?: number
}) {
	const sections = groupedSections(manifest)

	return (
		<nav aria-label="Trial days">
			{sections.map((section) => (
				<div className="reader-nav__group" key={section.name}>
					<div className="reader-nav__label">{section.name}</div>
					{section.transcripts.map((transcript) => (
						<NavLink
							key={transcript.day}
							to={`/transcripts/${transcript.day}`}
							className="reader-nav__link"
							aria-current={transcript.day === currentDay ? 'page' : undefined}
						>
							{formatDayLabel(transcript.day)}
							<span>{transcript.title}</span>
						</NavLink>
					))}
				</div>
			))}
		</nav>
	)
}
