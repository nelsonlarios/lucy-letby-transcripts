import { Link } from 'react-router'
import type { TranscriptManifest } from '../parser/types'
import { groupedSections } from '../lib/navigation'
import { formatDayLabel, formatShortDate } from '../lib/dates'

export function TrialIndex({
	manifest,
	idPrefix = 'section',
}: {
	manifest: TranscriptManifest
	idPrefix?: string
}) {
	const sections = groupedSections(manifest)

	return (
		<div className="trial-index">
			{sections.map((section) => {
				const sectionId = `${idPrefix}-${slug(section.name)}`

				return (
					<section key={section.name} id={sectionId}>
						<h2 className="index-heading">{section.name}</h2>
						{section.transcripts.map((transcript) => (
							<Link
								key={transcript.day}
								className="day-row"
								to={`/transcripts/${transcript.day}`}
							>
								<span className="day-row__num">
									{formatDayLabel(transcript.day)}
								</span>
								<span className="day-row__date">
									{formatShortDate(transcript.date)}
								</span>
								<span className="day-row__title">{transcript.title}</span>
							</Link>
						))}
					</section>
				)
			})}
		</div>
	)
}

function slug(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}
